/** System / analytics / settings endpoints (Node bridge). */
import { apiFetch, apiGet } from './apiCore';

export type SystemSettingsPayload = {
  pollIntervalMs?: number;
  engineRoomUrl?: string;
  classroomCourseId?: string;
  enableNotifications?: boolean;
};

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
