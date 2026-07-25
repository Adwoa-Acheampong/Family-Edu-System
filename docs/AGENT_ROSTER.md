# Agent Roster & Ownership

**Project:** Unified Family Educational ERP  
**Repo:** `Adwoa-Acheampong/Family-Edu-System`  
**Master Spec:** `SYSTEM_DOCUMENTATION.md` (root)  
**Updated:** 2026-07-25

---

## Agents

| Agent | Primary Responsibility | Work Order File |
|-------|------------------------|-----------------|
| **GenAI** (Google AI Studio + Gemini) | Frontend completion, persona UIs, real Gemini chat, submission widget, PWA, age-appropriate login | `docs/GENAI_WORK_ORDER.md` |
| **DeepSeek / Qwen** | Local AI Engine Room (Python FastAPI), Google Auth/Drive/Classroom services, OCR, SQLite, API contracts | `docs/ENGINE_ROOM_WORK_ORDER.md` |
| **Grok** | Playwright NotebookLM automation, Cloudflare Tunnel, GitHub Actions, infra scripts, architecture review | `docs/GROK_WORK_ORDER.md` |
| **Claude** (optional senior pass) | Security review, complex refactors, final architecture QA | Use after Engine Room Phase 1–2 is scaffolded |
| **Manus** | Coordination, acceptance criteria, cross-agent handoffs | Uses this roster + checklists |

---

## Current Code Reality (as of this push)

### Already done (mostly GenAI)
- Multi-persona dashboards (Aba, Badu, Kobby, Pappy, Kweku, Shee)
- Layout, sidebar, storage progress bar, dark mode
- Login (simple avatar/user picker)
- AIAssistant UI shell (still **mocked** replies)
- ClassroomCard component
- One live Gemini endpoint: `POST /api/suggest-goals` in `server.ts`
- Stack: React 19 + Vite 6 + Tailwind 4 + Express + `@google/genai`

### Not done yet
- Real persona-aware AI chat
- Submission flow
- Interactive kid experiences (sounds/games)
- Full Python Engine Room
- Real Google OAuth / Drive / Classroom
- Playwright NotebookLM
- Cloudflare Tunnel + production PWA

---

## Dependency Rules

1. **GenAI can ship value without Engine Room** using Gemini + mocks.
2. **Engine Room** must implement the API contract in `docs/ENGINE_ROOM_WORK_ORDER.md` so GenAI can later swap mocks for real calls.
3. **Grok** unblocks production connectivity (Tunnel) and NotebookLM automation after Engine Room auth exists.
4. No agent changes another agent's owned paths without a documented handoff.

---

## Path Ownership

| Path | Owner |
|------|--------|
| `src/**` (React UI) | GenAI |
| `server.ts` (Node/Gemini bridge) | GenAI (until Engine Room takes over AI routes) |
| `engine-room/**` (new) | DeepSeek / Qwen |
| `scripts/playwright/**`, tunnel configs, `.github/workflows/**` | Grok |
| `SYSTEM_DOCUMENTATION.md`, `docs/**` | Shared (Manus / any agent may update status) |
