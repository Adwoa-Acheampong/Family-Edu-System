# GenAI Work Order

**Agent:** Google AI Studio / Gemini (Frontend + Node Gemini bridge)  
**Repo:** `Adwoa-Acheampong/Family-Edu-System`  
**Master Spec:** `SYSTEM_DOCUMENTATION.md` §§3, 6, 7, 13, 16  
**Status baseline:** UI shells exist; AI chat is mocked; only `/api/suggest-goals` is live.

---

## Mission

Turn the polished multi-persona demo into a **usable family product**:
1. Real Gemini-powered AI Companion (persona prompts)
2. Working assignment submission UI
3. Interactive experiences for Pappy, Kweku, Shee
4. Age-appropriate login
5. PWA basics

Do **not** implement full Google OAuth/Drive/Classroom live integration yet (Engine Room owns that). Use mocks or local Gemini until APIs exist.

---

## Priority 1 — Real AI Companion (must ship first)

### Goal
Replace the fake timeout reply in `src/components/AIAssistant.tsx` with a real Gemini call that uses persona-specific system prompts from `SYSTEM_DOCUMENTATION.md` §13.

### Tasks
- [ ] Add `POST /api/ai-chat` in `server.ts`
  - Input: `{ message, persona, userName, age, learningFocus, conversationId? }`
  - Build system prompt from §13 templates (Architect, Master, Analyst, Explorer, Discoverer, Seedling)
  - Call `gemini-2.5-flash` (or Pro if available) via `@google/genai`
  - Return `{ response, conversationId }`
- [ ] Optional: keep short conversation history in memory (last 6–10 turns) keyed by `conversationId`
- [ ] Wire `AIAssistant.tsx` `handleSend` to `/api/ai-chat`
- [ ] Show typing indicator while waiting
- [ ] On error, show a friendly persona-appropriate fallback (e.g. Seedling: “Let’s try again!”)
- [ ] Keep visual design unchanged (theme color, expand/collapse, mobile full-width)

### Acceptance
- Each of the 6 users gets a clearly different tone/style of reply
- Chat works offline from Engine Room (only needs `GEMINI_API_KEY`)
- No cross-user message leakage

### Prompt reference (inject these)
Use the exact role/tone structure from SYSTEM_DOCUMENTATION §13.2. Example shape:

```text
You are a [ASSISTANT_ROLE] for a [AGE]-year-old named [USER_NAME].
Your primary goal is to [PRIMARY_GOAL].
Maintain a [TONE] tone and use [LANGUAGE_COMPLEXITY] language.
Current Learning Context: [LEARNING_FOCUS].
User Query: [USER_QUERY]
```

---

## Priority 2 — Universal Submission Widget

### Goal
Implement the Unified Submission UX from the master doc so quests/assignments can be “turned in” from the dashboard (mocked backend OK).

### Tasks
- [ ] Create `src/components/SubmissionWidget.tsx`
  - Modes: text response, file upload (drag-drop), big “I’m Done!” button (for Shee/Kweku)
  - Optional voice record button UI (can stub actual recording)
- [ ] Create modal/drawer opened from `ClassroomCard` “Submit” / “View” actions
- [ ] Add `POST /api/submit-assignment` in `server.ts` (mock):
  - Accepts multipart or JSON `{ courseId, courseWorkId, textResponse, fileName? }`
  - Returns `{ status: "submitted", submissionId }`
- [ ] After submit: update card status to “Submitted – Awaiting Grade”
- [ ] Wire into Kobby Analyst dashboard first; then expose in Aba/Badu where assignments appear

### Acceptance
- User can submit text or file from UI and see status change
- Toddler path: one large affirmative control completes the flow
- No real Google Classroom dependency yet

---

## Priority 3 — Interactive Kid Verticals

### Pappy (Explorer, 8)
- [ ] Space Science card → simple planet quiz or fact carousel
- [ ] Story Time → short story text + “Read to me” (browser speechSynthesis OK)
- [ ] Reward confetti / star animation on completion

### Kweku (Discoverer, 5)
- [ ] Shape/color buttons play distinct Web Audio or speech sounds
- [ ] Correct tap → praise animation; wrong → gentle retry
- [ ] Keep huge touch targets (≥ 44px, ideally much larger)

### Shee (Seedling, 3)
- [ ] Animal grid plays animal sound / name on tap
- [ ] Auto-play friendly welcome sound when dashboard loads
- [ ] No text-heavy UI; icon-only interactions

### Shared
- [ ] Prefer Web Speech API / HTML5 Audio over external services
- [ ] No login required beyond current picker for these flows

---

## Priority 4 — Age-Appropriate Login

Current `Login.tsx` is a flat user list. Extend without Google OAuth yet.

| User | Method to implement |
|------|---------------------|
| Aba | Keep name select + optional simple password field (local only) |
| Badu | Avatar + 4-digit PIN pad |
| Kobby | Avatar + short password |
| Pappy | Avatar + 3-image sequence (picture password) |
| Kweku | Avatar + “speak” button (mock accept or Web Speech) |
| Shee | Avatar only (single tap) |

### Tasks
- [ ] Expand `Login.tsx` with per-persona auth steps
- [ ] Store session in `localStorage` / React state only for now
- [ ] Never hardcode real secrets; PINs can be demo constants documented in code comments

---

## Priority 5 — PWA Basics

- [ ] Add `public/manifest.json` (name: Family Educational ERP / EduERP, theme_color gold `#d9a84e`)
- [ ] Add icons placeholders (192 + 512) under `public/icons/`
- [ ] Register a minimal service worker (cache shell: `/`, `/index.html`, main assets)
- [ ] Update `index.html` title/meta to “Educational ERP Hub”
- [ ] Ensure installability on mobile Chrome/Safari where possible

---

## Priority 6 — Polish & API readiness

- [ ] Extract shared fetch helpers: `src/lib/api.ts`
- [ ] Types for Assignment, Submission, ChatMessage aligned with master API §14
- [ ] Environment: document `GEMINI_API_KEY` in README snippet
- [ ] When Engine Room is live, switch base URL via `VITE_ENGINE_ROOM_URL` without rewriting UI

---

## Out of scope for GenAI (do not block on these)

- Python FastAPI Engine Room
- Live Google OAuth / Drive / Classroom tokens
- Playwright NotebookLM
- Cloudflare Tunnel
- Baidu OCR

---

## Suggested implementation order (1–2 day sprints)

1. `/api/ai-chat` + wire AIAssistant  
2. SubmissionWidget + mock submit API  
3. Shee + Kweku interaction sounds  
4. Pappy story/quiz  
5. Login variants  
6. PWA manifest + SW  

---

## Definition of Done (GenAI phase)

- [ ] All 6 personas load distinct dashboards
- [ ] AI Companion returns real Gemini persona-aware answers
- [ ] At least one assignment can be submitted and show new status
- [ ] Youngest three personas have non-static interactions
- [ ] App installs as PWA shell on a phone
- [ ] No regressions to Layout / theme switching / storage bar
