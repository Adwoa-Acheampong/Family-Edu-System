# Engine Room Work Order

**Agent:** DeepSeek / Qwen (primary Python backend builders)  
**Optional reviewer:** Claude  
**Repo:** `Adwoa-Acheampong/Family-Edu-System`  
**Master Spec:** `SYSTEM_DOCUMENTATION.md` §§2, 4, 5, 11, 14  
**Runtime target:** Local laptop (family AI Engine Room)

---

## Mission

Build the **local AI Engine Room**: a FastAPI orchestrator that sits between the React dashboard and Google Workspace / OCR / LLMs.  
Frontend (GenAI) already exists with mocks — your APIs must match the contracts below so the UI can switch over cleanly.

---

## Create this tree

```text
engine-room/
├── main.py                 # FastAPI app entry
├── requirements.txt
├── .env.example
├── README.md
├── auth/
│   └── google_auth.py      # OAuth exchange, refresh, token store
├── services/
│   ├── drive.py            # Drive folder + upload + quota
│   ├── classroom.py        # CourseWork, submissions, turn-in
│   ├── ocr.py              # Baidu OCR pipeline
│   ├── ai_chat.py          # OpenRouter + persona injection (and/or Gemini)
│   └── curriculum.py       # Generate study blocks
├── db/
│   └── sqlite.py           # Encrypted/local token + profile store
├── models/
│   └── schemas.py          # Pydantic models
└── tests/
    └── test_health.py
```

> Note: GenAI currently serves some AI routes from root `server.ts`. Prefer **new** routes under Engine Room on port **8000**. GenAI will point `VITE_ENGINE_ROOM_URL` at you later.

---

## Phase 1 — Foundation (Days 1–3)

### D1.4 FastAPI base
- [ ] FastAPI app with CORS allowing the dashboard origin
- [ ] Health: `GET /health` → `{ "status": "ok" }`
- [ ] Pydantic schemas: `UserProfile`, `Assignment`, `SubmissionRequest`, `ChatRequest`, `DriveUsage`
- [ ] Structured logging

### D1.5 Google Auth Handler
- [ ] `POST /v1/auth/exchange-code` `{ code }` → tokens + basic profile
- [ ] `POST /v1/auth/refresh` `{ refresh_token }` → new access_token
- [ ] Store tokens encrypted at rest (SQLCipher or Fernet + SQLite minimum)
- [ ] Scopes (from master doc):
  - `profile`, `email`
  - `drive.file`
  - `classroom.coursework.me`
  - `classroom.rosters.readonly` (or as approved)
  - `classroom.student-submissions.me`
- [ ] **No password storage**; OAuth only for adult Google accounts

### D1.6 Drive folder creator
- [ ] On first login: ensure `Educational ERP/` tree exists (Study Materials, Assignments, Submissions, Archives)
- [ ] `GET /v1/drive-usage` → `{ used, total, percentage, free }`

### Acceptance Phase 1
- Exchange + refresh works with a real Google Cloud OAuth client (credentials via env)
- Tokens survive process restart
- Drive usage returns plausible numbers for the authenticated user

---

## Phase 2 — LMS core (Days 4–7)

### D2.1 Classroom sync
- [ ] `POST /v1/sync-classroom` `{ courseId? }`
- [ ] Returns assignments with: id, title, description, dueDate, state, submissionState, maxPoints
- [ ] Filter/annotate by current user when possible

### D2.2 Unified Submission (critical)
- [ ] `POST /v1/submit-assignment` (multipart)
  - Fields: `courseId`, `courseWorkId`, `file?`, `textResponse?`
  - Flow: upload file to Drive (user’s Educational ERP/Submissions) → patch Classroom submission attachments → `turnIn`
  - Response: `{ status: "submitted", submissionId, driveFileId? }`
- [ ] Idempotent where practical; clear 4xx on missing scopes

### D2.3 Baidu OCR
- [ ] `POST /v1/process-document` `{ driveFileId, fileType }`
- [ ] Download from Drive → OCR → return `{ text, markdown }`
- [ ] Env: `BAIDU_API_KEY`, `BAIDU_SECRET_KEY`

### Acceptance Phase 2
- One full path: sync assignment → submit file → appears turned in on Classroom
- OCR returns text for a sample PDF in Drive

---

## Phase 3 — AI routes (align with GenAI)

GenAI already implements chat/goals on Node. Mirror contracts so UI can migrate:

### Endpoints
- [ ] `POST /v1/ai-chat`  
  Body: `{ message, persona, conversationId? }` (+ server loads profile)  
  Inject system prompts from SYSTEM_DOCUMENTATION §13  
  Prefer OpenRouter model per persona matrix (§3.1); fallback Gemini if key present

- [ ] `POST /v1/generate-curriculum`  
  Body: `{ persona, topic, goalId? }` → study materials + assignment draft

- [ ] `POST /v1/suggest-goals` (optional parity with existing Node route)

### Persona → model map (default)
| Persona | Model |
|---------|--------|
| Architect (Aba) | `anthropic/claude-3.5-sonnet` (or current Claude equivalent on OpenRouter) |
| Master (Badu) | `meta-llama/llama-3-70b-instruct` |
| Analyst (Kobby) | `openai/gpt-4o` |
| Explorer / Discoverer / Seedling | `google/gemini-pro` or Gemini API direct |

### Local LLM (optional Phase 3+)
- [ ] Ollama connector for DeepSeek/Qwen summarization when offline

---

## Phase 4 — Hardening

- [ ] Rate limiting (OpenRouter / Baidu / Google)
- [ ] `GET /v1/progress-analytics` stub → completion % + streak
- [ ] WebSocket or SSE hook for “grade ready” notifications (can be stub)
- [ ] Never log raw tokens or full PII
- [ ] Respect constraints in SYSTEM_DOCUMENTATION §11

---

## Environment template (`engine-room/.env.example`)

```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8000/v1/auth/callback

OPENROUTER_API_KEY=
GEMINI_API_KEY=

BAIDU_API_KEY=
BAIDU_SECRET_KEY=

TOKEN_ENCRYPTION_KEY=
DATABASE_URL=sqlite:///./engine_room.db

CORS_ORIGINS=http://localhost:3000
```

---

## API contract (must match master §14)

| Method | Path | Purpose |
|--------|------|--------|
| GET | `/health` | Liveness |
| POST | `/v1/auth/exchange-code` | OAuth code → tokens |
| POST | `/v1/auth/refresh` | Refresh access token |
| POST | `/v1/sync-classroom` | Pull assignments |
| POST | `/v1/submit-assignment` | Drive upload + Classroom turn-in |
| POST | `/v1/ai-chat` | Persona chat |
| POST | `/v1/process-document` | OCR |
| POST | `/v1/generate-curriculum` | Study block generation |
| GET | `/v1/drive-usage` | Quota |
| GET | `/v1/progress-analytics` | Metrics |

All authenticated routes: `Authorization: Bearer <access_token>` unless otherwise specified for local dev.

---

## Security rules (non-negotiable)

1. Zero cross-user token use — every Google call uses **that user’s** token only  
2. Encrypt tokens at rest  
3. COPPA-aware: no external PII for ages ≤13 beyond what Google already holds  
4. No Playwright in this work order (Grok owns NotebookLM automation)  
5. Do not commit `.env` or real tokens

---

## Handoff to GenAI

When Phase 1–2 are stable, publish:
- Base URL (local): `http://localhost:8000`
- Confirmed OpenAPI or markdown of request/response examples
- List of working scopes

GenAI will set `VITE_ENGINE_ROOM_URL` and replace mocks.

---

## Handoff to Grok

When auth + Drive work:
- Provide a service account or user token test procedure for Playwright
- Confirm which Drive folder IDs NotebookLM should read
