/**
 * Learning Patterns API 함수들
 * 시간대별 학습 패턴 분석
 */

import { supabase } from '@/integrations/supabase/client';

export interface LearningPattern {
  hour_of_day: number; // 0-23
  day_of_week: number; // 0-6 (0=Monday)
  avg_score_percent: number;
  avg_time_spent_seconds: number;
  exercises_count: number;
  last_updated_at: string;
}

export interface GetLearningPatternsResult {
  data: LearningPattern[] | null;
  error: Error | null;
}

/**
 * Get all learning patterns for the user
 */
export async function getLearningPatterns(): Promise<GetLearningPatternsResult> {
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
      .from('user_learning_patterns')
      .select('*')
      .eq('user_id', session.user.id)
      .order('day_of_week', { ascending: true })
      .order('hour_of_day', { ascending: true });

    if (error) {
      console.error('Error fetching learning patterns:', error);
      return { data: null, error: new Error(error.message) };
    }

    return {
      data: (data || []).map((pattern: any) => ({
        hour_of_day: pattern.hour_of_day,
        day_of_week: pattern.day_of_week,
        avg_score_percent: parseFloat(pattern.avg_score_percent || 0),
        avg_time_spent_seconds: pattern.avg_time_spent_seconds || 0,
        exercises_count: pattern.exercises_count || 0,
        last_updated_at: pattern.last_updated_at,
      })),
      error: null,
    };
  } catch (err) {
    console.error('Unexpected error in getLearningPatterns:', err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error'),
    };
  }
}

/**
 * Get learning patterns for a specific day of week
 */
export async function getLearningPatternsByDay(
  dayOfWeek: number
): Promise<GetLearningPatternsResult> {
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
      .from('user_learning_patterns')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('day_of_week', dayOfWeek)
      .order('hour_of_day', { ascending: true });

    if (error) {
      console.error('Error fetching learning patterns by day:', error);
      return { data: null, error: new Error(error.message) };
    }

    return {
      data: (data || []).map((pattern: any) => ({
        hour_of_day: pattern.hour_of_day,
        day_of_week: pattern.day_of_week,
        avg_score_percent: parseFloat(pattern.avg_score_percent || 0),
        avg_time_spent_seconds: pattern.avg_time_spent_seconds || 0,
        exercises_count: pattern.exercises_count || 0,
        last_updated_at: pattern.last_updated_at,
      })),
      error: null,
    };
  } catch (err) {
    console.error('Unexpected error in getLearningPatternsByDay:', err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error'),
    };
  }
}
