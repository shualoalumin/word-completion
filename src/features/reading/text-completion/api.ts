import { supabase } from '@/integrations/supabase/client';
import { TextCompletionPassage } from '../types';

export interface GeneratePassageResult {
  data: TextCompletionPassage | null;
  error: Error | null;
}

export interface SaveExerciseHistoryParams {
  exerciseId: string;
  score: number;
  maxScore: number;
  scorePercent: number;
  timeSpentSeconds: number;
  answers: Record<number, string>;
  mistakes: Record<number, string>;
}

export interface SaveExerciseHistoryResult {
  success: boolean;
  error: Error | null;
  historyId?: string;
}

/**
 * Generate a new passage via Edge Function
 */
export async function generatePassage(
  retryCount = 0
): Promise<GeneratePassageResult> {
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

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-passage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate passage: ${errorText}`);
    }

    const result = await response.json();
    return {
      data: result as TextCompletionPassage,
      error: null,
    };
  } catch (err) {
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
export async function findExerciseId(passage: TextCompletionPassage): Promise<string | null> {
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
  params: SaveExerciseHistoryParams
): Promise<SaveExerciseHistoryResult> {
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

    // Find exercise_id
    const exerciseId = await findExerciseId(passage);
    if (!exerciseId) {
      console.warn('Could not find exercise_id, skipping history save');
      return {
        success: false,
        error: new Error('Exercise not found'),
      };
    }

    const { data, error } = await supabase
      .from('user_exercise_history')
      .insert({
        user_id: session.user.id,
        exercise_id: exerciseId,
        score: params.score,
        max_score: params.maxScore,
        score_percent: params.scorePercent,
        time_spent_seconds: params.timeSpentSeconds,
        answers: params.answers,
        mistakes: params.mistakes,
      })
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      error: null,
      historyId: data.id,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error('Unknown error'),
    };
  }
}

/**
 * Add word to user vocabulary
 */
export interface AddWordToVocabularyParams {
  word: string;
  definition?: string;
  exampleSentence?: string;
  sourceContext: string; // ?�문 문장 (맥락)
  sourcePassageId: string; // exercise ID
  addedFrom?: 'manual' | 'auto_extract' | 'mistake_priority';
}

export interface AddWordToVocabularyResult {
  success: boolean;
  error: Error | null;
  vocabularyId?: string;
}

export async function addWordToVocabulary(
  params: AddWordToVocabularyParams
): Promise<AddWordToVocabularyResult> {
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

    // Check if word already exists for this user
    const { data: existing } = await supabase
      .from('user_vocabulary')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('word', params.word.toLowerCase())
      .single();

    if (existing) {
      // Word already exists, update it
      const { data, error } = await supabase
        .from('user_vocabulary')
        .update({
          source_context: params.sourceContext,
          source_passage_id: params.sourcePassageId,
          added_from: params.addedFrom || 'auto_extract',
          first_encountered_at: existing.first_encountered_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('id')
        .single();

      if (error) throw error;

      return {
        success: true,
        error: null,
        vocabularyId: data.id,
      };
    }

    // Insert new word
    const { data, error } = await supabase
      .from('user_vocabulary')
      .insert({
        user_id: session.user.id,
        word: params.word.toLowerCase(),
        definition: params.definition,
        example_sentence: params.exampleSentence,
        source_context: params.sourceContext,
        source_passage_id: params.sourcePassageId,
        source_exercise_id: params.sourcePassageId, // For backward compatibility
        added_from: params.addedFrom || 'auto_extract',
        first_encountered_at: new Date().toISOString(),
      })
      .select('id')
      .single();    if (error) throw error;    return {
      success: true,
      error: null,
      vocabularyId: data.id,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error('Unknown error'),
    };
  }
}
