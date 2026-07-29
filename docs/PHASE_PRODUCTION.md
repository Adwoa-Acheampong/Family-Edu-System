# Production wiring

## Status

| Phase | Status |
|-------|--------|
| 1 Config + React Query + live Architect telemetry | Done |
| 2 React Router + Auth/UI context + protected routes | Done |
| 3 Analytics / System Config / System Settings | Done |
| 4 Server system routes registered + dotenv | Done |
| 5 Secrets + npm install + verify | **You** |

## Run (Windows)

```bat
cd C:\Users\lenovo\OneDrive\Desktop\Family-Edu-System
git pull origin main
npm install
copy .env.example .env
```

Edit `.env`:

```env
GEMINI_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
VITE_ENGINE_ROOM_URL=http://localhost:8000
PORT=3000
```

```bat
npm run dev
```

Smoke-test APIs:

```bat
curl http://localhost:3000/api/health
curl http://localhost:3000/api/system/status
curl "http://localhost:3000/api/analytics/summary?userId=aba"
```

App: http://localhost:3000/login

## Routes

| Path | Who |
|------|-----|
| `/login` | Public |
| `/dashboard` | Auth |
| `/learning-hub` | Auth |
| `/profile` | Auth |
| `/analytics` | Auth |
| `/system/config` | Admin |
| `/system/settings` | Admin |

## Production build

```bat
set NODE_ENV=production
npm run build
npm start
```
