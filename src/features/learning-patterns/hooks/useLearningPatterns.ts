/**
 * Learning Patterns React Query hooks
 */

import { useQuery } from '@tanstack/react-query';
import { getLearningPatterns, getLearningPatternsByDay, LearningPattern } from '../api';

/**
 * Hook to fetch all learning patterns
 */
export function useLearningPatterns() {
  return useQuery<LearningPattern[]>({
    queryKey: ['learning-patterns'],
    queryFn: async () => {
      const result = await getLearningPatterns();
      if (result.error) {
        throw result.error;
      }
      return result.data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch learning patterns for a specific day
 */
export function useLearningPatternsByDay(dayOfWeek: number) {
  return useQuery<LearningPattern[]>({
    queryKey: ['learning-patterns', dayOfWeek],
    queryFn: async () => {
      const result = await getLearningPatternsByDay(dayOfWeek);
      if (result.error) {
        throw result.error;
      }
      return result.data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
