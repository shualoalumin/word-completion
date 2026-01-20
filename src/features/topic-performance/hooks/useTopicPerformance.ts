/**
 * Topic Performance React Query hooks
 */

import { useQuery } from '@tanstack/react-query';
import { getTopicPerformance, getTopicPerformanceByCategory, TopicPerformance } from '../api';

/**
 * Hook to fetch all topic performance data
 */
export function useTopicPerformance() {
  return useQuery<TopicPerformance[]>({
    queryKey: ['topic-performance'],
    queryFn: async () => {
      const result = await getTopicPerformance();
      if (result.error) {
        throw result.error;
      }
      return result.data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch topic performance for a specific category
 */
export function useTopicPerformanceByCategory(topicCategory: string) {
  return useQuery<TopicPerformance[]>({
    queryKey: ['topic-performance', topicCategory],
    queryFn: async () => {
      const result = await getTopicPerformanceByCategory(topicCategory);
      if (result.error) {
        throw result.error;
      }
      return result.data || [];
    },
    enabled: !!topicCategory,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
