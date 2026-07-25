# Agent Roster & Ownership

**Project:** Unified Family Educational ERP  
**Repo:** `Adwoa-Acheampong/Family-Edu-System`  
**Master Spec:** `SYSTEM_DOCUMENTATION.md` (root) + `docs/PERSONA_SETH.md`  
**Updated:** 2026-07-25

---

## Family personas (7)

| Name | Age | Persona | Theme |
|------|-----|---------|--------|
| Aba | 27 | The Architect | Gold |
| Badu | 52 | The Master | Emerald |
| Kobby | 11 | The Analyst | Cyan |
| Pappy | 8 | The Explorer | Amber |
| **Seth** | **6** | **The Adventurer** | **Sky** |
| Kweku | 5 | The Discoverer | Purple |
| Shee | 3 | The Seedling | Lime |

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

### Already done (mostly GenAI + Grok)
- Multi-persona dashboards including **Seth (Adventurer)**
- Layout, sidebar, storage progress bar, dark mode
- Login (simple avatar/user picker — includes Seth via `USERS`)
- AIAssistant UI shell (still **mocked** replies until GenAI Priority 1)
- ClassroomCard component
- One live Gemini endpoint: `POST /api/suggest-goals` in `server.ts`
- Grok: Tunnel runbook, Pages workflow, Playwright NotebookLM scaffold
- Stack: React 19 + Vite 6 + Tailwind 4 + Express + `@google/genai`

### Not done yet
- Real persona-aware AI chat
- Submission flow
- Rich interactive kid experiences (including Seth)
- Full Python Engine Room
- Real Google OAuth / Drive / Classroom
- Live Cloudflare Tunnel + production PWA

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
