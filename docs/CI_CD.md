# CI/CD — Family Edu Hub

## Workflows

| File | When | What |
|------|------|------|
| `.github/workflows/ci.yml` | Push/PR to `main` | `npm ci`, typecheck, production build, Python compileall |
| `.github/workflows/deploy.yml` | Push to `main` (app paths) or manual | Build → SSH upload → `pm2 restart` |
| `.github/workflows/engine-room-deploy.yml` | Engine Room path changes or manual | rsync + pip + restart |

CI always runs. **Deploy is a no-op until GitHub Secrets are set.**

---

## 1. Enable CI only (already active)

Push to `main` or open a PR. Check the **Actions** tab.

If `npm ci` fails because `package-lock.json` is missing, generate once locally:

```bat
npm install
git add package-lock.json
git commit -m "Add package-lock for CI"
git push
```

---

## 2. GitHub configuration

### Repository variables (Settings → Secrets and variables → Actions → Variables)

Used at **build time** for Vite:

| Variable | Example |
|----------|---------|
| `VITE_APP_NAME` | `Family Edu Hub` |
| `VITE_ENGINE_ROOM_URL` | `https://edu.example.com/engine` |
| `VITE_API_BASE_URL` | `` (empty = same origin) |
| `VITE_POLL_INTERVAL_MS` | `15000` |

### Secrets (Settings → Secrets and variables → Actions → Secrets)

**Node app deploy**

| Secret | Purpose |
|--------|---------|
| `DEPLOY_HOST` | Server hostname/IP |
| `DEPLOY_USER` | SSH user |
| `DEPLOY_SSH_KEY` | Private key PEM |
| `DEPLOY_PATH` | e.g. `/var/www/family-edu-hub` |
| `DEPLOY_PORT` | Optional, default `22` |
| `DEPLOY_HEALTH_URL` | e.g. `https://edu.example.com/api/health` |

**Engine Room deploy (optional)**

| Secret | Purpose |
|--------|---------|
| `ER_DEPLOY_HOST` | Host |
| `ER_DEPLOY_USER` | User |
| `ER_DEPLOY_SSH_KEY` | Key |
| `ER_DEPLOY_PATH` | e.g. `/var/www/family-edu-engine` |
| `ER_DEPLOY_PORT` | Optional |

Create a GitHub **Environment** named `production` (optional approval gate).

---

## 3. One-time server setup

```bash
# On VPS
sudo mkdir -p /var/www/family-edu-hub
sudo chown $USER:$USER /var/www/family-edu-hub
cd /var/www/family-edu-hub

# Place .env here manually (never from CI)
nano .env

npm install -g pm2
# After first CI deploy drops dist/:
pm2 start dist/server.cjs --name family-edu-hub
pm2 save
pm2 startup
```

Engine Room:

```bash
mkdir -p /var/www/family-edu-engine
# place .env with TOKEN_ENCRYPTION_KEY etc.
# systemd unit or: pm2 start "uvicorn main:app --host 127.0.0.1 --port 8000" --name family-edu-engine
```

Nginx: see `docs/PRODUCTION_CHECKLIST.md`.

---

## 4. SSH key for GitHub Actions

```bash
ssh-keygen -t ed25519 -C "github-actions-family-edu" -f deploy_key -N ""
# Install deploy_key.pub in server ~/.ssh/authorized_keys
# Paste deploy_key (private) into GitHub secret DEPLOY_SSH_KEY
```

---

## 5. Manual deploy

Actions → **Deploy** → **Run workflow**.

---

## 6. What CI does *not* do

- Does not upload `.env` or secrets
- Does not migrate production databases automatically
- Does not deploy if SSH secrets are missing (safe default)
- Vite env must be GitHub **Variables** (or hardcode in workflow) because they are compile-time

---

## 7. Alternative platforms

| Platform | Approach |
|----------|----------|
| Railway / Render | Connect repo; set root start `node dist/server.cjs`; build `npm run build` |
| Fly.io | `fly launch` + Dockerfile (add if needed) |
| Cloudflare Workers | Not a drop-in for Express — keep Node host for API |
| Vercel | SPA only; API would need serverless rewrite — not current architecture |

SSH + pm2 matches the current Express + Vite production design.
