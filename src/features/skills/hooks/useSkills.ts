/**
 * Skills React Query hooks
 */

import { useQuery } from '@tanstack/react-query';
import { getUserSkills, getUserSkill, UserSkill } from '../api';

/**
 * Hook to fetch all user skills
 */
export function useUserSkills() {
  return useQuery<UserSkill[]>({
    queryKey: ['user-skills'],
    queryFn: async () => {
      const result = await getUserSkills();
      if (result.error) {
        throw result.error;
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a specific skill
 */
export function useUserSkill(skillType: 'vocabulary' | 'grammar' | 'inference') {
  return useQuery<UserSkill | null>({
    queryKey: ['user-skill', skillType],
    queryFn: async () => {
      const result = await getUserSkill(skillType);
      if (result.error) {
        throw result.error;
      }
      return result.data || null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
