# Production wiring

## Status

| Phase | Status |
|-------|--------|
| 1–4 Config, Query, Router, system APIs | Done |
| 5 Persistent settings + Learning Hub API | Done |
| 6 Analyst (Kobby) quests from assignments API | Done |
| 7 Secrets + run on your machine | **You** |

## Live dashboards

| User | Source |
|------|--------|
| Aba | `/api/system/status`, drive, analytics |
| Kobby | `GET /api/assignments/kobby`, submit, suggest-goals, analytics XP chart |
| Others | Interactive local UIs (games / stories) until Classroom per child |

## Run

```bat
git pull origin main
npm install
npm run dev
```

Test Kobby:

```bat
curl http://localhost:3000/api/assignments/kobby
```

Login as **Kobby** → quests load from API → Turn In → status becomes SUBMITTED on server store.
