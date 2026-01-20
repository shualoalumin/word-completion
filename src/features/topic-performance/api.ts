/**
 * Topic Performance API 함수들
 * 주제별 성과 추적
 */

import { supabase } from '@/integrations/supabase/client';

export interface TopicPerformance {
  topic_category: string;
  difficulty: string;
  exercises_completed: number;
  avg_score_percent: number;
  best_score_percent: number;
  last_practiced_at: string | null;
}

export interface GetTopicPerformanceResult {
  data: TopicPerformance[] | null;
  error: Error | null;
}

/**
 * Get all topic performance data for the user
 */
export async function getTopicPerformance(): Promise<GetTopicPerformanceResult> {
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
      .from('user_topic_performance')
      .select('*')
      .eq('user_id', session.user.id)
      .order('topic_category', { ascending: true })
      .order('difficulty', { ascending: true });

    if (error) {
      console.error('Error fetching topic performance:', error);
      return { data: null, error: new Error(error.message) };
    }

    return {
      data: (data || []).map((perf: any) => ({
        topic_category: perf.topic_category,
        difficulty: perf.difficulty,
        exercises_completed: perf.exercises_completed || 0,
        avg_score_percent: parseFloat(perf.avg_score_percent || 0),
        best_score_percent: parseFloat(perf.best_score_percent || 0),
        last_practiced_at: perf.last_practiced_at,
      })),
      error: null,
    };
  } catch (err) {
    console.error('Unexpected error in getTopicPerformance:', err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error'),
    };
  }
}

/**
 * Get topic performance for a specific category
 */
export async function getTopicPerformanceByCategory(
  topicCategory: string
): Promise<GetTopicPerformanceResult> {
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
      .from('user_topic_performance')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('topic_category', topicCategory)
      .order('difficulty', { ascending: true });

    if (error) {
      console.error('Error fetching topic performance by category:', error);
      return { data: null, error: new Error(error.message) };
    }

    return {
      data: (data || []).map((perf: any) => ({
        topic_category: perf.topic_category,
        difficulty: perf.difficulty,
        exercises_completed: perf.exercises_completed || 0,
        avg_score_percent: parseFloat(perf.avg_score_percent || 0),
        best_score_percent: parseFloat(perf.best_score_percent || 0),
        last_practiced_at: perf.last_practiced_at,
      })),
      error: null,
    };
  } catch (err) {
    console.error('Unexpected error in getTopicPerformanceByCategory:', err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error'),
    };
  }
}
