/**
 * Central frontend configuration.
 * Values come from Vite env (import.meta.env). Never commit real secrets.
 *
 * Root `.env` / `.env.local`:
 *   VITE_API_BASE_URL=                         # empty = same-origin Node bridge
 *   VITE_ENGINE_ROOM_URL=http://localhost:8000 # required for YouTube transcript + notebook ingest
 *   VITE_APP_NAME=Family Edu Hub
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

/** Default local Engine Room so transcript/notebook ingest works out of the box. */
const DEFAULT_ENGINE_ROOM = '';

export const appConfig = {
  appName: str('VITE_APP_NAME', 'Family Edu Hub'),
  /** Same-origin Node bridge when empty */
  apiBaseUrl: str('VITE_API_BASE_URL', '').replace(/\/$/, ''),
  /**
   * FastAPI Engine Room base URL.
   * Enables: /v1/lessons/ingest (YouTube transcript), notebook wiring, ER chat, Classroom.
   * Set VITE_ENGINE_ROOM_URL= in .env to disable (empty string overrides default).
   */
  engineRoomUrl: (() => {
    const raw = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env
      ?.VITE_ENGINE_ROOM_URL;
    // Explicit empty in env → disabled; undefined → local default
    if (raw === '') return '';
    if (typeof raw === 'string' && raw.length) return raw.replace(/\/$/, '');
    return DEFAULT_ENGINE_ROOM;
  })(),
  pollIntervalMs: num('VITE_POLL_INTERVAL_MS', 15_000),
  healthPollMs: num('VITE_HEALTH_POLL_MS', 10_000),
  enableAnalytics: bool('VITE_ENABLE_ANALYTICS', true),
  sessionKey: 'fes_user_id',
  googleTokenKey: 'fes_google_token',
  googleUserKey: 'fes_google_user_id',
  oauthStateKey: 'fes_google_oauth_state',
} as const;

export const isEngineRoomConfigured = Boolean(appConfig.engineRoomUrl);
