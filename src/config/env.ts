/**
 * Central frontend configuration.
 * Values come from Vite env (import.meta.env). Never commit real secrets.
 *
 * Root `.env` / `.env.local` examples:
 *   VITE_API_BASE_URL=                    # empty = same origin (server.ts)
 *   VITE_ENGINE_ROOM_URL=http://localhost:8000
 *   VITE_APP_NAME=Family Edu Hub
 *   VITE_POLL_INTERVAL_MS=15000
 *   VITE_ENABLE_ANALYTICS=true
 */

function str(key: string, fallback = ''): string {
  const v = (import.meta as ImportMeta & { env: Record<string, string> }).env?.[key];
  return typeof v === 'string' && v.length ? v : fallback;
}

function num(key: string, fallback: number): number {
  const n = Number(str(key, ''));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function bool(key: string, fallback: boolean): boolean {
  const v = str(key, '').toLowerCase();
  if (!v) return fallback;
  return v === '1' || v === 'true' || v === 'yes';
}

export const appConfig = {
  appName: str('VITE_APP_NAME', 'Family Edu Hub'),
  /** Same-origin Node bridge when empty */
  apiBaseUrl: str('VITE_API_BASE_URL', '').replace(/\/$/, ''),
  /** FastAPI Engine Room */
  engineRoomUrl: str('VITE_ENGINE_ROOM_URL', '').replace(/\/$/, ''),
  pollIntervalMs: num('VITE_POLL_INTERVAL_MS', 15_000),
  healthPollMs: num('VITE_HEALTH_POLL_MS', 10_000),
  enableAnalytics: bool('VITE_ENABLE_ANALYTICS', true),
  sessionKey: 'fes_user_id',
  googleTokenKey: 'fes_google_token',
  googleUserKey: 'fes_google_user_id',
  oauthStateKey: 'fes_google_oauth_state',
} as const;

export const isEngineRoomConfigured = Boolean(appConfig.engineRoomUrl);
