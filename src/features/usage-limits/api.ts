/**
 * Usage Limits API 함수들
 * 사용량 제한 관리
 */

import { supabase } from '@/integrations/supabase/client';

export interface UsageLimits {
  user_id: string;
  daily_exercises_used: number;
  daily_exercises_limit: number | null; // null = unlimited
  daily_ai_generations_used: number;
  monthly_ai_generations_used: number;
  last_reset_date: string;
}

export interface GetUsageLimitsResult {
  data: UsageLimits | null;
  error: Error | null;
}

export interface CheckUsageResult {
  canProceed: boolean;
  remaining: number | null; // null = unlimited
  error: Error | null;
}

/**
 * Get user's usage limits
 */
export async function getUsageLimits(): Promise<GetUsageLimitsResult> {
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
      .from('user_usage_limits')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No record exists, return default values
        return {
          data: {
            user_id: session.user.id,
            daily_exercises_used: 0,
            daily_exercises_limit: 10,
            daily_ai_generations_used: 0,
            monthly_ai_generations_used: 0,
            last_reset_date: new Date().toISOString().split('T')[0],
          },
          error: null,
        };
      }
      console.error('Error fetching usage limits:', error);
      return { data: null, error: new Error(error.message) };
    }

    return {
      data: {
        user_id: data.user_id,
        daily_exercises_used: data.daily_exercises_used || 0,
        daily_exercises_limit: data.daily_exercises_limit,
        daily_ai_generations_used: data.daily_ai_generations_used || 0,
        monthly_ai_generations_used: data.monthly_ai_generations_used || 0,
        last_reset_date: data.last_reset_date || new Date().toISOString().split('T')[0],
      },
      error: null,
    };
  } catch (err) {
    console.error('Unexpected error in getUsageLimits:', err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error'),
    };
  }
}

/**
 * Check if user can proceed with an exercise
 */
export async function checkExerciseUsage(): Promise<CheckUsageResult> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return {
        canProceed: false,
        remaining: null,
        error: new Error('Authentication required'),
      };
    }

    // Call the database function
    const { data, error } = await supabase.rpc('check_and_increment_exercise_usage', {
      user_uuid: session.user.id,
    });

    if (error) {
      console.error('Error checking exercise usage:', error);
      return {
        canProceed: false,
        remaining: null,
        error: new Error(error.message),
      };
    }

    // Get updated usage limits
    const limitsResult = await getUsageLimits();
    if (limitsResult.error || !limitsResult.data) {
      return {
        canProceed: data === true,
        remaining: null,
        error: limitsResult.error,
      };
    }

    const limits = limitsResult.data;
    const remaining = limits.daily_exercises_limit === null
      ? null
      : Math.max(0, limits.daily_exercises_limit - limits.daily_exercises_used);

    return {
      canProceed: data === true,
      remaining,
      error: null,
    };
  } catch (err) {
    console.error('Unexpected error in checkExerciseUsage:', err);
    return {
      canProceed: false,
      remaining: null,
      error: err instanceof Error ? err : new Error('Unknown error'),
    };
  }
}
