import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appConfig, queryKeys } from '../lib/queryClient';
import {
  getDriveUsage,
  getHealth,
  getSystemStatus,
  getAnalyticsSummary,
  getSystemSettings,
  saveSystemSettings,
  SystemSettingsPayload,
} from '../lib/api';

export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: getHealth,
    refetchInterval: appConfig.healthPollMs,
  });
}

export function useSystemStatus() {
  return useQuery({
    queryKey: queryKeys.systemStatus,
    queryFn: getSystemStatus,
    refetchInterval: appConfig.pollIntervalMs,
  });
}

export function useDriveUsage(userId?: string) {
  return useQuery({
    queryKey: queryKeys.driveUsage(userId),
    queryFn: () => getDriveUsage(userId),
    refetchInterval: appConfig.pollIntervalMs * 2,
  });
}

export function useAnalytics(userId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.analytics(userId),
    queryFn: () => getAnalyticsSummary(userId),
    enabled: enabled && Boolean(userId),
    refetchInterval: appConfig.pollIntervalMs * 2,
  });
}

export function useSystemSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: getSystemSettings,
  });
}

export function useSaveSystemSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SystemSettingsPayload) => saveSystemSettings(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.settings });
      void qc.invalidateQueries({ queryKey: queryKeys.systemStatus });
    },
  });
}
