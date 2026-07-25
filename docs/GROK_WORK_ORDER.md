# Grok Work Order

**Agent:** Grok  
**Repo:** `Adwoa-Acheampong/Family-Edu-System`  
**Master Spec:** `SYSTEM_DOCUMENTATION.md` §§4.4, 5, 8, 10  
**Depends on:** Engine Room auth + Drive (DeepSeek/Qwen Phase 1+)

---

## Mission

Own **automation and infrastructure**:
1. Playwright-based NotebookLM ingestion
2. Cloudflare Tunnel exposure of local Engine Room
3. CI/CD for the frontend (Cloudflare Pages)
4. Supporting scripts and runbooks
5. Architecture / API contract review when asked

---

## Priority 1 — Cloudflare Tunnel (unblocks remote PWA → local API)

### Goal
Expose `localhost:8000` (Engine Room) securely without opening router ports.

### Tasks
- [ ] Document install of `cloudflared` on the family laptop
- [ ] Create tunnel config example: `scripts/cloudflared/config.example.yml`
  - Subdomain placeholder: `api-local.yourdomain.com` → `http://localhost:8000`
- [ ] Document DNS + Cloudflare Zero Trust optional access policies
- [ ] Add `scripts/cloudflared/README.md` with start/stop commands
- [ ] Env note: dashboard `VITE_ENGINE_ROOM_URL=https://api-local.yourdomain.com`

### Acceptance
- From another device on the internet (or cellular), `GET https://api-local.../health` returns ok while laptop is on

---

## Priority 2 — GitHub Actions → Cloudflare Pages

### Tasks
- [ ] Add `.github/workflows/deploy.yml`
  - On push to `main`: install, `npm ci`, `npm run build`, deploy to Cloudflare Pages
- [ ] Document required GitHub secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, project name
- [ ] Ensure build uses Vite frontend output (`dist/` client assets); do not assume Engine Room runs on Pages

### Acceptance
- Push to main updates the static dashboard URL

---

## Priority 3 — NotebookLM Automator (Playwright)

### Goal
When a new study file lands in Drive (or on API trigger), automate NotebookLM upload and return a notebook/share link.

### Location
```text
scripts/playwright/
├── notebooklm_upload.py   # or .ts — prefer Python to sit beside Engine Room
├── README.md
└── selectors.md           # maintain fragile UI selectors here
```

### Flow (from master §4.4)
1. Receive Drive file ID or local path from Engine Room endpoint (Grok may add `POST /v1/notebooklm-upload` stub jointly with backend agent)
2. Launch Chromium with persistent context (user Google session)
3. Navigate NotebookLM → create/open notebook → upload source
4. Capture share/interactive link
5. Return link JSON to caller

### Tasks
- [ ] Playwright script with clear CLI: `python notebooklm_upload.py --file-id ...`
- [ ] Document **manual one-time login** to save storage state (no password scraping)
- [ ] Robust waits; selectors isolated in `selectors.md`
- [ ] Failure modes: timeout, consent screen, upload quota — return structured errors
- [ ] Optional: Engine Room route that shells out to this script

### Constraints
- Do not store Google passwords in repo
- Assume COPPA: only use accounts/guardians approved by family admin (Aba)
- NotebookLM has no public API — treat UI automation as best-effort and version-pin Playwright

### Acceptance
- Given a test PDF in Drive, script produces a NotebookLM link without manual UI clicks after initial login

---

## Priority 4 — Web content helpers (optional stretch)

- [ ] YouTube transcript fetch helper (for curriculum materials)
- [ ] Simple markdown normalizer for OCR text before NotebookLM

---

## Priority 5 — Review & integration support

When asked:
- [ ] Review Engine Room OpenAPI vs `SYSTEM_DOCUMENTATION.md` §14
- [ ] Review GenAI `server.ts` vs future Engine Room migration
- [ ] Suggest least-privilege OAuth scopes if Google consent is too broad

---

## Out of scope

- Building the full React persona UIs (GenAI)
- Core FastAPI business logic for Classroom turn-in (DeepSeek/Qwen)
- Choosing curriculum pedagogy (product/Manus)

---

## Deliverable checklist

- [ ] `scripts/cloudflared/` + runbook
- [ ] `.github/workflows/deploy.yml`
- [ ] `scripts/playwright/notebooklm_upload.py` + README + selectors
- [ ] Short `docs/DEPLOYMENT.md` summarizing Pages + Tunnel topology (matches master §8)

---

## Definition of Done

- Family can open the PWA on a phone, hit a public API hostname that tunnels to the home laptop Engine Room
- NotebookLM ingestion can be triggered without hand-clicking the NotebookLM UI each time
- Frontend deploys automatically from `main`
