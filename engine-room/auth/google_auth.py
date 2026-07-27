"""Google OAuth 2.0 handler.

Handles code exchange, token refresh, and Google API client creation.
Tokens are stored encrypted via the db/sqlite.py module.
"""

from __future__ import annotations

import logging
import os

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
    """Load Google OAuth client config from environment."""
    return {
        "client_id": os.environ["GOOGLE_CLIENT_ID"],
        "client_secret": os.environ["GOOGLE_CLIENT_SECRET"],
        "redirect_uri": os.environ.get(
            "GOOGLE_REDIRECT_URI",
            "http://localhost:8000/v1/auth/callback",
        ),
    }


async def exchange_code(code: str) -> dict:
    """Exchange an OAuth authorization code for tokens.

    Returns dict with keys: access_token, refresh_token, expires_in, and user info.
    """
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

    # Fetch user profile with the access token
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
    """Refresh an expired access token.

    Returns dict with keys: access_token, expires_in.
    """
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


def build_google_client(service_name: str, version: str, access_token: str) -> Resource:
    """Build an authenticated Google API client.

    Example:
        drive_service = build_google_client('drive', 'v3', token)
    """
    creds = Credentials(token=access_token)
    return build(service_name, version, credentials=creds)


def get_auth_url() -> str:
    """Generate the Google OAuth consent URL for the frontend to redirect to."""
    config = _get_client_config()
    params = {
        "client_id": config["client_id"],
        "redirect_uri": config["redirect_uri"],
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent",
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return f"https://accounts.google.com/o/oauth2/v2/auth?{query}"