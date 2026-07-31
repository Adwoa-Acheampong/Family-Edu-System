/**
 * Unified API client — re-exports core + domain helpers.
 */
export {
  apiFetch,
  apiGet,
  isEngineRoomConfigured,
  setGoogleSession,
  hasGoogleSession,
  clearGoogleSession,
  loadGoogleSessionFromStorage,
} from './apiCore';

import { apiFetch, apiGet, isEngineRoomConfigured, setGoogleSession } from './apiCore';
import { appConfig } from '../config/env';

export type SystemSettingsPayload = {
  pollIntervalMs?: number;
  engineRoomUrl?: string;
  classroomCourseId?: string;
  enableNotifications?: boolean;
};

export async function getHealth() {
  if (isEngineRoomConfigured) return apiGet('/health');
  return apiGet('/api/health');
}

export async function getEngineRoomHealth() {
  if (!isEngineRoomConfigured) throw new Error('VITE_ENGINE_ROOM_URL not set');
  return apiGet('/health');
}

export async function getSystemStatus() {
  return apiGet('/api/system/status');
}

export async function getAnalyticsSummary(userId: string) {
  return apiGet(`/api/analytics/summary?userId=${encodeURIComponent(userId)}`);
}

export async function getSystemSettings() {
  return apiGet('/api/system/settings');
}

export async function saveSystemSettings(payload: SystemSettingsPayload) {
  return apiFetch('/api/system/settings', payload, 'PUT');
}

export async function getAssignments(userId: string) {
  return apiGet(`/api/assignments/${encodeURIComponent(userId)}`);
}

export async function getModules(userId: string) {
  return apiGet(`/api/modules/${encodeURIComponent(userId)}`);
}

export async function syncClassroom(userId: string, courseId?: string) {
  return apiFetch(
    '/api/sync-classroom',
    isEngineRoomConfigured ? { courseId } : { userId, courseId }
  );
}

export async function getDriveUsage(userId?: string) {
  if (isEngineRoomConfigured) return apiGet('/v1/drive-usage');
  const q = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  return apiGet(`/api/drive-usage${q}`);
}

export async function submitAssignment(
  courseId: string,
  courseWorkId: string,
  submissionData: Record<string, unknown>
) {
  if (isEngineRoomConfigured) {
    const form = new FormData();
    form.append('courseId', courseId);
    form.append('courseWorkId', courseWorkId);
    if (submissionData.textResponse) form.append('textResponse', String(submissionData.textResponse));
    if (submissionData.file instanceof Blob) {
      form.append(
        'file',
        submissionData.file as Blob,
        (submissionData.fileName as string) || 'upload.bin'
      );
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
  history?: { role: string; content: string }[];
  persona: string;
  userName: string;
  age: number;
  learningFocus: string;
  conversationId?: string;
  aiAssistantRole?: string;
}) {
  if (isEngineRoomConfigured) {
    return apiFetch('/v1/ai-chat', {
      message: chatData.message,
      history: chatData.history,
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
  if (isEngineRoomConfigured) {
    return apiFetch('/v1/generate-curriculum', {
      persona: body.persona || 'Architect',
      topic: body.topic || 'General',
      goalId: body.goalId,
    });
  }
  return apiFetch('/api/generate-curriculum', body);
}

export async function startGoogleOAuth() {
  if (isEngineRoomConfigured) {
    const data = await apiGet('/v1/auth/url');
    if (data.state) {
      localStorage.setItem(appConfig.oauthStateKey, data.state);
    }
    return { authorizationUrl: data.url, state: data.state };
  }
  return apiGet('/api/auth/google/start');
}

export async function exchangeGoogleCode(code: string) {
  if (!isEngineRoomConfigured) throw new Error('Engine Room required for exchange-code');
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
  if (!isEngineRoomConfigured) {
    throw new Error('Connect the Engine Room to ingest YouTube lessons');
  }
  return apiFetch('/v1/lessons/ingest', body);
}

export async function getLessons(userId: string) {
  if (!isEngineRoomConfigured) return { lessons: [] };
  return apiGet(`/v1/lessons?userId=${encodeURIComponent(userId)}`);
}
