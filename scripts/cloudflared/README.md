# Cloudflare Tunnel — Engine Room Exposure

Expose the local **AI Engine Room** (`http://localhost:8000`) to the family PWA without opening router ports.

## Prerequisites

- Cloudflare account + a domain on Cloudflare DNS
- Engine Room running on the family laptop (`GET /health` works locally)
- [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) installed

## One-time setup

```bash
# 1. Login
cloudflared tunnel login

# 2. Create tunnel
cloudflared tunnel create family-edu-engine

# 3. Note the Tunnel ID and credentials path printed by the CLI
# 4. Copy example config and edit hostnames / paths
cp scripts/cloudflared/config.example.yml ~/.cloudflared/config.yml
# Edit: tunnel ID, credentials-file, hostname (api-local.yourdomain.com)

# 5. Route DNS (replace with your tunnel name / domain)
cloudflared tunnel route dns family-edu-engine api-local.yourdomain.com
```

## Run (laptop must stay on)

```bash
cloudflared tunnel run family-edu-engine
```

Or as a background service (Linux):

```bash
sudo cloudflared service install
sudo systemctl enable --now cloudflared
```

## Dashboard wiring

Set the frontend env (GenAI / Vite):

```bash
VITE_ENGINE_ROOM_URL=https://api-local.yourdomain.com
```

## Health check from phone / another network

```bash
curl https://api-local.yourdomain.com/health
# expect: {"status":"ok"}
```

## Security notes

- Prefer Cloudflare Access (email OTP / Google) in front of the tunnel for non-local clients.
- Do not expose the Engine Room without auth once real Google tokens are stored.
- Rotate tunnel credentials if the laptop is lost.

## Troubleshooting

| Symptom | Check |
|---------|--------|
| 502 | Is Engine Room listening on `127.0.0.1:8000`? |
| DNS error | `cloudflared tunnel route dns` + Cloudflare DNS proxy orange-cloud |
| Works at home only | Confirm you are hitting the `https://api-local...` host, not LAN IP |
