# Deployment Guide — Family Educational ERP

Aligns with `SYSTEM_DOCUMENTATION.md` §8 (Cloudflare topology).

## Topology

```text
[ Family phones / tablets / laptops ]
              |
              v
     Cloudflare Pages  (React PWA — this repo `dist/`)
              |
              |  HTTPS API calls
              v
   api-local.yourdomain.com
              |
      Cloudflare Tunnel (cloudflared on home laptop)
              |
              v
     Engine Room FastAPI  (localhost:8000)
              |
              +-- Google APIs (Drive, Classroom)
              +-- OpenRouter / Gemini
              +-- Baidu OCR
              +-- Playwright → NotebookLM (optional job)
```

## 1. Frontend (Cloudflare Pages)

### GitHub secrets / vars

| Name | Type | Purpose |
|------|------|--------|
| `CLOUDFLARE_API_TOKEN` | Secret | Pages deploy token |
| `CLOUDFLARE_ACCOUNT_ID` | Secret | Cloudflare account id |
| `VITE_ENGINE_ROOM_URL` | Variable (optional) | e.g. `https://api-local.yourdomain.com` |

### Workflow

File: `.github/workflows/deploy.yml`

- Triggers on push to `main`
- Builds **Vite client only** (`npx vite build` → `dist/`)
- Deploys to Pages project `family-edu-system`

### Local production build check

```bash
npx vite build
npx vite preview
```

> Note: `npm run build` also bundles `server.ts` for Node hosting. Pages uses static assets only; AI routes in production should target the Engine Room URL.

## 2. Engine Room tunnel

See `scripts/cloudflared/README.md`.

Summary:

```bash
cloudflared tunnel create family-edu-engine
# configure hostname api-local.yourdomain.com → http://127.0.0.1:8000
cloudflared tunnel run family-edu-engine
```

## 3. NotebookLM job

See `scripts/playwright/README.md`.

```bash
python scripts/playwright/notebooklm_upload.py --login
python scripts/playwright/notebooklm_upload.py --file ./material.pdf
```

## 4. Environment checklist

| Component | Required env |
|-----------|----------------|
| GenAI Node (`server.ts`) local | `GEMINI_API_KEY` |
| Engine Room | Google OAuth client, OpenRouter/Gemini, Baidu, token encryption key |
| Pages build | Optional `VITE_ENGINE_ROOM_URL` |
| Tunnel | Cloudflare account + domain |

## 5. Acceptance tests

1. Open Pages URL on a phone → dashboard loads offline-capable shell (after GenAI PWA work)
2. `curl https://api-local.yourdomain.com/health` → ok while laptop tunnel runs
3. Playwright upload returns JSON with `share_url` for a test PDF
