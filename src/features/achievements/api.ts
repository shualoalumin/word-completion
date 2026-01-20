/**
 * Achievements API 함수들
 * 업적 시스템 관리
 */

import { supabase } from '@/integrations/supabase/client';

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string | null;
  category: string;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement?: Achievement;
}

export interface GetAchievementsResult {
  data: Achievement[] | null;
  error: Error | null;
}

export interface GetUserAchievementsResult {
  data: UserAchievement[] | null;
  error: Error | null;
}

export interface UnlockAchievementResult {
  success: boolean;
  error: Error | null;
}

/**
 * Get all available achievements
 */
export async function getAchievements(): Promise<GetAchievementsResult> {
  try {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('category', { ascending: true })
      .order('points', { ascending: false });

    if (error) {
      console.error('Error fetching achievements:', error);
      return { data: null, error: new Error(error.message) };
    }

    return {
      data: (data || []).map((ach: any) => ({
        id: ach.id,
        code: ach.code,
        name: ach.name,
        description: ach.description,
        icon: ach.icon,
        category: ach.category,
        points: ach.points || 0,
        rarity: ach.rarity || 'common',
        created_at: ach.created_at,
      })),
      error: null,
    };
  } catch (err) {
    console.error('Unexpected error in getAchievements:', err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error'),
    };
  }
}

/**
 * Get user's unlocked achievements
 */
export async function getUserAchievements(): Promise<GetUserAchievementsResult> {
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
      .from('user_achievements')
      .select(`
        *,
        achievement:achievements(*)
      `)
      .eq('user_id', session.user.id)
      .order('unlocked_at', { ascending: false });

    if (error) {
      console.error('Error fetching user achievements:', error);
      return { data: null, error: new Error(error.message) };
    }

    return {
      data: (data || []).map((ua: any) => ({
        id: ua.id,
        user_id: ua.user_id,
        achievement_id: ua.achievement_id,
        unlocked_at: ua.unlocked_at,
        achievement: ua.achievement ? {
          id: ua.achievement.id,
          code: ua.achievement.code,
          name: ua.achievement.name,
          description: ua.achievement.description,
          icon: ua.achievement.icon,
          category: ua.achievement.category,
          points: ua.achievement.points || 0,
          rarity: ua.achievement.rarity || 'common',
          created_at: ua.achievement.created_at,
        } : undefined,
      })),
      error: null,
    };
  } catch (err) {
    console.error('Unexpected error in getUserAchievements:', err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error'),
    };
  }
}

/**
 * Check if user has unlocked a specific achievement
 */
export async function checkAchievement(code: string): Promise<boolean> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return false;
    }

    // Get achievement by code
    const { data: achievement } = await supabase
      .from('achievements')
      .select('id')
      .eq('code', code)
      .single();

    if (!achievement) {
      return false;
    }

    // Check if user has unlocked it
    const { data: userAchievement } = await supabase
      .from('user_achievements')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('achievement_id', achievement.id)
      .single();

    return !!userAchievement;
  } catch (err) {
    console.error('Error checking achievement:', err);
    return false;
  }
}
