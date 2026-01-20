/**
 * Settings API 함수들
 * 사용자 프로필 및 설정 관리
 */

import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  locale: string;
  timezone: string;
  daily_goal: number;
  preferred_difficulty: string | null;
  preferred_topics: string[] | null;
}

export interface UpdateProfileParams {
  display_name?: string;
  avatar_url?: string;
  locale?: string;
  timezone?: string;
  daily_goal?: number;
  preferred_difficulty?: string;
  preferred_topics?: string[];
}

export interface GetProfileResult {
  data: UserProfile | null;
  error: Error | null;
}

export interface UpdateProfileResult {
  success: boolean;
  error: Error | null;
}

/**
 * Get user profile
 */
export async function getUserProfile(): Promise<GetProfileResult> {
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
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No profile exists, create one
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: session.user.id,
            display_name: session.user.user_metadata?.full_name || null,
            locale: 'en',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            daily_goal: 5,
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          return { data: null, error: new Error(createError.message) };
        }

        return {
          data: {
            id: newProfile.id,
            display_name: newProfile.display_name,
            avatar_url: newProfile.avatar_url,
            locale: newProfile.locale || 'en',
            timezone: newProfile.timezone || 'UTC',
            daily_goal: newProfile.daily_goal || 5,
            preferred_difficulty: newProfile.preferred_difficulty,
            preferred_topics: newProfile.preferred_topics,
          },
          error: null,
        };
      }
      console.error('Error fetching user profile:', error);
      return { data: null, error: new Error(error.message) };
    }

    return {
      data: {
        id: data.id,
        display_name: data.display_name,
        avatar_url: data.avatar_url,
        locale: data.locale || 'en',
        timezone: data.timezone || 'UTC',
        daily_goal: data.daily_goal || 5,
        preferred_difficulty: data.preferred_difficulty,
        preferred_topics: data.preferred_topics,
      },
      error: null,
    };
  } catch (err) {
    console.error('Unexpected error in getUserProfile:', err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error'),
    };
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  params: UpdateProfileParams
): Promise<UpdateProfileResult> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return {
        success: false,
        error: new Error('Authentication required'),
      };
    }

    const updateData: any = {};
    if (params.display_name !== undefined) updateData.display_name = params.display_name;
    if (params.avatar_url !== undefined) updateData.avatar_url = params.avatar_url;
    if (params.locale !== undefined) updateData.locale = params.locale;
    if (params.timezone !== undefined) updateData.timezone = params.timezone;
    if (params.daily_goal !== undefined) updateData.daily_goal = params.daily_goal;
    if (params.preferred_difficulty !== undefined) updateData.preferred_difficulty = params.preferred_difficulty;
    if (params.preferred_topics !== undefined) updateData.preferred_topics = params.preferred_topics;

    updateData.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', session.user.id);

    if (error) {
      console.error('Error updating user profile:', error);
      return { success: false, error: new Error(error.message) };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Unexpected error in updateUserProfile:', err);
    return {
      success: false,
      error: err instanceof Error ? err : new Error('Unknown error'),
    };
  }
}
