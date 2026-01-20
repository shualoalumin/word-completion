/**
 * User Skills API 함수들
 * 스킬별 숙련도 추적 (vocabulary, grammar, inference)
 */

import { supabase } from '@/integrations/supabase/client';

export interface UserSkill {
  skill_type: 'vocabulary' | 'grammar' | 'inference';
  proficiency_score: number; // 0.00 ~ 1.00
  exercises_completed: number;
  correct_rate: number; // 0.00 ~ 100.00
  last_updated_at: string;
}

export interface GetUserSkillsResult {
  data: UserSkill[] | null;
  error: Error | null;
}

/**
 * Get user skills (all skill types)
 */
export async function getUserSkills(): Promise<GetUserSkillsResult> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return {
        data: null,
        error: new Error('Authentication required'),
      };
    }

    const { data, error } = await supabase
      .from('user_skills')
      .select('*')
      .eq('user_id', session.user.id)
      .order('skill_type', { ascending: true });

    if (error) {
      console.error('Error fetching user skills:', error);
      return { data: null, error: new Error(error.message) };
    }

    return {
      data: (data || []).map((skill: any) => ({
        skill_type: skill.skill_type,
        proficiency_score: parseFloat(skill.proficiency_score || 0),
        exercises_completed: skill.exercises_completed || 0,
        correct_rate: parseFloat(skill.correct_rate || 0),
        last_updated_at: skill.last_updated_at,
      })),
      error: null,
    };
  } catch (err) {
    console.error('Unexpected error in getUserSkills:', err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error'),
    };
  }
}

/**
 * Get specific skill by type
 */
export async function getUserSkill(
  skillType: 'vocabulary' | 'grammar' | 'inference'
): Promise<{ data: UserSkill | null; error: Error | null }> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return {
        data: null,
        error: new Error('Authentication required'),
      };
    }

    const { data, error } = await supabase
      .from('user_skills')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('skill_type', skillType)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - user has no skill record yet
        return { data: null, error: null };
      }
      console.error('Error fetching user skill:', error);
      return { data: null, error: new Error(error.message) };
    }

    if (!data) {
      return { data: null, error: null };
    }

    return {
      data: {
        skill_type: data.skill_type,
        proficiency_score: parseFloat(data.proficiency_score || 0),
        exercises_completed: data.exercises_completed || 0,
        correct_rate: parseFloat(data.correct_rate || 0),
        last_updated_at: data.last_updated_at,
      },
      error: null,
    };
  } catch (err) {
    console.error('Unexpected error in getUserSkill:', err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error'),
    };
  }
}
