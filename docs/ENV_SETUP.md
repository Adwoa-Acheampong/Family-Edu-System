# Environment setup — Google OAuth, AI keys, and other variables

You need **two** env files (secrets never go in git):

| File | Used by |
|------|---------|
| **Root** `.env` | Node bridge (`server.ts`) + Vite `VITE_*` at build/dev time |
| **`engine-room/.env`** | FastAPI Engine Room (OAuth tokens DB, OpenRouter/Gemini, Classroom, OCR) |

---

## Quick start (Windows)

```bat
setup-env.bat
```

Or:

```bat
copy .env.example .env
copy engine-room\.env.example engine-room\.env
python -c "import secrets; print(secrets.token_hex(32))"
```

Paste the key into `engine-room\.env` as `TOKEN_ENCRYPTION_KEY=...`

---

## 1. Google Cloud OAuth

Enable **Classroom API** + **Drive API**. Create a **Web** OAuth client.

Redirect URIs:

- `http://localhost:3000/api/auth/google/callback`
- `http://localhost:3000/`

Same `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` in root `.env` and `engine-room/.env`.

---

## 2. AI keys

### Gemini (required for OCR + Node chat)

[AI Studio](https://aistudio.google.com/apikey) → create key.

| Where | Uses |
|-------|------|
| Root `GEMINI_API_KEY` | Node `/api/ai-chat`, goals, curriculum |
| Engine Room `GEMINI_API_KEY` | **OCR** (`/v1/process-document`), chat fallback |

OCR uses **Gemini Vision** (`gemini-2.0-flash` by default; optional `GEMINI_OCR_MODEL=gemini-2.5-flash`). Supports PDF, PNG, JPEG, WebP.

### OpenRouter (Engine Room chat primary)

```env
OPENROUTER_API_KEY=sk-or-v1-...
```

---

## 3. Engine Room security

```env
TOKEN_ENCRYPTION_KEY=   # 64 hex chars
DATABASE_URL=sqlite+aiosqlite:///./engine_room.db
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

---

## 4. Optional

| Variable | Purpose |
|----------|---------|
| `NOTEBOOKLM_PROJECT_NUMBER` | Gemini Notebook Enterprise |
| `GEMINI_OCR_MODEL` | Override OCR model |

Baidu OCR has been **removed**. Do not set `BAIDU_*` keys.

---

## 5. Run

```bat
npm run dev
```

```bat
cd engine-room
.venv\Scripts\activate.bat
uvicorn main:app --reload --port 8000
```

```bat
curl http://localhost:8000/health/detail
```

Expect `"ocr": "gemini-vision"` and `"gemini": true` when keyed.

Upload OCR (no Drive):

```bat
curl -X POST http://localhost:8000/v1/process-document/upload -F "file=@scan.png"
```
