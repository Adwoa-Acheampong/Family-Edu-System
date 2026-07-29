"""Versioned SQL migrations for Engine Room SQLite.

Usage:
  python -m db.migrate              # apply pending
  python -m db.migrate --status     # show applied / pending
  python -m db.migrate --dry-run    # list what would run

Migrations live in db/migrations/*.sql sorted by filename.
Each file is applied once inside a transaction and recorded in schema_migrations.
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import os
import re
import sys
from pathlib import Path

logger = logging.getLogger("engine_room.migrate")

MIGRATIONS_DIR = Path(__file__).resolve().parent / "migrations"
VERSION_RE = re.compile(r"^(\d+)_.*\.sql$", re.IGNORECASE)


def get_db_path() -> str:
    url = os.environ.get("DATABASE_URL", "sqlite+aiosqlite:///./engine_room.db")
    if ":///" in url:
        return url.split(":///", 1)[1]
    return "./engine_room.db"


def list_migration_files() -> list[tuple[str, Path]]:
    if not MIGRATIONS_DIR.is_dir():
        return []
    items: list[tuple[str, Path]] = []
    for path in sorted(MIGRATIONS_DIR.glob("*.sql")):
        m = VERSION_RE.match(path.name)
        if not m:
            logger.warning("Skipping non-versioned file: %s", path.name)
            continue
        items.append((m.group(1), path))
    return items


async def ensure_migrations_table(db) -> None:
    await db.execute(
        """
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
        """
    )
    await db.commit()


async def applied_versions(db) -> set[str]:
    await ensure_migrations_table(db)
    cursor = await db.execute("SELECT version FROM schema_migrations")
    rows = await cursor.fetchall()
    return {row[0] for row in rows}


async def migrate_up(*, dry_run: bool = False) -> list[str]:
    try:
        import aiosqlite
    except ImportError as e:
        raise ImportError("aiosqlite is required. pip install aiosqlite") from e

    db_path = get_db_path()
    parent = Path(db_path).resolve().parent
    parent.mkdir(parents=True, exist_ok=True)

    applied: list[str] = []
    async with aiosqlite.connect(db_path) as db:
        await ensure_migrations_table(db)
        done = await applied_versions(db)
        files = list_migration_files()

        for version, path in files:
            if version in done:
                continue
            sql = path.read_text(encoding="utf-8")
            logger.info("%s migration %s (%s)", "Would apply" if dry_run else "Applying", version, path.name)
            if dry_run:
                applied.append(version)
                continue
            try:
                await db.execute("BEGIN")
                await db.executescript(sql)
                await db.execute(
                    "INSERT INTO schema_migrations (version, name) VALUES (?, ?)",
                    (version, path.name),
                )
                await db.commit()
                applied.append(version)
                logger.info("Applied migration %s", version)
            except Exception:
                await db.rollback()
                logger.exception("Migration %s failed — rolled back", version)
                raise

    return applied


async def migration_status() -> dict:
    try:
        import aiosqlite
    except ImportError as e:
        raise ImportError("aiosqlite is required") from e

    db_path = get_db_path()
    files = list_migration_files()
    done: set[str] = set()
    if Path(db_path).exists():
        async with aiosqlite.connect(db_path) as db:
            done = await applied_versions(db)

    pending = [v for v, _ in files if v not in done]
    return {
        "database": db_path,
        "applied": sorted(done),
        "pending": pending,
        "files": [p.name for _, p in files],
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Engine Room DB migrations")
    parser.add_argument("--status", action="store_true", help="Show applied/pending")
    parser.add_argument("--dry-run", action="store_true", help="List pending only")
    args = parser.parse_args(argv)

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s  %(levelname)-5s  %(message)s",
        datefmt="%H:%M:%S",
    )

    if args.status:
        status = asyncio.run(migration_status())
        print(f"Database: {status['database']}")
        print(f"Applied:  {', '.join(status['applied']) or '(none)'}")
        print(f"Pending:  {', '.join(status['pending']) or '(none)'}")
        return 0

    applied = asyncio.run(migrate_up(dry_run=args.dry_run))
    if not applied:
        print("No pending migrations.")
    else:
        action = "Would apply" if args.dry_run else "Applied"
        print(f"{action}: {', '.join(applied)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
