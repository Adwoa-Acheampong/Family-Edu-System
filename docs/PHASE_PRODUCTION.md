# Production wiring

## Status

| Phase | Item | Status |
|-------|------|--------|
| 1–5 | Config, Query, Router, system APIs, persistence, Learning Hub | Done |
| 6 | Kobby ← assignments API | Done |
| 7 | Badu ← assignments API | Done |
| 8 | Young learners ← API quest strip + games | Done |
| 9 | Plug secrets & run | **You** |

## All personas

| User | Dashboard |
|------|-----------|
| Aba | Live system / analytics / drive |
| Kobby | API quests + submit + smart goals |
| Badu | API lessons + checklist |
| Pappy, Seth, Kweku, Shee | Play/story UI **+** live quest strip from API |

Learning Hub is API-first for everyone.

## Run

```bat
git pull origin main
npm install
npm run dev
```

```bat
curl http://localhost:3000/api/assignments/seth
curl http://localhost:3000/api/assignments/pappy
```

Login as **Seth** or **Pappy** — strip under the header shows API quests; games still work below.
