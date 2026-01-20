/**
 * Leaderboard React Query hooks
 */

import { useQuery } from '@tanstack/react-query';
import { getLeaderboard, getUserRank, LeaderboardEntry } from '../api';

/**
 * Hook to fetch weekly leaderboard
 */
export function useLeaderboard(weekStart?: string, limit: number = 10) {
  return useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard', weekStart, limit],
    queryFn: async () => {
      const result = await getLeaderboard(weekStart, limit);
      if (result.error) {
        throw result.error;
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch user's rank
 */
export function useUserRank(weekStart?: string) {
  return useQuery<{ rank: number | null; total: number }>({
    queryKey: ['user-rank', weekStart],
    queryFn: async () => {
      const result = await getUserRank(weekStart);
      if (result.error) {
        throw result.error;
      }
      if (!result.data) {
        throw new Error('Rank not found');
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
