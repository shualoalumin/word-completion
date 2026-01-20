/**
 * Achievements React Query hooks
 */

import { useQuery } from '@tanstack/react-query';
import { getAchievements, getUserAchievements, Achievement, UserAchievement } from '../api';

/**
 * Hook to fetch all available achievements
 */
export function useAchievements() {
  return useQuery<Achievement[]>({
    queryKey: ['achievements'],
    queryFn: async () => {
      const result = await getAchievements();
      if (result.error) {
        throw result.error;
      }
      return result.data || [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes (achievements don't change often)
  });
}

/**
 * Hook to fetch user's unlocked achievements
 */
export function useUserAchievements() {
  return useQuery<UserAchievement[]>({
    queryKey: ['user-achievements'],
    queryFn: async () => {
      const result = await getUserAchievements();
      if (result.error) {
        throw result.error;
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
