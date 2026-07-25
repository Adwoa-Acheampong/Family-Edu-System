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

## Status (2026-07-25)

| Item | Status |
|------|--------|
| Cloudflare Tunnel runbook + example config | **Done** → `scripts/cloudflared/` |
| GitHub Actions → Cloudflare Pages | **Done** → `.github/workflows/deploy.yml` |
| Playwright NotebookLM scaffold | **Done** → `scripts/playwright/` (needs live selector tuning) |
| Deployment doc | **Done** → `docs/DEPLOYMENT.md` |
| Live tunnel on family domain | **Pending** (needs your Cloudflare domain + laptop) |
| Live NotebookLM selector verification | **Pending** (run `--login` then upload on real account) |
| Engine Room `POST /v1/notebooklm-upload` shell-out | **Pending** (after DeepSeek/Qwen Phase 1) |

---

## Priority 1 — Cloudflare Tunnel ✅ scaffolded

- [x] `scripts/cloudflared/config.example.yml`
- [x] `scripts/cloudflared/README.md`
- [ ] Family creates real tunnel + DNS (`api-local.yourdomain.com`)

---

## Priority 2 — GitHub Actions → Cloudflare Pages ✅ scaffolded

- [x] `.github/workflows/deploy.yml`
- [ ] Add GitHub secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
- [ ] Create Cloudflare Pages project named `family-edu-system` (or edit workflow `projectName`)

---

## Priority 3 — NotebookLM Automator ✅ scaffolded

- [x] `scripts/playwright/notebooklm_upload.py`
- [x] `scripts/playwright/requirements.txt`
- [x] `scripts/playwright/selectors.md`
- [x] `scripts/playwright/README.md`
- [ ] One-time `--login` on approved Google account
- [ ] Tune selectors against live NotebookLM UI
- [ ] Optional Engine Room route to invoke script

---

## Priority 4 — Web content helpers (optional stretch)

- [ ] YouTube transcript fetch helper
- [ ] Markdown normalizer for OCR text

---

## Priority 5 — Review & integration support

- [ ] Review Engine Room OpenAPI vs SYSTEM_DOCUMENTATION §14 (when backend lands)
- [ ] Review GenAI `server.ts` migration to Engine Room URLs

---

## Out of scope

- Building the full React persona UIs (GenAI)
- Core FastAPI Classroom/Drive business logic (DeepSeek/Qwen)
- Curriculum pedagogy (product / Manus)

---

## Definition of Done

- [x] Scripts + workflow + docs in repo
- [ ] Family can open PWA on a phone and reach Engine Room via public tunnel hostname
- [ ] NotebookLM ingestion runs without hand-clicking UI each time (after selector tuning)
- [ ] Frontend deploys automatically from `main` (after Cloudflare secrets)
