/**
 * Usage Limits React Query hooks
 */

import { useQuery } from '@tanstack/react-query';
import { getUsageLimits, checkExerciseUsage, UsageLimits, CheckUsageResult } from '../api';

/**
 * Hook to fetch user's usage limits
 */
export function useUsageLimits() {
  return useQuery<UsageLimits>({
    queryKey: ['usage-limits'],
    queryFn: async () => {
      const result = await getUsageLimits();
      if (result.error) {
        throw result.error;
      }
      if (!result.data) {
        throw new Error('Usage limits not found');
      }
      return result.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook to check exercise usage (mutation-like query)
 */
export function useCheckExerciseUsage() {
  return useQuery<CheckUsageResult>({
    queryKey: ['check-exercise-usage'],
    queryFn: async () => {
      return await checkExerciseUsage();
    },
    enabled: false, // Only run when explicitly called
    staleTime: 0,
  });
}
