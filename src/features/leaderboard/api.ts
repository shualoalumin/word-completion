/**
 * Leaderboard API 함수들
 * 주간 리더보드 관리
 */

import { supabase } from '@/integrations/supabase/client';

export interface LeaderboardEntry {
  id: string;
  week_start: string;
  user_id: string;
  exercises_completed: number;
  total_score: number;
  avg_score_percent: number;
  streak_days: number;
  words_mastered: number;
  rank: number | null;
  user_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface GetLeaderboardResult {
  data: LeaderboardEntry[] | null;
  error: Error | null;
}

export interface GetUserRankResult {
  data: { rank: number | null; total: number } | null;
  error: Error | null;
}

/**
 * Get weekly leaderboard (top N users)
 */
export async function getLeaderboard(
  weekStart?: string,
  limit: number = 10
): Promise<GetLeaderboardResult> {
  try {
    // Calculate week start if not provided
    let targetWeekStart: string;
    if (weekStart) {
      targetWeekStart = weekStart;
    } else {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday
      const monday = new Date(today.setDate(diff));
      targetWeekStart = monday.toISOString().split('T')[0];
    }

    const { data, error } = await supabase
      .from('leaderboard_weekly')
      .select(`
        *,
        user_profile:user_profiles!inner(display_name, avatar_url)
      `)
      .eq('week_start', targetWeekStart)
      .order('rank', { ascending: true, nullsLast: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return { data: null, error: new Error(error.message) };
    }

    return {
      data: (data || []).map((entry: any) => ({
        id: entry.id,
        week_start: entry.week_start,
        user_id: entry.user_id,
        exercises_completed: entry.exercises_completed || 0,
        total_score: entry.total_score || 0,
        avg_score_percent: parseFloat(entry.avg_score_percent || 0),
        streak_days: entry.streak_days || 0,
        words_mastered: entry.words_mastered || 0,
        rank: entry.rank,
        user_profile: entry.user_profile ? {
          display_name: entry.user_profile.display_name,
          avatar_url: entry.user_profile.avatar_url,
        } : undefined,
      })),
      error: null,
    };
  } catch (err) {
    console.error('Unexpected error in getLeaderboard:', err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error'),
    };
  }
}

/**
 * Get user's rank in current week
 */
export async function getUserRank(weekStart?: string): Promise<GetUserRankResult> {
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

    // Calculate week start if not provided
    let targetWeekStart: string;
    if (weekStart) {
      targetWeekStart = weekStart;
    } else {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(today.setDate(diff));
      targetWeekStart = monday.toISOString().split('T')[0];
    }

    // Get user's entry
    const { data: userEntry } = await supabase
      .from('leaderboard_weekly')
      .select('rank')
      .eq('week_start', targetWeekStart)
      .eq('user_id', session.user.id)
      .single();

    // Get total participants
    const { count } = await supabase
      .from('leaderboard_weekly')
      .select('*', { count: 'exact', head: true })
      .eq('week_start', targetWeekStart);

    return {
      data: {
        rank: userEntry?.rank || null,
        total: count || 0,
      },
      error: null,
    };
  } catch (err) {
    console.error('Unexpected error in getUserRank:', err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error'),
    };
  }
}
