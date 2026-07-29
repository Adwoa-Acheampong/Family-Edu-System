# Production wiring — deploy today

## Phase status

| Phase | Status |
|-------|--------|
| 1 Config + React Query + live Architect telemetry | Done |
| 2 React Router + Auth/UI context + protected routes | Done |
| 3 Analytics / System Config / System Settings pages | Done |
| 4 Plug secrets + `npm install` + run | **You** |

## Install & run (Windows)

```bat
cd C:\Users\lenovo\OneDrive\Desktop\Family-Edu-System
git pull origin main
npm install
copy .env.example .env
notepad .env
```

Set at minimum:

```env
GEMINI_API_KEY=...
# optional
VITE_ENGINE_ROOM_URL=http://localhost:8000
```

```bat
npm run dev
```

Open `http://localhost:3000/login`.

## Routes

| Path | Access |
|------|--------|
| `/login` | Public |
| `/dashboard` | Auth |
| `/learning-hub` | Auth |
| `/profile` | Auth |
| `/analytics` | Auth |
| `/system/config` | Admin (Aba) |
| `/system/settings` | Admin |

## API (Node)

- `GET /api/system/status` — latency, keys, event log
- `GET /api/analytics/summary?userId=` — charts + curriculum milestones
- `GET/PUT /api/system/settings` — persisted runtime settings (in-memory; swap DB later)

Ensure `server.ts` calls `registerSystemRoutes(app, mockAssignments)` (see import at top of server).

## Next hardening (post-launch)

- Persist `systemSettingsStore` to SQLite/Postgres
- Replace assignment store with live Classroom only
- Remove remaining persona mock quests when Classroom is live for kids
