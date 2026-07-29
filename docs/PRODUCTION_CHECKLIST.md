# Family Edu Hub — Production Deploy Checklist

Use this in order. Do not skip health checks.

---

## 0. Pre-flight (local)

- [ ] `git pull origin main`
- [ ] `npm install` (root)
- [ ] Engine Room: `pip install -r engine-room/requirements.txt` (if deploying backend)
- [ ] `npm run lint` passes (or known acceptable errors only)
- [ ] No secrets committed (`.env` gitignored; scan for `sk-` / `AIza`)

---

## 1. DNS & host

- [ ] Domain ready (e.g. `edu.yourfamily.tld`)
- [ ] HTTPS certificate (Let's Encrypt / Cloudflare / platform SSL)
- [ ] Firewall: only `80`/`443` public; Node port and `8000` internal or reverse-proxied

**Recommended layout**

| Service | Internal | Public |
|---------|----------|--------|
| Node bridge + SPA | `127.0.0.1:3000` | `https://edu.example.com` |
| Engine Room FastAPI | `127.0.0.1:8000` | Not public (or `/engine` via proxy) |

---

## 2. Environment — Node (root `.env`)

Copy from `.env.example`. **Never** use `VITE_` for secrets.

```env
NODE_ENV=production
PORT=3000
APP_URL=https://edu.example.com

# Required for real AI on Node chat/goals
GEMINI_API_KEY=

# Google OAuth (Node callback path)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://edu.example.com/api/auth/google/callback

# Frontend build-time (set before `npm run build`)
VITE_APP_NAME=Family Edu Hub
VITE_API_BASE_URL=
VITE_ENGINE_ROOM_URL=https://edu.example.com/engine
# Or absolute internal URL only if browser can reach it:
# VITE_ENGINE_ROOM_URL=https://engine.example.com
VITE_POLL_INTERVAL_MS=15000
VITE_HEALTH_POLL_MS=10000
VITE_ENABLE_ANALYTICS=true
```

- [ ] `APP_URL` is production HTTPS URL
- [ ] `GOOGLE_REDIRECT_URI` matches Google Cloud Console exactly
- [ ] `VITE_*` set **before** build (Vite inlines them)

---

## 3. Environment — Engine Room (`engine-room/.env`)

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://edu.example.com/

OPENROUTER_API_KEY=
GEMINI_API_KEY=

TOKEN_ENCRYPTION_KEY=   # 64 hex chars — generate once, never rotate lightly
DATABASE_URL=sqlite+aiosqlite:///./engine_room.db

CORS_ORIGINS=https://edu.example.com
LOG_LEVEL=INFO
```

Generate encryption key (once):

```bat
python -c "import secrets; print(secrets.token_hex(32))"
```

- [ ] `TOKEN_ENCRYPTION_KEY` set and backed up offline
- [ ] `CORS_ORIGINS` includes the exact SPA origin (no trailing slash mismatch)
- [ ] DB path writable by the process user

---

## 4. Google Cloud Console

- [ ] OAuth client type: Web application
- [ ] Authorized JavaScript origins: `https://edu.example.com`
- [ ] Authorized redirect URIs:
  - `https://edu.example.com/api/auth/google/callback` (Node)
  - `https://edu.example.com/` (Engine Room if used)
- [ ] APIs enabled: Google Classroom, Google Drive, People API (as needed)
- [ ] OAuth consent screen: test users added (if app is in Testing)

---

## 5. Build

```bat
cd Family-Edu-System
set NODE_ENV=production
npm run build
```

Expect:

- `dist/` — Vite static assets
- `dist/server.cjs` — bundled Node server

- [ ] Build exits 0
- [ ] `dist/index.html` exists
- [ ] `dist/server.cjs` exists

---

## 6. Run (production process)

**Node**

```bat
set NODE_ENV=production
npm start
```

Or process manager (recommended):

```bash
# example pm2
pm2 start dist/server.cjs --name family-edu-hub
pm2 save
```

**Engine Room** (separate process)

```bat
cd engine-room
.venv\Scripts\activate.bat
uvicorn main:app --host 127.0.0.1 --port 8000
```

- [ ] Node listens on intended port
- [ ] Engine Room only on localhost (or behind proxy)
- [ ] `data/` directory writable (settings + events JSON)

---

## 7. Reverse proxy (example Nginx)

```nginx
server {
  listen 443 ssl;
  server_name edu.example.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # Optional: expose Engine Room under /engine
  location /engine/ {
    proxy_pass http://127.0.0.1:8000/;
    proxy_set_header Host $host;
  }
}
```

If using `/engine` path, set:

```env
VITE_ENGINE_ROOM_URL=https://edu.example.com/engine
```

and rebuild. Ensure FastAPI `root_path` / proxy headers if needed.

---

## 8. Smoke tests (must pass)

```bash
curl -s https://edu.example.com/api/health
curl -s https://edu.example.com/api/system/status
curl -s "https://edu.example.com/api/analytics/summary?userId=aba"
curl -s https://edu.example.com/api/assignments/kobby
```

Browser:

- [ ] `https://edu.example.com/login` loads (not blank)
- [ ] Login as **Aba** → dashboard shows live status (not fake Mongo 99.9%)
- [ ] **Analytics** and **System Config** open (admin)
- [ ] Login as **Kobby** → quests from API; Turn In works
- [ ] Login as **Badu** → lesson from API
- [ ] Login as **Seth** → quest strip + games
- [ ] Learning Hub → Refresh loads assignments
- [ ] Engine Room AI chat works when keyed (OpenRouter or Gemini)
- [ ] Hard refresh / deep link `/dashboard` does not 404 (SPA fallback)

---

## 9. Security

- [ ] `.env` not in git; not world-readable on server
- [ ] HTTPS only (redirect HTTP → HTTPS)
- [ ] Google client secret only on server
- [ ] `TOKEN_ENCRYPTION_KEY` backed up; tokens unreadable without it
- [ ] CORS locked to production origin
- [ ] Rate-limit `/api/ai-chat` at proxy if public abuse is a risk
- [ ] Rotate keys if they ever appeared in chat/logs

---

## 10. Backups

- [ ] `engine-room/engine_room.db` (or Postgres) scheduled backup
- [ ] `data/system-settings.json` + `data/system-events.json`
- [ ] Offline copy of `TOKEN_ENCRYPTION_KEY`

---

## 11. Rollback

- [ ] Previous `dist/` tarball kept
- [ ] Previous git tag/commit known
- [ ] `pm2 restart` / redeploy previous artifact tested once

---

## Quick Windows local “production mode” test

```bat
cd C:\Users\lenovo\OneDrive\Desktop\Family-Edu-System
git pull origin main
npm install
copy .env.example .env
notepad .env
set NODE_ENV=production
npm run build
npm start
```

Open `http://localhost:3000/login`.

---

## Known production limits (honest)

- Assignment store on Node is in-memory + seed data until Classroom fully replaces it
- Settings persist to `data/*.json` (not multi-instance safe without shared disk/DB)
- Drive usage is estimated without a live Google token
- Young personas still use local games; quests are API-backed strips

When Classroom + Engine Room OAuth are live end-to-end, mark assignment store as “Classroom-only” and remove seed fallbacks.
