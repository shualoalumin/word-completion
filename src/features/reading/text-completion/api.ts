import { supabase } from '@/integrations/supabase/client';
import { TextCompletionPassage } from './types';
import { API_CONFIG } from '@/core/constants';

export interface GeneratePassageResult {
  data: TextCompletionPassage | null;
  error: Error | null;
}

export interface SaveExerciseHistoryParams {
  exerciseId: string;
  score: number;
  maxScore: number;
  timeSpentSeconds: number;
  answers: Record<number, string>;
  mistakes: Array<{
    blank_id: number;
    user_answer: string;
    correct_answer: string;
  }>;
}

export interface SaveExerciseHistoryResult {
  success: boolean;
  error: Error | null;
  historyId?: string;
}

/**
 * Generate a new passage from the backend
 */
export async function generatePassage(
  retryCount = 0
): Promise<GeneratePassageResult> {
  try {
    // Get current session to include auth token
    const { data: { session } } = await supabase.auth.getSession();
    
    // Invoke Edge Function with explicit headers
    const { data, error } = await supabase.functions.invoke('generate-passage', {
      headers: session ? {
        Authorization: `Bearer ${session.access_token}`,
      } : undefined,
    });

    if (error) {
      throw error;
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return { data: data as TextCompletionPassage, error: null };
  } catch (err) {
    console.error('Error generating passage:', err);

    if (retryCount < API_CONFIG.RETRY_COUNT) {
      // Retry with delay
      await new Promise((resolve) =>
        setTimeout(resolve, API_CONFIG.RETRY_DELAY)
      );
      return generatePassage(retryCount + 1);
    }

    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error'),
    };
  }
}

/**
 * Find exercise_id by matching passage topic and content structure
 * This is necessary because the Edge Function doesn't return exercise_id
 * 
 * Strategy:
 * 1. Match by topic (exact)
 * 2. Match by content_parts structure (same number of blanks and similar structure)
 * 3. Return the most recent matching exercise (likely the one just generated/cached)
 */
async function findExerciseId(passage: TextCompletionPassage): Promise<string | null> {
  try {
    // Try to find exercise by topic
    const { data, error } = await supabase
      .from('exercises')
      .select('id, topic, content')
      .eq('section', 'reading')
      .eq('exercise_type', 'text-completion')
      .eq('topic', passage.topic)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20); // Check more exercises for better matching

    if (error) {
      console.error('Error finding exercise:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    // Count blanks in the current passage
    const currentBlankCount = passage.content_parts.filter(
      (part) => part.type === 'blank'
    ).length;

    // Try to find exact match by content structure
    // Match by: same topic + same number of blanks + similar content_parts structure
    for (const exercise of data) {
      if (exercise.content && typeof exercise.content === 'object') {
        const exerciseContent = exercise.content as { content_parts?: Array<{ type: string }> };
        const exerciseBlankCount = exerciseContent.content_parts?.filter(
          (part) => part.type === 'blank'
        ).length || 0;

        // Exact match: same number of blanks
        if (exerciseBlankCount === currentBlankCount) {
          // For now, return the first match with same blank count
          // In production, you might want more sophisticated content comparison
          return exercise.id;
        }
      }
    }

    // Fallback: return the most recent exercise with matching topic
    // (This is likely the one just generated/cached)
    return data[0]?.id || null;
  } catch (err) {
    console.error('Error in findExerciseId:', err);
    return null;
  }
}

/**
 * Save exercise history to database
 * Only saves if user is authenticated
 */
export async function saveExerciseHistory(
  passage: TextCompletionPassage,
  params: Omit<SaveExerciseHistoryParams, 'exerciseId'>
): Promise<SaveExerciseHistoryResult> {
  try {
    // Check if user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session || !session.user) {
      // Not authenticated - silently skip (optional auth pattern)
      console.log('User not authenticated, skipping history save');
      return { success: false, error: null };
    }

    // Find exercise_id
    const exerciseId = await findExerciseId(passage);
    
    if (!exerciseId) {
      console.warn('Could not find exercise_id for passage:', passage.topic);
      // Still try to save without exercise_id (might fail due to FK constraint)
      // But let's try to create a placeholder or skip
      return {
        success: false,
        error: new Error('Could not find exercise_id for this passage'),
      };
    }

    // Calculate score_percent
    const scorePercent = params.maxScore > 0
      ? (params.score / params.maxScore) * 100
      : 0;

    // Insert history record
    const { data, error } = await supabase
      .from('user_exercise_history')
      .insert({
        user_id: session.user.id,
        exercise_id: exerciseId,
        score: params.score,
        max_score: params.maxScore,
        score_percent: parseFloat(scorePercent.toFixed(2)),
        time_spent_seconds: params.timeSpentSeconds,
        answers: params.answers,
        mistakes: params.mistakes.length > 0 ? params.mistakes : null,
        completed_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error saving exercise history:', error);
      
      // Handle unique constraint violation (user already completed this exercise)
      if (error.code === '23505') {
        // Update existing record instead
        const { data: updateData, error: updateError } = await supabase
          .from('user_exercise_history')
          .update({
            score: params.score,
            max_score: params.maxScore,
            score_percent: parseFloat(scorePercent.toFixed(2)),
            time_spent_seconds: params.timeSpentSeconds,
            answers: params.answers,
            mistakes: params.mistakes.length > 0 ? params.mistakes : null,
            completed_at: new Date().toISOString(),
          })
          .eq('user_id', session.user.id)
          .eq('exercise_id', exerciseId)
          .select('id')
          .single();

        if (updateError) {
          return {
            success: false,
            error: updateError instanceof Error ? updateError : new Error(String(updateError)),
          };
        }

        if (!updateData) {
          return {
            success: false,
            error: new Error('Failed to update exercise history'),
          };
        }

        return {
          success: true,
          error: null,
          historyId: updateData.id,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }

    if (!data) {
      return {
        success: false,
        error: new Error('Failed to save exercise history: no data returned'),
      };
    }

    return {
      success: true,
      error: null,
      historyId: data.id,
    };
  } catch (err) {
    console.error('Unexpected error saving exercise history:', err);
    return {
      success: false,
      error: err instanceof Error ? err : new Error('Unknown error'),
    };
  }
}







