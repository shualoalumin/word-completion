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

/**
 * Bookmark related functions
 */
export interface BookmarkExerciseParams {
  exerciseId: string;
  note?: string;
  folder?: string;
}

export interface BookmarkExerciseResult {
  success: boolean;
  error: Error | null;
}

export async function bookmarkExercise(
  params: BookmarkExerciseParams
): Promise<BookmarkExerciseResult> {
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

    const { error } = await supabase
      .from('user_bookmarks')
      .insert({
        user_id: session.user.id,
        exercise_id: params.exerciseId,
        note: params.note || null,
        folder: params.folder || 'default',
      });

    if (error) {
      // If already bookmarked, update instead
      if (error.code === '23505') {
        const { error: updateError } = await supabase
          .from('user_bookmarks')
          .update({
            note: params.note || null,
            folder: params.folder || 'default',
          })
          .eq('user_id', session.user.id)
          .eq('exercise_id', params.exerciseId);

        if (updateError) throw updateError;
        return { success: true, error: null };
      }
      throw error;
    }

    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error('Unknown error'),
    };
  }
}

export interface UnbookmarkExerciseResult {
  success: boolean;
  error: Error | null;
}

export async function unbookmarkExercise(
  exerciseId: string
): Promise<UnbookmarkExerciseResult> {
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

    const { error } = await supabase
      .from('user_bookmarks')
      .delete()
      .eq('user_id', session.user.id)
      .eq('exercise_id', exerciseId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error('Unknown error'),
    };
  }
}

export interface CheckBookmarkResult {
  isBookmarked: boolean;
  bookmark?: {
    note?: string;
    folder: string;
    created_at: string;
  };
}

export async function checkBookmark(
  exerciseId: string
): Promise<CheckBookmarkResult> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return { isBookmarked: false };
    }

    const { data, error } = await supabase
      .from('user_bookmarks')
      .select('note, folder, created_at')
      .eq('user_id', session.user.id)
      .eq('exercise_id', exerciseId)
      .single();

    if (error || !data) {
      return { isBookmarked: false };
    }

    return {
      isBookmarked: true,
      bookmark: {
        note: data.note || undefined,
        folder: data.folder,
        created_at: data.created_at,
      },
    };
  } catch {
    return { isBookmarked: false };
  }
}

export interface BookmarkItem {
  id: string;
  exerciseId: string;
  note?: string;
  folder: string;
  createdAt: string;
  topic?: string;
  difficulty?: string;
  topicCategory?: string;
}

export interface GetBookmarksResult {
  data: BookmarkItem[] | null;
  error: Error | null;
}

export async function getBookmarks(folder?: string): Promise<GetBookmarksResult> {
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

    // First, get bookmarks
    let query = supabase
      .from('user_bookmarks')
      .select('exercise_id, note, folder, created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (folder) {
      query = query.eq('folder', folder);
    }

    const { data: bookmarksData, error: bookmarksError } = await query;

    if (bookmarksError) {
      throw bookmarksError;
    }

    if (!bookmarksData || bookmarksData.length === 0) {
      return {
        data: [],
        error: null,
      };
    }

    // Then, get exercise details
    const exerciseIds = bookmarksData.map(b => b.exercise_id);
    const { data: exercisesData, error: exercisesError } = await supabase
      .from('exercises')
      .select('id, topic, difficulty, topic_category')
      .in('id', exerciseIds);

    if (exercisesError) {
      console.error('Error fetching exercises:', exercisesError);
    }

    // Create a map for quick lookup
    const exercisesMap = new Map(
      (exercisesData || []).map(ex => [ex.id, ex])
    );

    const bookmarks: BookmarkItem[] = bookmarksData.map((item) => {
      const exercise = exercisesMap.get(item.exercise_id);
      return {
        id: `${item.exercise_id}-${item.created_at}`,
        exerciseId: item.exercise_id,
        note: item.note || undefined,
        folder: item.folder,
        createdAt: item.created_at,
        topic: exercise?.topic,
        difficulty: exercise?.difficulty,
        topicCategory: exercise?.topic_category,
      };
    });

    return {
      data: bookmarks,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error'),
    };
  }
}
