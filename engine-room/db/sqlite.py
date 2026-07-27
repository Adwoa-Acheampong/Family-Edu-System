"""Encrypted token and profile store using SQLite + Fernet.

Stores Google OAuth tokens encrypted at rest. Each user's tokens are
keyed by their Google user ID. The encryption key is provided via the
TOKEN_ENCRYPTION_KEY environment variable (32-byte hex).
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from typing import Optional

from cryptography.fernet import Fernet

try:
    import aiosqlite
except ImportError:
    aiosqlite = None  # type: ignore[assignment]

logger = logging.getLogger("engine_room.db")

_DB_PATH: str | None = None
_encryption_key: bytes | None = None


def _get_fernet() -> Fernet:
    global _encryption_key
    if _encryption_key is None:
        raw = os.environ.get("TOKEN_ENCRYPTION_KEY", "")
        if len(raw) != 64:
            raise RuntimeError(
                "TOKEN_ENCRYPTION_KEY must be a 32-byte hex string (64 hex chars). "
                "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
            )
        _encryption_key = bytes.fromhex(raw)
    return Fernet(_encryption_key)


def get_db_path() -> str:
    global _DB_PATH
    if _DB_PATH is None:
        url = os.environ.get("DATABASE_URL", "sqlite+aiosqlite:///./engine_room.db")
        # Handle sqlite+aiosqlite:///path or sqlite:///path
        if ":///" in url:
            _DB_PATH = url.split(":///")[1]
        else:
            _DB_PATH = "./engine_room.db"
    return _DB_PATH


async def init_db() -> None:
    """Create tables if they don't exist."""
    if aiosqlite is None:
        raise ImportError("aiosqlite is required. Install with: pip install aiosqlite")

    db_path = get_db_path()
    logger.info("Initializing database at %s", db_path)
    async with aiosqlite.connect(db_path) as db:
        db.row_factory = aiosqlite.Row
        await db.executescript("""
            CREATE TABLE IF NOT EXISTS tokens (
                google_user_id TEXT PRIMARY KEY,
                access_token_encrypted TEXT NOT NULL,
                refresh_token_encrypted TEXT NOT NULL,
                token_expiry TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS profiles (
                google_user_id TEXT PRIMARY KEY,
                display_name TEXT NOT NULL,
                email TEXT NOT NULL,
                picture TEXT,
                persona TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS conversations (
                conversation_id TEXT PRIMARY KEY,
                google_user_id TEXT NOT NULL,
                persona TEXT NOT NULL,
                title TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
        """)
        await db.commit()
    logger.info("Database initialized successfully")


# ─── Token store ───────────────────────────────────────────────────────

async def save_tokens(
    google_user_id: str,
    access_token: str,
    refresh_token: str,
    expires_in: int = 3600,
) -> None:
    """Encrypt and store OAuth tokens."""
    if aiosqlite is None:
        raise ImportError("aiosqlite is required")
    fernet = _get_fernet()
    expiry = datetime.now(timezone.utc).timestamp() + expires_in
    expiry_str = datetime.fromtimestamp(expiry, tz=timezone.utc).isoformat()

    async with aiosqlite.connect(get_db_path()) as db:
        await db.execute(
            """INSERT OR REPLACE INTO tokens
               (google_user_id, access_token_encrypted, refresh_token_encrypted,
                token_expiry, updated_at)
               VALUES (?, ?, ?, ?, datetime('now'))""",
            (
                google_user_id,
                fernet.encrypt(access_token.encode()).decode(),
                fernet.encrypt(refresh_token.encode()).decode(),
                expiry_str,
            ),
        )
        await db.commit()


async def get_tokens(google_user_id: str) -> Optional[dict]:
    """Retrieve and decrypt tokens for a user.

    Returns dict with keys: access_token, refresh_token, token_expiry
    or None if not found.
    """
    if aiosqlite is None:
        raise ImportError("aiosqlite is required")
    fernet = _get_fernet()

    async with aiosqlite.connect(get_db_path()) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM tokens WHERE google_user_id = ?",
            (google_user_id,),
        )
        row = await cursor.fetchone()

    if row is None:
        return None

    return {
        "access_token": fernet.decrypt(row["access_token_encrypted"].encode()).decode(),
        "refresh_token": fernet.decrypt(row["refresh_token_encrypted"].encode()).decode(),
        "token_expiry": row["token_expiry"],
    }


async def delete_tokens(google_user_id: str) -> None:
    """Remove a user's tokens (e.g. on logout)."""
    if aiosqlite is None:
        raise ImportError("aiosqlite is required")
    async with aiosqlite.connect(get_db_path()) as db:
        await db.execute("DELETE FROM tokens WHERE google_user_id = ?", (google_user_id,))
        await db.commit()


# ─── Profile store ─────────────────────────────────────────────────────

async def save_profile(
    google_user_id: str,
    display_name: str,
    email: str,
    picture: Optional[str] = None,
    persona: Optional[str] = None,
) -> None:
    """Store or update a user profile."""
    if aiosqlite is None:
        raise ImportError("aiosqlite is required")
    async with aiosqlite.connect(get_db_path()) as db:
        await db.execute(
            """INSERT OR REPLACE INTO profiles
               (google_user_id, display_name, email, picture, persona, updated_at)
               VALUES (?, ?, ?, ?, ?, datetime('now'))""",
            (google_user_id, display_name, email, picture, persona),
        )
        await db.commit()


async def get_profile(google_user_id: str) -> Optional[dict]:
    """Retrieve a user profile."""
    if aiosqlite is None:
        raise ImportError("aiosqlite is required")
    async with aiosqlite.connect(get_db_path()) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM profiles WHERE google_user_id = ?",
            (google_user_id,),
        )
        row = await cursor.fetchone()
    return dict(row) if row else None


# ─── Conversation store ────────────────────────────────────────────────

async def save_conversation(
    conversation_id: str,
    google_user_id: str,
    persona: str,
    title: Optional[str] = None,
) -> None:
    """Track a conversation session."""
    if aiosqlite is None:
        raise ImportError("aiosqlite is required")
    async with aiosqlite.connect(get_db_path()) as db:
        await db.execute(
            """INSERT OR REPLACE INTO conversations
               (conversation_id, google_user_id, persona, title, updated_at)
               VALUES (?, ?, ?, ?, datetime('now'))""",
            (conversation_id, google_user_id, persona, title),
        )
        await db.commit()