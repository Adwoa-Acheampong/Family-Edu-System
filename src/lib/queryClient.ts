import { QueryClient } from '@tanstack/react-query';
import { appConfig } from '../config/env';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 8_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: true,
      refetchInterval: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const queryKeys = {
  health: ['health'] as const,
  systemStatus: ['system-status'] as const,
  driveUsage: (userId?: string) => ['drive-usage', userId] as const,
  assignments: (userId: string) => ['assignments', userId] as const,
  analytics: (userId: string) => ['analytics', userId] as const,
  settings: ['settings'] as const,
};

export { appConfig };
