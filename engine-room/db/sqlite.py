"""Encrypted token and profile store using SQLite + Fernet.

TOKEN_ENCRYPTION_KEY must be 64 hex characters (32 bytes).
We derive a valid Fernet key via url-safe base64 encoding of those bytes.
Generate: python -c "import secrets; print(secrets.token_hex(32))"

Schema changes go in db/migrations/*.sql and are applied by db.migrate.
"""

from __future__ import annotations

import base64
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

_fernet: Fernet | None = None


def _get_fernet() -> Fernet:
    global _fernet
    if _fernet is not None:
        return _fernet

    raw = os.environ.get("TOKEN_ENCRYPTION_KEY", "").strip()
    if len(raw) != 64:
        raise RuntimeError(
            "TOKEN_ENCRYPTION_KEY must be a 32-byte hex string (64 hex chars). "
            'Generate one with: python -c "import secrets; print(secrets.token_hex(32))"'
        )
    try:
        key_bytes = bytes.fromhex(raw)
    except ValueError as e:
        raise RuntimeError("TOKEN_ENCRYPTION_KEY must be valid hex") from e

    fernet_key = base64.urlsafe_b64encode(key_bytes)
    _fernet = Fernet(fernet_key)
    return _fernet


def get_db_path() -> str:
    url = os.environ.get("DATABASE_URL", "sqlite+aiosqlite:///./engine_room.db")
    if ":///" in url:
        return url.split(":///", 1)[1]
    return "./engine_room.db"


async def init_db() -> None:
    """Apply all pending SQL migrations (idempotent)."""
    if aiosqlite is None:
        raise ImportError("aiosqlite is required. Install with: pip install aiosqlite")

    from db.migrate import migrate_up

    db_path = get_db_path()
    logger.info("Running migrations for database at %s", db_path)
    applied = await migrate_up()
    if applied:
        logger.info("Applied migrations: %s", ", ".join(applied))
    else:
        logger.info("Database schema up to date")


async def save_tokens(
    google_user_id: str,
    access_token: str,
    refresh_token: str,
    expires_in: int = 3600,
) -> None:
    if aiosqlite is None:
        raise ImportError("aiosqlite is required")
    fernet = _get_fernet()
    expiry = datetime.now(timezone.utc).timestamp() + max(expires_in - 60, 60)
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
                fernet.encrypt((refresh_token or "").encode()).decode(),
                expiry_str,
            ),
        )
        await db.commit()


async def get_tokens(google_user_id: str) -> Optional[dict]:
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
    if aiosqlite is None:
        raise ImportError("aiosqlite is required")
    async with aiosqlite.connect(get_db_path()) as db:
        await db.execute("DELETE FROM tokens WHERE google_user_id = ?", (google_user_id,))
        await db.commit()


async def save_profile(
    google_user_id: str,
    display_name: str,
    email: str,
    picture: Optional[str] = None,
    persona: Optional[str] = None,
) -> None:
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


async def save_conversation(
    conversation_id: str,
    google_user_id: str,
    persona: str,
    title: Optional[str] = None,
) -> None:
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


async def save_lesson(lesson) -> None:
    if aiosqlite is None:
        raise ImportError("aiosqlite is required")
    await init_db()
    async with aiosqlite.connect(get_db_path()) as db:
        await db.execute(
            """INSERT OR REPLACE INTO lessons
               (lesson_id, user_id, lesson_json, created_at)
               VALUES (?, ?, ?, ?)""",
            (
                lesson.id,
                lesson.userId,
                lesson.model_dump_json(),
                lesson.createdAt.isoformat(),
            ),
        )
        await db.commit()


async def list_lessons(user_id: str):
    if aiosqlite is None:
        raise ImportError("aiosqlite is required")
    from models.schemas import LessonResource

    await init_db()
    async with aiosqlite.connect(get_db_path()) as db:
        cursor = await db.execute(
            """SELECT lesson_json FROM lessons
               WHERE user_id = ?
               ORDER BY created_at DESC""",
            (user_id,),
        )
        rows = await cursor.fetchall()
    return [LessonResource.model_validate_json(row[0]) for row in rows]
