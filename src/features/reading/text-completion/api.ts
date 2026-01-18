import { supabase } from '@/integrations/supabase/client';
import { TextCompletionPassage } from '../types';

export interface GeneratePassageResult {
  data: TextCompletionPassage | null;
  error: Error | null;
}

export interface LoadExerciseResult {
  data: TextCompletionPassage | null;
  error: Error | null;
}

/**
 * Load a specific exercise by ID (for review)
 */
export async function loadExerciseById(exerciseId: string): Promise<LoadExerciseResult> {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('id, content, topic, topic_category, difficulty')
      .eq('id', exerciseId)
      .single();

    if (error) {
      console.error('Error loading exercise:', error);
      return { data: null, error: new Error('Exercise not found') };
    }

    if (!data || !data.content) {
      return { data: null, error: new Error('Exercise content not found') };
    }

    // Transform to TextCompletionPassage format
    const content = data.content as any;
    const passage: TextCompletionPassage = {
      topic: content.topic || data.topic,
      content_parts: content.content_parts || [],
      difficulty: data.difficulty || content.difficulty,
      topic_category: data.topic_category || content.topic_category,
      exercise_id: data.id,
    };

    return { data: passage, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error'),
    };
  }
}

export interface SaveExerciseHistoryParams {
  exerciseId: string;
  score: number;
  maxScore: number;
  scorePercent: number;
  timeSpentSeconds: number;
  answers: Record<number, string>;
  mistakes: Record<number, string>;
  // New fields for complete tracking
  difficulty?: 'easy' | 'intermediate' | 'hard';
  topicCategory?: string;
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

    // Optional Auth Pattern: Allow demo mode without session
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add Authorization if session exists
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-passage`,
      {
        method: 'POST',
        headers,
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
 */
export async function findExerciseId(passage: TextCompletionPassage): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('id, topic, content')
      .eq('section', 'reading')
      .eq('exercise_type', 'text-completion')
      .eq('topic', passage.topic)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error finding exercise:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    const currentBlankCount = passage.content_parts.filter(
      (part) => part.type === 'blank'
    ).length;

    for (const exercise of data) {
      if (exercise.content && typeof exercise.content === 'object') {
        const exerciseContent = exercise.content as { content_parts?: Array<{ type: string }> };
        const exerciseBlankCount = exerciseContent.content_parts?.filter(
          (part) => part.type === 'blank'
        ).length || 0;

        if (exerciseBlankCount === currentBlankCount) {
          return exercise.id;
        }
      }
    }

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

    // Use exercise_id from passage if available, otherwise find it
    const exerciseId = passage.exercise_id || await findExerciseId(passage);
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
        // New fields for complete tracking
        difficulty: params.difficulty || passage.difficulty || 'intermediate',
        topic_category: params.topicCategory || passage.topic_category,
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
  sourceContext: string;
  sourcePassageId: string;
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
      const { data, error } = await supabase
        .from('user_vocabulary')
        .update({
          source_context: params.sourceContext,
          source_passage_id: params.sourcePassageId,
          added_from: params.addedFrom || 'auto_extract',
          first_encountered_at: new Date().toISOString(),
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

    const { data, error } = await supabase
      .from('user_vocabulary')
      .insert({
        user_id: session.user.id,
        word: params.word.toLowerCase(),
        definition: params.definition,
        example_sentence: params.exampleSentence,
        source_context: params.sourceContext,
        source_passage_id: params.sourcePassageId,
        source_exercise_id: params.sourcePassageId,
        added_from: params.addedFrom || 'auto_extract',
        first_encountered_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) throw error;

    return {
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
