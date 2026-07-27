/**
 * Frontend API client.
 * - Default: same-origin Node server (`/api/*` on port 3000)
 * - Engine Room: set VITE_ENGINE_ROOM_URL=http://localhost:8000
 *   then /v1/* and mapped heavy routes go to FastAPI
 */

const ENGINE_ROOM = (import.meta as any).env?.VITE_ENGINE_ROOM_URL as string | undefined;
export const isEngineRoomConfigured = Boolean(ENGINE_ROOM);

/** Optional Google session for Engine Room authenticated calls */
let googleAccessToken: string | undefined;
let googleUserId: string | undefined;

export function setGoogleSession(accessToken?: string, userId?: string) {
  googleAccessToken = accessToken;
  googleUserId = userId;
  if (accessToken) {
    try {
      localStorage.setItem('fes_google_token', accessToken);
      if (userId) localStorage.setItem('fes_google_user_id', userId);
    } catch {
      /* ignore */
    }
  } else {
    try {
      localStorage.removeItem('fes_google_token');
      localStorage.removeItem('fes_google_user_id');
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
    googleAccessToken = localStorage.getItem('fes_google_token') || undefined;
    googleUserId = localStorage.getItem('fes_google_user_id') || undefined;
  } catch {
    /* ignore */
  }
}

loadGoogleSessionFromStorage();

/** Map Node-style paths to Engine Room when configured */
function resolveUrl(path: string): string {
  if (!ENGINE_ROOM) return path;
  const er = ENGINE_ROOM.replace(/\/$/, '');

  if (path === '/health') return `${er}/health`;
  if (path.startsWith('/v1/')) return `${er}${path}`;

  // Prefer Engine Room for these when available
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

export async function getHealth() {
  if (ENGINE_ROOM) return apiGet('/health');
  return apiGet('/api/health');
}

export async function getEngineRoomHealth() {
  if (!ENGINE_ROOM) throw new Error('VITE_ENGINE_ROOM_URL not set');
  return apiGet('/health');
}

export async function getAssignments(userId: string) {
  return apiGet(`/api/assignments/${encodeURIComponent(userId)}`);
}

export async function syncClassroom(userId: string, courseId?: string) {
  // Engine Room expects { courseId }; Node accepts userId too
  return apiFetch('/api/sync-classroom', ENGINE_ROOM ? { courseId } : { userId, courseId });
}

export async function getDriveUsage(userId?: string) {
  if (ENGINE_ROOM) return apiGet('/v1/drive-usage');
  const q = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  return apiGet(`/api/drive-usage${q}`);
}

export async function submitAssignment(
  courseId: string,
  courseWorkId: string,
  submissionData: Record<string, unknown>
) {
  if (ENGINE_ROOM) {
    const form = new FormData();
    form.append('courseId', courseId);
    form.append('courseWorkId', courseWorkId);
    if (submissionData.textResponse) form.append('textResponse', String(submissionData.textResponse));
    if (submissionData.file instanceof Blob) {
      form.append('file', submissionData.file as Blob, submissionData.fileName as string || 'upload.bin');
    }
    return apiFetch('/v1/submit-assignment', form, 'POST');
  }
  return apiFetch('/api/submit-assignment', {
    courseId,
    courseWorkId,
    ...submissionData,
  });
}

export async function suggestGoals(user: unknown) {
  return apiFetch('/api/suggest-goals', { user });
}

export async function sendChatMessage(chatData: {
  message: string;
  persona: string;
  userName: string;
  age: number;
  learningFocus: string;
  conversationId?: string;
  aiAssistantRole?: string;
}) {
  if (ENGINE_ROOM) {
    // Engine Room ChatRequest: message, persona, conversationId
    return apiFetch('/v1/ai-chat', {
      message: chatData.message,
      persona: chatData.persona,
      conversationId: chatData.conversationId,
    });
  }
  return apiFetch('/api/ai-chat', chatData);
}

export async function generateCurriculum(body: {
  persona?: string;
  topic?: string;
  goalId?: string;
  userName?: string;
  age?: number;
}) {
  if (ENGINE_ROOM) {
    return apiFetch('/v1/generate-curriculum', {
      persona: body.persona || 'Architect',
      topic: body.topic || 'General',
      goalId: body.goalId,
    });
  }
  return apiFetch('/api/generate-curriculum', body);
}

export async function startGoogleOAuth() {
  if (ENGINE_ROOM) {
    const data = await apiGet('/v1/auth/url');
    if (data.state) {
      localStorage.setItem('fes_google_oauth_state', data.state);
    }
    return { authorizationUrl: data.url, state: data.state };
  }
  return apiGet('/api/auth/google/start');
}

export async function exchangeGoogleCode(code: string) {
  if (!ENGINE_ROOM) throw new Error('Engine Room required for exchange-code');
  const data = await apiFetch('/v1/auth/exchange-code', { code });
  if (data.access_token && data.user?.id) {
    setGoogleSession(data.access_token, data.user.id);
  }
  return data;
}

export async function listDriveFiles(sessionId?: string) {
  const q = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : '';
  return apiGet(`/api/google/drive/files${q}`);
}

export async function listClassroomCourses(sessionId?: string) {
  const q = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : '';
  return apiGet(`/api/google/classroom/courses${q}`);
}

export async function ingestLesson(body: {
  userId: string;
  persona: string;
  youtubeUrl: string;
  title?: string;
  languages?: string[];
  addToNotebook?: boolean;
  notebookId?: string;
}) {
  if (!ENGINE_ROOM) {
    throw new Error('Connect the Engine Room to ingest YouTube lessons');
  }
  return apiFetch('/v1/lessons/ingest', body);
}

export async function getLessons(userId: string) {
  if (!ENGINE_ROOM) return { lessons: [] };
  return apiGet(`/v1/lessons?userId=${encodeURIComponent(userId)}`);
}
