# Family Edu System — AI Engine Room

Local **FastAPI** orchestrator (port **8000**) between the React dashboard and Google Workspace / OCR / LLMs.

## Quick start

```bash
cd engine-room
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Set TOKEN_ENCRYPTION_KEY:
python -c "import secrets; print(secrets.token_hex(32))"
# Paste into .env — also set GEMINI_API_KEY and/or OPENROUTER_API_KEY
uvicorn main:app --reload --port 8000
curl http://localhost:8000/health
```

## Frontend wiring

In the app root `.env` / AI Studio secrets:

```bash
VITE_ENGINE_ROOM_URL=http://localhost:8000
```

`src/lib/api.ts` will route chat, classroom, drive, and curriculum to `/v1/*`.

Authenticated Google calls send:

- `Authorization: Bearer <access_token>`
- `X-Google-User-Id: <google_user_id>` (enables auto token refresh from SQLite)

## Fixes in v1.1

- `Authorization` bound via FastAPI `Header()`
- Fernet key derived correctly from 64-char hex `TOKEN_ENCRYPTION_KEY`
- Persona normalization (`The Architect` → `Architect`, includes **Adventurer**)
- Auto-refresh of Google tokens when `X-Google-User-Id` is present
- `python-multipart` for file uploads

## API

| Method | Path | Auth |
|--------|------|------|
| GET | `/health` | No |
| POST | `/v1/auth/exchange-code` | No |
| POST | `/v1/auth/refresh` | No |
| GET | `/v1/auth/url` | No |
| GET | `/v1/drive-usage` | Bearer |
| POST | `/v1/drive/ensure-folders` | Bearer |
| POST | `/v1/sync-classroom` | Bearer |
| POST | `/v1/submit-assignment` | Bearer + multipart |
| POST | `/v1/process-document` | Bearer |
| POST | `/v1/ai-chat` | No (AI keys only) |
| POST | `/v1/generate-curriculum` | No |
| GET | `/v1/progress-analytics` | Optional |

## Security

1. One user’s token only per request  
2. Tokens encrypted at rest (Fernet)  
3. Never commit `.env` or `engine_room.db`  
