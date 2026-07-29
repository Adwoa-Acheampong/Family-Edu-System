"""Migration runner tests — uses temp DATABASE_URL."""

from __future__ import annotations

import os
from pathlib import Path

import pytest


@pytest.fixture
 def tmp_db(tmp_path: Path, monkeypatch):
    db_file = tmp_path / "test_migrate.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite+aiosqlite:///{db_file}")
    yield db_file


@pytest.mark.asyncio
async def test_migrate_up_applies_all(tmp_db):
    from db.migrate import migrate_up, migration_status

    applied = await migrate_up()
    assert len(applied) >= 1

    status = await migration_status()
    assert status["pending"] == []
    assert "001" in status["applied"]

    # Second run is no-op
    again = await migrate_up()
    assert again == []


@pytest.mark.asyncio
async def test_schema_tables_exist(tmp_db):
    import aiosqlite
    from db.migrate import migrate_up

    await migrate_up()
    async with aiosqlite.connect(tmp_db) as db:
        cursor = await db.execute(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        )
        names = {row[0] for row in await cursor.fetchall()}
    assert "tokens" in names
    assert "profiles" in names
    assert "lessons" in names
    assert "schema_migrations" in names
    assert "system_settings" in names
    assert "assignment_cache" in names
