# Production wiring

## Status

| Phase | Status |
|-------|--------|
| 1 Config + React Query + live Architect telemetry | Done |
| 2 React Router + Auth/UI context + protected routes | Done |
| 3 Analytics / System Config / System Settings | Done |
| 4 Server system routes + dotenv | Done |
| 5 Persistent settings + Learning Hub from API | Done |
| 6 Plug secrets + run | **You** |

## Persistence

Settings and event log write to:

- `data/system-settings.json`
- `data/system-events.json`

Folder is gitignored. Survives `npm run dev` restarts on the same machine.

## Learning Hub data path

1. If Engine Room + Google session → Classroom sync  
2. Else → `GET /api/assignments/:userId` (Node store)  
3. Empty state if neither has rows  

No client-side `getMockAssignments` for the hub list.

## Run (Windows)

```bat
cd C:\Users\lenovo\OneDrive\Desktop\Family-Edu-System
git pull origin main
npm install
copy .env.example .env
npm run dev
```

Smoke:

```bat
curl http://localhost:3000/api/system/status
curl "http://localhost:3000/api/analytics/summary?userId=aba"
curl http://localhost:3000/api/assignments/aba
```

Save settings in UI (Aba → System Config), restart server, confirm values remain in `data/system-settings.json`.
