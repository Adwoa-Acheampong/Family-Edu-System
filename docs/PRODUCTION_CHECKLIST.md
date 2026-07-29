# Family Edu Hub — Production Deploy Checklist

Use this in order. Do not skip health checks.

---

## 0. Pre-flight (local)

- [ ] `git pull origin main`
- [ ] `npm install` (root)
- [ ] Engine Room: `pip install -r engine-room/requirements.txt`
- [ ] Engine Room migrations: `cd engine-room && python -m db.migrate --status`
- [ ] No secrets committed

See also: [MIGRATIONS.md](./MIGRATIONS.md), [CI_CD.md](./CI_CD.md)

---

## 1. DNS & host

- [ ] Domain + HTTPS
- [ ] Node `:3000` internal; Engine Room `:8000` internal or proxied

---

## 2. Environment — Node (root `.env`)

```env
NODE_ENV=production
PORT=3000
APP_URL=https://edu.example.com
GEMINI_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://edu.example.com/api/auth/google/callback
VITE_APP_NAME=Family Edu Hub
VITE_ENGINE_ROOM_URL=https://edu.example.com/engine
```

- [ ] `VITE_*` set **before** `npm run build`

---

## 3. Environment — Engine Room

```env
TOKEN_ENCRYPTION_KEY=
DATABASE_URL=sqlite+aiosqlite:///./engine_room.db
CORS_ORIGINS=https://edu.example.com
OPENROUTER_API_KEY=
GEMINI_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

- [ ] Backup `TOKEN_ENCRYPTION_KEY` offline
- [ ] DB path writable

---

## 4. Migrations (required on every Engine Room deploy)

```bat
cd engine-room
python -m db.migrate --status
python -m db.migrate
```

Also runs automatically on uvicorn startup. CI and `engine-room-deploy.yml` run migrate explicitly.

---

## 5. Build & run

```bat
set NODE_ENV=production
npm run build
npm start
```

Engine Room: `uvicorn main:app --host 127.0.0.1 --port 8000`

---

## 6. Smoke tests

```bash
curl -s https://edu.example.com/api/health
curl -s https://edu.example.com/api/system/status
curl -s https://edu.example.com/engine/health
```

- [ ] Login + Aba/Kobby/Badu/Seth paths work
- [ ] SPA deep links do not 404

---

## 7. Security & backups

- [ ] HTTPS only; `.env` not in git
- [ ] Backup `engine_room.db` **before** migrations on major releases
- [ ] Backup `data/*.json` (Node settings)
- [ ] Previous `dist/` kept for rollback
