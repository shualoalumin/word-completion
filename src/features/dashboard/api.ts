/**
 * Dashboard 통계 API 함수들
 * flow-6: 실제 데이터로 Dashboard 통계 표시
 */

import { supabase } from '@/integrations/supabase/client';

export interface DifficultyStats {
  easy: { count: number; avgScore: number | null };
  intermediate: { count: number; avgScore: number | null };
  hard: { count: number; avgScore: number | null };
}

export interface DashboardStats {
  exercisesToday: number;
  dayStreak: number;
  averageScore: number | null;  // null if no exercises completed
  totalExercises: number;
  // New: difficulty breakdown
  difficultyStats?: DifficultyStats;
}

export interface RecentActivity {
  id: string;
  exerciseId: string;
  score: number;
  maxScore: number;
  scorePercent: number;
  completedAt: string;
  topic?: string;
}

/**
 * Get exercises completed today
 */
export async function getExercisesToday(userId: string): Promise<number> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.toISOString();
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStart = tomorrow.toISOString();

    const { count, error } = await supabase
      .from('user_exercise_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('completed_at', todayStart)
      .lt('completed_at', tomorrowStart);

    if (error) {
      console.error('Error fetching exercises today:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Unexpected error fetching exercises today:', error);
    return 0;
  }
}

/**
 * Get current day streak
 */
export async function getDayStreak(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('user_streaks')
      .select('current_streak')
      .eq('user_id', userId)
      .single();

    if (error) {
      // Table might not exist yet or user has no streak
      if (error.code === 'PGRST116') {
        // No rows returned - user has no streak record yet
        return 0;
      }
      console.error('Error fetching day streak:', error);
      return 0;
    }

    return data?.current_streak || 0;
  } catch (error) {
    console.error('Unexpected error fetching day streak:', error);
    return 0;
  }
}

/**
 * Get average score percentage
 */
export async function getAverageScore(userId: string): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('user_exercise_history')
      .select('score_percent')
      .eq('user_id', userId)
      .not('score_percent', 'is', null);

    if (error) {
      console.error('Error fetching average score:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;  // No exercises completed yet
    }

    // Calculate average
    const sum = data.reduce((acc, record) => {
      const score = typeof record.score_percent === 'number' 
        ? record.score_percent 
        : parseFloat(String(record.score_percent || 0));
      return acc + score;
    }, 0);

    const average = sum / data.length;
    return Math.round(average * 100) / 100;  // Round to 2 decimal places
  } catch (error) {
    console.error('Unexpected error fetching average score:', error);
    return null;
  }
}

/**
 * Get total exercises completed
 */
export async function getTotalExercises(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('user_exercise_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching total exercises:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Unexpected error fetching total exercises:', error);
    return 0;
  }
}

/**
 * Get difficulty-based statistics
 */
export async function getDifficultyStats(userId: string): Promise<DifficultyStats> {
  try {
    const { data, error } = await supabase
      .from('user_exercise_history')
      .select('difficulty, score_percent')
      .eq('user_id', userId)
      .not('difficulty', 'is', null);

    if (error) {
      console.error('Error fetching difficulty stats:', error);
      return {
        easy: { count: 0, avgScore: null },
        intermediate: { count: 0, avgScore: null },
        hard: { count: 0, avgScore: null },
      };
    }

    // Group by difficulty and calculate averages
    const grouped: Record<string, { scores: number[] }> = {
      easy: { scores: [] },
      intermediate: { scores: [] },
      hard: { scores: [] },
    };

    data?.forEach((record: any) => {
      const difficulty = record.difficulty || 'intermediate';
      if (grouped[difficulty]) {
        const score = typeof record.score_percent === 'number'
          ? record.score_percent
          : parseFloat(String(record.score_percent || 0));
        if (!isNaN(score)) {
          grouped[difficulty].scores.push(score);
        }
      }
    });

    const calcAvg = (scores: number[]): number | null => {
      if (scores.length === 0) return null;
      const sum = scores.reduce((a, b) => a + b, 0);
      return Math.round((sum / scores.length) * 100) / 100;
    };

    return {
      easy: { count: grouped.easy.scores.length, avgScore: calcAvg(grouped.easy.scores) },
      intermediate: { count: grouped.intermediate.scores.length, avgScore: calcAvg(grouped.intermediate.scores) },
      hard: { count: grouped.hard.scores.length, avgScore: calcAvg(grouped.hard.scores) },
    };
  } catch (error) {
    console.error('Unexpected error fetching difficulty stats:', error);
    return {
      easy: { count: 0, avgScore: null },
      intermediate: { count: 0, avgScore: null },
      hard: { count: 0, avgScore: null },
    };
  }
}

/**
 * Get all dashboard stats in one call (optimized)
 */
export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  try {
    // Parallel queries for better performance
    const [exercisesToday, dayStreak, averageScore, totalExercises, difficultyStats] = await Promise.all([
      getExercisesToday(userId),
      getDayStreak(userId),
      getAverageScore(userId),
      getTotalExercises(userId),
      getDifficultyStats(userId),
    ]);

    return {
      exercisesToday,
      dayStreak,
      averageScore,
      totalExercises,
      difficultyStats,
    };
  } catch (error) {
    console.error('Unexpected error fetching dashboard stats:', error);
    return {
      exercisesToday: 0,
      dayStreak: 0,
      averageScore: null,
      totalExercises: 0,
    };
  }
}

/**
 * Get recent activity (last 5 exercises)
 */
export async function getRecentActivity(userId: string, limit: number = 5): Promise<RecentActivity[]> {
  try {
    // First, get exercise history
    const { data: historyData, error: historyError } = await supabase
      .from('user_exercise_history')
      .select(`
        id,
        exercise_id,
        score,
        max_score,
        score_percent,
        completed_at
      `)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (historyError) {
      console.error('Error fetching recent activity:', historyError);
      return [];
    }

    if (!historyData || historyData.length === 0) {
      return [];
    }

    // Get exercise topics separately (if needed)
    const exerciseIds = historyData.map(h => h.exercise_id).filter(Boolean);
    let topicsMap: Record<string, string> = {};

    if (exerciseIds.length > 0) {
      const { data: exercisesData } = await supabase
        .from('exercises')
        .select('id, topic')
        .in('id', exerciseIds);

      if (exercisesData) {
        topicsMap = exercisesData.reduce((acc, ex) => {
          acc[ex.id] = ex.topic;
          return acc;
        }, {} as Record<string, string>);
      }
    }

    // Transform data to match RecentActivity interface
    return historyData.map((record: any) => ({
      id: record.id,
      exerciseId: record.exercise_id,
      score: record.score || 0,
      maxScore: record.max_score || 0,
      scorePercent: typeof record.score_percent === 'number' 
        ? record.score_percent 
        : parseFloat(String(record.score_percent || 0)),
      completedAt: record.completed_at || '',
      topic: topicsMap[record.exercise_id] || undefined,
    }));
  } catch (error) {
    console.error('Unexpected error fetching recent activity:', error);
    return [];
  }
}
