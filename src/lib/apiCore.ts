import { appConfig } from '../config/env';

const ENGINE_ROOM = appConfig.engineRoomUrl || undefined;
export const isEngineRoomConfigured = Boolean(ENGINE_ROOM);

let googleAccessToken: string | undefined;
let googleUserId: string | undefined;

export function setGoogleSession(accessToken?: string, userId?: string) {
  googleAccessToken = accessToken;
  googleUserId = userId;
  if (accessToken) {
    try {
      localStorage.setItem(appConfig.googleTokenKey, accessToken);
      if (userId) localStorage.setItem(appConfig.googleUserKey, userId);
    } catch {
      /* ignore */
    }
  } else {
    try {
      localStorage.removeItem(appConfig.googleTokenKey);
      localStorage.removeItem(appConfig.googleUserKey);
    } catch {
      /* ignore */
    }
  }
}

export function hasGoogleSession() {
  return Boolean(googleAccessToken);
}

export function clearGoogleSession() {
  setGoogleSession();
}

export function loadGoogleSessionFromStorage() {
  try {
    googleAccessToken = localStorage.getItem(appConfig.googleTokenKey) || undefined;
    googleUserId = localStorage.getItem(appConfig.googleUserKey) || undefined;
  } catch {
    /* ignore */
  }
}

loadGoogleSessionFromStorage();

function resolveUrl(path: string): string {
  const base = appConfig.apiBaseUrl;
  if (base && !path.startsWith('http')) {
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
  }
  if (!ENGINE_ROOM) return path;
  const er = ENGINE_ROOM.replace(/\/$/, '');
  if (path === '/health') return `${er}/health`;
  if (path.startsWith('/v1/')) return `${er}${path}`;
  const map: Record<string, string> = {
    '/api/ai-chat': '/v1/ai-chat',
    '/api/generate-curriculum': '/v1/generate-curriculum',
    '/api/sync-classroom': '/v1/sync-classroom',
    '/api/submit-assignment': '/v1/submit-assignment',
    '/api/drive-usage': '/v1/drive-usage',
    '/api/health': '/health',
  };
  const mapped = map[path.split('?')[0]];
  if (mapped) {
    const qs = path.includes('?') ? path.slice(path.indexOf('?')) : '';
    return `${er}${mapped}${qs}`;
  }
  return path;
}

function authHeaders(json: boolean): HeadersInit {
  const h: Record<string, string> = {};
  if (json) h['Content-Type'] = 'application/json';
  if (googleAccessToken) h['Authorization'] = `Bearer ${googleAccessToken}`;
  if (googleUserId) h['X-Google-User-Id'] = googleUserId;
  return h;
}

export async function apiFetch(endpoint: string, data?: unknown, method: string = 'POST') {
  const url = resolveUrl(endpoint);
  const isForm = typeof FormData !== 'undefined' && data instanceof FormData;
  const res = await fetch(url, {
    method,
    headers: isForm ? authHeaders(false) : data !== undefined ? authHeaders(true) : authHeaders(false),
    body: isForm ? (data as FormData) : data !== undefined ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API Error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function apiGet(endpoint: string) {
  return apiFetch(endpoint, undefined, 'GET');
}
