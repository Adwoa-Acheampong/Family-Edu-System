# Environment setup — Google OAuth, AI keys, and other variables

You need **two** env files (secrets never go in git):

| File | Used by |
|------|---------|
| **Root** `.env` | Node bridge (`server.ts`) + Vite `VITE_*` at build/dev time |
| **`engine-room/.env`** | FastAPI Engine Room (OAuth tokens DB, OpenRouter/Gemini, Classroom) |

---

## Quick start (Windows)

From the repo root:

```bat
setup-env.bat
```

Or manually:

```bat
copy .env.example .env
copy engine-room\.env.example engine-room\.env
python -c "import secrets; print(secrets.token_hex(32))"
```

Paste the printed key into `engine-room\.env` as `TOKEN_ENCRYPTION_KEY=...`

Then edit both files with your real keys (Notepad / VS Code).

---

## 1. Google Cloud OAuth (required for real Drive / Classroom)

### Create the project

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project (e.g. `family-edu-system`)
3. **APIs & Services → Library** — enable:
   - **Google Classroom API**
   - **Google Drive API**
   - **Google People API** (or use userinfo — already used by the app)

### OAuth consent screen

1. **APIs & Services → OAuth consent screen**
2. User type: **External** (or Internal if Workspace-only)
3. App name: `Family Edu Hub`
4. Support email: yours
5. Scopes (add when prompted / manually):
   - `openid`, `email`, `profile`
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/classroom.coursework.me`
   - `https://www.googleapis.com/auth/classroom.rosters.readonly`
   - `https://www.googleapis.com/auth/classroom.student-submissions.me`
6. **Test users**: add every family Gmail that will log in while the app is in **Testing**

### OAuth client

1. **Credentials → Create credentials → OAuth client ID**
2. Application type: **Web application**
3. Name: `Family Edu Hub Web`
4. **Authorized JavaScript origins**
   - `http://localhost:3000`
5. **Authorized redirect URIs** (must match env **exactly**):
   - Node callback: `http://localhost:3000/api/auth/google/callback`
   - Engine Room (if using ER auth URL): `http://localhost:3000/`
6. Copy **Client ID** and **Client secret**

### Put the same client in both env files

**Root `.env`**

```env
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
APP_URL=http://localhost:3000
```

**`engine-room/.env`**

```env
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
GOOGLE_REDIRECT_URI=http://localhost:3000/
```

> Redirect URIs differ on purpose: Node exchanges at `/api/auth/google/callback`; Engine Room’s `get_auth_url` defaults to app root. Add **both** URIs in Google Console.

### Verify OAuth

```bat
npm run dev
```

```bat
curl http://localhost:3000/api/health
```

Expect `"googleOAuthConfigured": true`.

Browser: open `http://localhost:3000/api/auth/google/start` — should return JSON with `authorizationUrl`. Visit that URL, consent, land on Learning Hub with `google_session=`.

---

## 2. AI keys

### A. Gemini (Node chat + goals + curriculum)

1. [Google AI Studio](https://aistudio.google.com/apikey) → Create API key
2. Root `.env`:

```env
GEMINI_API_KEY=AIza...
```

Optional copy in `engine-room/.env` as Gemini fallback.

### B. OpenRouter (Engine Room primary AI)

1. [OpenRouter](https://openrouter.ai/keys) → Create key
2. `engine-room/.env`:

```env
OPENROUTER_API_KEY=sk-or-v1-...
```

Engine Room order: **OpenRouter first**, then Gemini, then demo text.

Node chat uses **Gemini only** (`GEMINI_API_KEY`).

### Minimum for live AI in the UI

| Surface | Key |
|---------|-----|
| In-app chat via Node `/api/ai-chat` | Root `GEMINI_API_KEY` |
| Engine Room `/v1/ai-chat` | `OPENROUTER_API_KEY` **or** `GEMINI_API_KEY` |

---

## 3. Engine Room security & DB

```env
# Required before storing Google tokens encrypted
TOKEN_ENCRYPTION_KEY=   # 64 hex chars — generate once, never change lightly

DATABASE_URL=sqlite+aiosqlite:///./engine_room.db
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
LOG_LEVEL=INFO
```

Generate:

```bat
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## 4. Frontend (Vite) variables

Root `.env` (restart `npm run dev` after changes):

```env
VITE_APP_NAME=Family Edu Hub
VITE_API_BASE_URL=
VITE_ENGINE_ROOM_URL=http://localhost:8000
VITE_POLL_INTERVAL_MS=15000
VITE_HEALTH_POLL_MS=10000
VITE_ENABLE_ANALYTICS=true
```

Empty `VITE_API_BASE_URL` = same origin as the Node server (correct for `npm run dev`).

---

## 5. Optional keys

| Variable | Where | Purpose |
|----------|--------|---------|
| `BAIDU_API_KEY` / `BAIDU_SECRET_KEY` | engine-room | OCR |
| `NOTEBOOKLM_PROJECT_NUMBER` | engine-room | Gemini Notebook Enterprise |
| `NOTEBOOKLM_LOCATION` | engine-room | default `global` |

Leave blank if unused.

---

## 6. Full local stack

**Terminal 1 — Node + frontend**

```bat
cd Family-Edu-System
npm run dev
```

**Terminal 2 — Engine Room**

```bat
cd Family-Edu-System\engine-room
python -m venv .venv
.venv\Scripts\activate.bat
pip install -r requirements.txt
python -m db.migrate
uvicorn main:app --reload --port 8000
```

Checks:

```bat
curl http://localhost:3000/api/health
curl http://localhost:8000/health
```

---

## 7. Finding keys already in VS Code

If OpenRouter / Gemini were saved earlier:

1. VS Code → search workspace for `OPENROUTER` or `AIza` (do not commit results)
2. Windows User env vars: Settings → System → About → Advanced → Environment Variables
3. `.env` files on Desktop/OneDrive copies of the repo
4. OpenRouter dashboard shows existing keys (you can create a new one anytime)

---

## 8. Production differences

| Variable | Local | Production |
|----------|-------|------------|
| `APP_URL` | `http://localhost:3000` | `https://edu.example.com` |
| `GOOGLE_REDIRECT_URI` | localhost callback | `https://edu.example.com/api/auth/google/callback` |
| `CORS_ORIGINS` | localhost | production origin only |
| `VITE_ENGINE_ROOM_URL` | `http://localhost:8000` | public `/engine` or internal URL |

Add production origins + redirect URIs in Google Console before go-live.

---

## 9. Security checklist

- [ ] `.env` and `engine-room/.env` are in `.gitignore`
- [ ] Never paste secrets into chat or commit messages
- [ ] `TOKEN_ENCRYPTION_KEY` backed up offline
- [ ] OAuth client secret only on server
- [ ] Rotate keys if they ever leaked
