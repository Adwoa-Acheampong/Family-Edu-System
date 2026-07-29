# Production wiring

## Status

| Phase | Item | Status |
|-------|------|--------|
| 1–5 | Config, Query, Router, system APIs, persistence, Learning Hub | Done |
| 6 | Kobby Analyst ← assignments API | Done |
| 7 | Badu Master ← assignments API + `useAssignments` hook | Done |
| 8 | Plug secrets & run | **You** |

## Live dashboards

| User | Dashboard |
|------|-----------|
| Aba | Architect — system status / analytics / drive |
| Kobby | Analyst — API quests, submit, smart goals |
| Badu | Master — API lessons, continue + checklist |
| Pappy, Seth, Kweku, Shee | Age-play UIs (local games); Learning Hub still API |

## Shared hook

`src/hooks/useAssignments.ts` — load + submit for any persona.

## Run

```bat
git pull origin main
npm install
npm run dev
```

```bat
curl http://localhost:3000/api/assignments/badu
```

Login as **Badu** → current lesson from API → Continue → Turn In.
