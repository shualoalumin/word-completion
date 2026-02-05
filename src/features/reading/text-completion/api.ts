import { supabase } from '@/integrations/supabase/client';
import { TextCompletionPassage } from './types';

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
  exerciseId?: string;
  score: number;
  maxScore: number;
  scorePercent: number;
  /** Time spent in seconds (includes overtime; recorded from timer start to submit) */
  timeSpentSeconds: number;
  /** Target time for this difficulty (for analytics) */
  targetTimeSeconds?: number;
  answers: Record<number, string>;
  mistakes: any[];
  difficulty?: 'easy' | 'intermediate' | 'hard';
  topicCategory?: string;
}

export interface SaveExerciseHistoryResult {
  success: boolean;
  error: Error | null;
  historyId?: string;
}

/**
 * Get recent exercise IDs completed by the current user (to avoid repeating too soon)
 */
export async function getRecentTextCompletionExerciseIds(
  limit: number = 30
): Promise<string[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('user_exercise_history')
      .select('exercise_id')
      .eq('user_id', user.id)
      .eq('exercise_type', 'text-completion')
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data.map((r: { exercise_id: string }) => r.exercise_id).filter(Boolean);
  } catch {
    return [];
  }
}

export interface GeneratePassageOptions {
  /** Exclude these exercise IDs when picking from cache (spaced repetition) */
  excludeExerciseIds?: string[];
}

/**
 * Generate a new passage via Edge Function
 */
export async function generatePassage(
  retryCount = 0,
  options?: GeneratePassageOptions
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

    const body: { excludeExerciseIds?: string[] } = {};
    if (options?.excludeExerciseIds?.length) {
      body.excludeExerciseIds = options.excludeExerciseIds;
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-passage`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
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

const SAVE_HISTORY_RETRIES = 2;

/**
 * Save exercise history to database (with retries).
 * Only saves if user is authenticated. Time includes overtime.
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

    const exerciseId = passage.exercise_id || await findExerciseId(passage);
    if (!exerciseId) {
      console.warn('Could not find exercise_id, skipping history save');
      return {
        success: false,
        error: new Error('Exercise not found'),
      };
    }

    const basePayload: Record<string, unknown> = {
      user_id: session.user.id,
      exercise_id: exerciseId,
      score: params.score,
      max_score: params.maxScore,
      score_percent: params.scorePercent,
      time_spent_seconds: params.timeSpentSeconds,
      answers: params.answers,
      mistakes: params.mistakes,
      difficulty: params.difficulty || passage.difficulty || 'intermediate',
      topic_category: params.topicCategory || passage.topic_category,
    };

    // Try with target_time_seconds first; if DB doesn't have the column yet, retry without it
    const payloads: Record<string, unknown>[] = [
      { ...basePayload, ...(params.targetTimeSeconds != null && { target_time_seconds: params.targetTimeSeconds }) },
      basePayload,
    ];

    let lastError: Error | null = null;
    for (const payload of payloads) {
      for (let attempt = 0; attempt <= SAVE_HISTORY_RETRIES; attempt++) {
        const { data, error } = await supabase
          .from('user_exercise_history')
          .insert(payload)
          .select('id')
          .single();

        if (!error) {
          return { success: true, error: null, historyId: data.id };
        }
        lastError = error;
        if (attempt < SAVE_HISTORY_RETRIES) {
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        }
      }
    }

    return {
      success: false,
      error: lastError ?? new Error('Unknown error'),
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
      const updateData: Record<string, unknown> = {
        source_context: params.sourceContext,
        source_passage_id: params.sourcePassageId,
        added_from: params.addedFrom || 'auto_extract',
        first_encountered_at: new Date().toISOString(),
      };
      if (params.definition) updateData.definition = params.definition;
      if (params.exampleSentence) updateData.example_sentence = params.exampleSentence;

      const { data, error } = await supabase
        .from('user_vocabulary')
        .update(updateData)
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

/**
 * Explain word meaning in context using AI
 */
export interface ExplainWordInContextParams {
  word: string;
  context: string;
  signal?: AbortSignal;
}

export interface ExplainWordInContextResult {
  definition: string | null;
  explanation: string | null;
  error: Error | null;
}

export async function explainWordInContext(
  params: ExplainWordInContextParams
): Promise<ExplainWordInContextResult> {
  const supabaseUrlRaw = import.meta.env.VITE_SUPABASE_URL;
  const supabaseUrl = supabaseUrlRaw || "https://qnqfarulquicshnwfaxi.supabase.co";
  const url = `${supabaseUrl}/functions/v1/explain-word-in-context`;
  console.log('[API] explainWordInContext called for:', params.word);
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

    console.log('[API] Calling edge function...');

    const response = await fetch(
      url,
      {
        method: 'POST',
        headers,
        signal: params.signal,
        body: JSON.stringify({
          word: params.word,
          context: params.context,
        }),
      }
    );

    console.log('[API] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Error response:', errorText);
      throw new Error(`Failed to explain word: ${errorText}`);
    }

    let result: { definition?: string; explanation?: string };
    try {
      result = await response.json();
    } catch (parseErr) {
      throw parseErr;
    }
    console.log('[API] Success result:', result);

    return {
      definition: result.definition || null,
      explanation: result.explanation || null,
      error: null,
    };
  } catch (err) {
    console.error('[API] Catch error:', err);
    return {
      definition: null,
      explanation: null,
      error: err instanceof Error ? err : new Error('Unknown error'),
    };
  }
}
/**
 * Get history for a specific exercise (to show progress)
 */
export async function getExerciseHistoryById(exerciseId: string): Promise<{ data: any[] | null, error: Error | null }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { data: null, error: new Error('Auth required') };

    const { data, error } = await supabase
      .from('user_exercise_history')
      .select('score_percent, completed_at')
      .eq('user_id', session.user.id)
      .eq('exercise_id', exerciseId)
      .order('completed_at', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Load a specific history record by ID
 */
export async function loadHistoryRecordById(historyId: string): Promise<{ data: any | null, error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('user_exercise_history')
      .select('*')
      .eq('id', historyId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Performance statistics by difficulty level
 */
export interface PerformanceStatsByDifficulty {
  difficulty: 'easy' | 'intermediate' | 'hard';
  avgTime: number; // Average time in seconds
  bestTime: number; // Best (minimum) time in seconds
  attempts: number; // Number of attempts
}

export interface GetPerformanceStatsResult {
  data: PerformanceStatsByDifficulty[] | null;
  error: Error | null;
}

/**
 * Get user performance statistics grouped by difficulty level
 * Returns average time, best time, and attempt count for each difficulty
 */
export async function getUserPerformanceStats(): Promise<GetPerformanceStatsResult> {
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

    // Get all completed exercises for this user
    const { data, error } = await supabase
      .from('user_exercise_history')
      .select('difficulty, time_spent_seconds')
      .eq('user_id', session.user.id)
      .not('difficulty', 'is', null)
      .order('completed_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return {
        data: [],
        error: null,
      };
    }

    // Group by difficulty and calculate stats
    const statsByDifficulty = new Map<
      'easy' | 'intermediate' | 'hard',
      { times: number[]; count: number }
    >();

    data.forEach((record) => {
      const diff = record.difficulty as 'easy' | 'intermediate' | 'hard';
      if (!statsByDifficulty.has(diff)) {
        statsByDifficulty.set(diff, { times: [], count: 0 });
      }
      const stats = statsByDifficulty.get(diff)!;
      stats.times.push(record.time_spent_seconds);
      stats.count++;
    });

    // Calculate averages and minimums
    const results: PerformanceStatsByDifficulty[] = [];
    statsByDifficulty.forEach((stats, difficulty) => {
      const avgTime = stats.times.reduce((a, b) => a + b, 0) / stats.times.length;
      const bestTime = Math.min(...stats.times);
      results.push({
        difficulty,
        avgTime: Math.round(avgTime),
        bestTime,
        attempts: stats.count,
      });
    });

    // Sort by difficulty: easy, intermediate, hard
    const difficultyOrder = { easy: 1, intermediate: 2, hard: 3 };
    results.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);

    return {
      data: results,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error'),
    };
  }
}
