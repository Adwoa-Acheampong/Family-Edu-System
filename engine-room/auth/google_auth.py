"""Google OAuth 2.0 handler.

Handles code exchange, token refresh, valid-token resolution, and API clients.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import urlencode

import httpx
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import Resource, build

logger = logging.getLogger("engine_room.auth")

SCOPES = (
    "openid",
    "profile",
    "email",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/classroom.coursework.me",
    "https://www.googleapis.com/auth/classroom.rosters.readonly",
    "https://www.googleapis.com/auth/classroom.student-submissions.me",
)

_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token"
_OAUTH_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


def _get_client_config() -> dict:
    client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
    client_secret = os.environ.get("GOOGLE_CLIENT_SECRET", "")
    if not client_id or not client_secret:
        raise RuntimeError("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set")
    return {
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": os.environ.get(
            "GOOGLE_REDIRECT_URI",
            "http://localhost:8000/v1/auth/callback",
        ),
    }


async def exchange_code(code: str) -> dict:
    config = _get_client_config()

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            _OAUTH_TOKEN_URL,
            data={
                "code": code,
                "client_id": config["client_id"],
                "client_secret": config["client_secret"],
                "redirect_uri": config["redirect_uri"],
                "grant_type": "authorization_code",
            },
            headers={"Accept": "application/json"},
        )
        resp.raise_for_status()
        token_data = resp.json()

    async with httpx.AsyncClient() as client:
        user_resp = await client.get(
            _OAUTH_USERINFO_URL,
            headers={"Authorization": f"Bearer {token_data['access_token']}"},
        )
        user_resp.raise_for_status()
        user_info = user_resp.json()

    logger.info("OAuth exchange succeeded for user %s", user_info.get("email"))

    return {
        "access_token": token_data["access_token"],
        "refresh_token": token_data.get("refresh_token", ""),
        "expires_in": token_data.get("expires_in", 3600),
        "user": {
            "id": user_info["id"],
            "name": user_info.get("name", ""),
            "email": user_info.get("email", ""),
            "picture": user_info.get("picture"),
        },
    }


async def refresh_access_token(refresh_token: str) -> dict:
    config = _get_client_config()

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            _OAUTH_TOKEN_URL,
            data={
                "refresh_token": refresh_token,
                "client_id": config["client_id"],
                "client_secret": config["client_secret"],
                "grant_type": "refresh_token",
            },
            headers={"Accept": "application/json"},
        )
        resp.raise_for_status()
        data = resp.json()

    logger.info("Token refresh succeeded")
    return {
        "access_token": data["access_token"],
        "expires_in": data.get("expires_in", 3600),
    }


async def resolve_access_token(
    bearer_token: str,
    google_user_id: Optional[str] = None,
) -> str:
    """Return a usable Google access token.

    If google_user_id is provided, load encrypted tokens from DB and
    refresh when past token_expiry. Otherwise pass through the Bearer token.
    """
    if not google_user_id:
        return bearer_token

    from db.sqlite import get_tokens, save_tokens

    stored = await get_tokens(google_user_id)
    if not stored:
        return bearer_token

    expiry_raw = stored.get("token_expiry") or ""
    needs_refresh = True
    try:
        expiry = datetime.fromisoformat(expiry_raw)
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)
        needs_refresh = datetime.now(timezone.utc) >= expiry
    except ValueError:
        needs_refresh = True

    if not needs_refresh:
        return stored["access_token"] or bearer_token

    refresh = stored.get("refresh_token") or ""
    if not refresh:
        logger.warning("Token expired for %s but no refresh_token", google_user_id)
        return bearer_token

    try:
        result = await refresh_access_token(refresh)
        await save_tokens(
            google_user_id=google_user_id,
            access_token=result["access_token"],
            refresh_token=refresh,
            expires_in=result.get("expires_in", 3600),
        )
        return result["access_token"]
    except Exception as e:
        logger.error("Auto-refresh failed for %s: %s", google_user_id, e)
        return bearer_token


def build_google_client(service_name: str, version: str, access_token: str) -> Resource:
    creds = Credentials(token=access_token)
    return build(service_name, version, credentials=creds, cache_discovery=False)


def get_auth_url() -> str:
    config = _get_client_config()
    params = {
        "client_id": config["client_id"],
        "redirect_uri": config["redirect_uri"],
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent",
    }
    return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
