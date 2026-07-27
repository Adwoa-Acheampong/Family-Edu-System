# Frontend ↔ Lightweight API (`server.ts`)

Base: same origin (dev: `http://localhost:3000`)

| Method | Path | Purpose |
|--------|------|--------|
| GET | `/api/health` | Liveness + whether Gemini/OAuth env present |
| GET | `/api/assignments/:userId` | Mock assignments for a persona id |
| POST | `/api/sync-classroom` | `{ userId, courseId? }` → assignments |
| GET | `/api/drive-usage?userId=` | Mock Drive quota |
| POST | `/api/suggest-goals` | Gemini quest suggestions |
| POST | `/api/ai-chat` | Persona-aware Gemini chat |
| POST | `/api/submit-assignment` | Mock turn-in; updates in-memory status |
| POST | `/api/generate-curriculum` | Gemini study block JSON |
| GET | `/api/auth/google/start` | OAuth URL (needs `GOOGLE_CLIENT_*`) |
| GET | `/api/auth/google/callback` | OAuth code exchange |
| POST | `/api/auth/google/refresh` | Refresh access token |
| GET | `/api/google/drive/files?sessionId=` | Drive list (live or mock) |
| GET | `/api/google/classroom/courses?sessionId=` | Courses (live or mock) |

## Persona prompts

`/api/ai-chat` matches **The Architect**, **Adventurer**, etc. via substring (not exact enum), so Seth/Adventurer works.

## Google next steps

1. Create OAuth Web client in Google Cloud
2. Enable Google Drive API + Google Classroom API
3. Fill `.env` from `.env.example`
4. Call `startGoogleOAuth()` from UI → open `authorizationUrl`
5. After redirect, store `google_session` query param
6. Pass `sessionId` into Drive/Classroom GETs

Heavy multi-tenant token isolation should still move to the Python **Engine Room** (`docs/ENGINE_ROOM_WORK_ORDER.md`).

## Production Engine Room path

Set `VITE_ENGINE_ROOM_URL` in the frontend environment. The Learning Hub then
uses the FastAPI Engine Room for:

- OAuth authorization-code return handling with state validation
- live Google Classroom course and assignment sync
- Drive-backed file and typed-response attachments followed by Classroom turn-in
- YouTube transcript ingestion and persisted lesson cards
- optional Gemini Notebook Enterprise notebook/source creation

Without `VITE_ENGINE_ROOM_URL`, the lightweight Node API and local demo data
remain available for development.
