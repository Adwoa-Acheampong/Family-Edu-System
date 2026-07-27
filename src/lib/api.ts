/**
 * Frontend API client for the lightweight Node server (server.ts).
 * When Engine Room is live, set VITE_ENGINE_ROOM_URL and route heavy calls there.
 */

const ENGINE_ROOM = (import.meta as any).env?.VITE_ENGINE_ROOM_URL as string | undefined;

function base(path: string): string {
  // Prefer same-origin /api/* (server.ts). Optional Engine Room override for specific paths later.
  if (ENGINE_ROOM && path.startsWith("/v1/")) {
    return `${ENGINE_ROOM.replace(/\/$/, "")}${path}`;
  }
  return path;
}

export async function apiFetch(endpoint: string, data?: unknown, method: string = "POST") {
  const res = await fetch(base(endpoint), {
    method,
    headers: data !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: data !== undefined ? JSON.stringify(data) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API Error ${res.status}: ${text}`);
  }

  return res.json();
}

export async function apiGet(endpoint: string) {
  return apiFetch(endpoint, undefined, "GET");
}

export async function getHealth() {
  return apiGet("/api/health");
}

export async function getAssignments(userId: string) {
  return apiGet(`/api/assignments/${encodeURIComponent(userId)}`);
}

export async function syncClassroom(userId: string, courseId?: string) {
  return apiFetch("/api/sync-classroom", { userId, courseId });
}

export async function getDriveUsage(userId?: string) {
  const q = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  return apiGet(`/api/drive-usage${q}`);
}

export async function submitAssignment(
  courseId: string,
  courseWorkId: string,
  submissionData: Record<string, unknown>
) {
  return apiFetch("/api/submit-assignment", {
    courseId,
    courseWorkId,
    ...submissionData,
  });
}

export async function suggestGoals(user: unknown) {
  return apiFetch("/api/suggest-goals", { user });
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
  return apiFetch("/api/ai-chat", chatData);
}

export async function generateCurriculum(body: {
  persona?: string;
  topic?: string;
  goalId?: string;
  userName?: string;
  age?: number;
}) {
  return apiFetch("/api/generate-curriculum", body);
}

/** Google OAuth — returns { authorizationUrl, state } when configured */
export async function startGoogleOAuth() {
  return apiGet("/api/auth/google/start");
}

export async function listDriveFiles(sessionId?: string) {
  const q = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : "";
  return apiGet(`/api/google/drive/files${q}`);
}

export async function listClassroomCourses(sessionId?: string) {
  const q = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : "";
  return apiGet(`/api/google/classroom/courses${q}`);
}
