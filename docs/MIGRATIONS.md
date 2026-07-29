# Database migrations — Engine Room

## Overview

Engine Room SQLite schema is managed by versioned SQL files:

```
engine-room/db/migrations/
  001_initial_schema.sql
  002_system_settings.sql
  003_assignment_cache.sql
```

Runner: `engine-room/db/migrate.py`

- Each file runs **once**
- Recorded in `schema_migrations`
- Failed migration **rolls back** (transaction)
- Applied automatically on **uvicorn startup** via `init_db()` → `migrate_up()`

---

## Commands

From `engine-room/` (venv active):

```bat
python -m db.migrate
python -m db.migrate --status
python -m db.migrate --dry-run
```

Windows PowerShell:

```powershell
cd engine-room
.\.venv\Scripts\Activate.ps1
python -m db.migrate --status
```

---

## Adding a migration

1. Create `db/migrations/004_your_change.sql` (zero-padded version prefix).
2. Use `CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS` where safe.
3. For column adds on SQLite: `ALTER TABLE ... ADD COLUMN ...` (no IF NOT EXISTS on older SQLite — keep migrations one-shot).
4. Run locally:

```bat
python -m db.migrate --dry-run
python -m db.migrate
python -m db.migrate --status
```

5. Commit the SQL file. Deploy runs migrate on process start and in CI.

---

## CI / CD

- **CI** (`ci.yml`): after pip install, runs `python -m db.migrate` against a temp DB path.
- **Engine Room deploy**: after `pip install`, runs `python -m db.migrate` on the server DB.
- **App startup**: `lifespan` → `init_db()` applies any pending files.

Never delete or rewrite an already-shipped migration file. Add a new numbered file instead.

---

## Production notes

- Backup `engine_room.db` before major deploys.
- `TOKEN_ENCRYPTION_KEY` is independent of schema migrations — changing it invalidates encrypted tokens, not tables.
- Node `data/*.json` is **not** part of this runner (file store). Prefer Engine Room SQLite for multi-instance settings going forward (`system_settings` table in `002`).
