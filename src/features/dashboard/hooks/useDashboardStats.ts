/**
 * Dashboard 통계 React Query Hook
 * flow-6: Dashboard 통계 데이터 fetching
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getDashboardStats, getRecentActivity, DashboardStats, RecentActivity } from '../api';

/**
 * Hook to fetch dashboard statistics
 */
export function useDashboardStats() {
  const { user, isAuthenticated } = useAuth();

  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      return getDashboardStats(user.id);
    },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 30000,  // 30 seconds - stats don't need to be super fresh
    refetchOnWindowFocus: true,  // Refetch when user comes back to tab
  });
}

/**
 * Hook to fetch recent activity
 */
export function useRecentActivity(limit: number = 5) {
  const { user, isAuthenticated } = useAuth();

  return useQuery<RecentActivity[]>({
    queryKey: ['recent-activity', user?.id, limit],
    queryFn: () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      return getRecentActivity(user.id, limit);
    },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 30000,  // 30 seconds
    refetchOnWindowFocus: true,
  });
}
