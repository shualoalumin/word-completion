import { supabase } from '@/integrations/supabase/client';
import { BuildSentenceQuestion } from './types';

export interface GenerateBuildSentenceResult {
  data: BuildSentenceQuestion | null;
  error: Error | null;
}

/**
 * Generate a new Build a Sentence question via Edge Function
 */
export async function generateBuildSentenceQuestion(): Promise<GenerateBuildSentenceResult> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-build-sentence`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({}),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate question: ${errorText}`);
    }

    const result = await response.json();
    return {
      data: result as BuildSentenceQuestion,
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
 * Generate multiple questions for a session
 */
export async function generateSessionQuestions(
  count: number = 10
): Promise<{ data: BuildSentenceQuestion[]; error: Error | null }> {
  const questions: BuildSentenceQuestion[] = [];
  const errors: Error[] = [];

  // Generate questions in parallel (max 3 at a time to avoid rate limits)
  const batchSize = 3;
  for (let i = 0; i < count; i += batchSize) {
    const batch = Array(Math.min(batchSize, count - i))
      .fill(null)
      .map(() => generateBuildSentenceQuestion());
    
    const results = await Promise.all(batch);
    
    for (const result of results) {
      if (result.data) {
        questions.push(result.data);
      } else if (result.error) {
        errors.push(result.error);
      }
    }
  }

  if (questions.length === 0 && errors.length > 0) {
    return { data: [], error: errors[0] };
  }

  return { data: questions, error: null };
}

// ============================================
// History Saving Functions
// ============================================

export type BuildSentencePracticeMode = 'untimed' | 'timed' | 'test';

export interface SaveBuildSentenceHistoryParams {
  exerciseId?: string;
  score: number;
  maxScore: number;
  scorePercent: number;
  timeSpentSeconds: number;
  targetTimeSeconds?: number;
  practiceMode?: BuildSentencePracticeMode;
  answers: { 
    questionIndex: number; 
    userOrder: string[]; 
    isCorrect: boolean;
    questionData: BuildSentenceQuestion; // Store the full question for review
  }[];
  mistakes: { questionIndex: number; correctOrder: string[]; userOrder: string[] }[];
  difficulty?: 'easy' | 'medium' | 'hard';
  topicCategory?: string;
}

export interface SaveBuildSentenceHistoryResult {
  success: boolean;
  error: Error | null;
  historyId?: string;
}

const SAVE_HISTORY_RETRIES = 2;

/**
 * Save Build Sentence exercise history to database
 */
export async function saveBuildSentenceHistory(
  params: SaveBuildSentenceHistoryParams
): Promise<SaveBuildSentenceHistoryResult> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= SAVE_HISTORY_RETRIES; attempt++) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.log('[BuildSentence] No authenticated user, skipping history save');
        return { success: false, error: new Error('Not authenticated') };
      }

      // Map difficulty to core format
      const difficultyMap: Record<string, string> = {
        easy: 'easy',
        medium: 'intermediate',
        hard: 'hard',
      };
      const mappedDifficulty = params.difficulty 
        ? difficultyMap[params.difficulty] || 'intermediate'
        : 'intermediate';

      const { data, error } = await supabase
        .from('user_exercise_history')
        .insert({
          user_id: user.id,
          exercise_id: params.exerciseId || null,
          section: 'writing',
          exercise_type: 'build-sentence',
          score: params.score,
          max_score: params.maxScore,
          score_percent: params.scorePercent,
          time_spent_seconds: params.timeSpentSeconds,
          target_time_seconds: params.targetTimeSeconds || null,
          practice_mode: params.practiceMode ?? 'timed',
          answers: params.answers,
          mistakes: params.mistakes,
          difficulty: mappedDifficulty,
          topic_category: params.topicCategory || null,
        } as any)
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      console.log(`[BuildSentence] History saved with ID: ${data?.id}`);
      return {
        success: true,
        error: null,
        historyId: data?.id,
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Unknown error');
      console.error(`[BuildSentence] History save attempt ${attempt + 1} failed:`, lastError.message);

      if (attempt < SAVE_HISTORY_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
  }

  return { success: false, error: lastError };
}

/**
 * Get Build Sentence history for the current user
 */
export async function getBuildSentenceHistory(
  limit: number = 10
): Promise<{ data: any[] | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error('Not authenticated') };
    }

    const { data, error } = await supabase
      .from('user_exercise_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('exercise_type', 'build-sentence')
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error'),
    };
  }
}

export interface BuildSentenceModeStats {
  practiceMode: BuildSentencePracticeMode;
  avgTimeSeconds: number;
  avgScorePercent: number;
  count: number;
}

/**
 * Get average time and score per practice mode for the current user
 */
export async function getBuildSentenceModeStats(): Promise<{
  data: BuildSentenceModeStats[] | null;
  error: Error | null;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('user_exercise_history')
      .select('practice_mode, time_spent_seconds, score_percent')
      .eq('user_id', user.id)
      .eq('exercise_type', 'build-sentence')
      .not('practice_mode', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(200);

    if (error) throw error;
    if (!data?.length) return { data: [], error: null };

    const byMode: Record<string, { times: number[]; scores: number[] }> = {};
    data.forEach((row: { practice_mode: string; time_spent_seconds: number | null; score_percent: number | null }) => {
      const mode = row.practice_mode || 'timed';
      if (!byMode[mode]) byMode[mode] = { times: [], scores: [] };
      if (typeof row.time_spent_seconds === 'number') byMode[mode].times.push(row.time_spent_seconds);
      if (typeof row.score_percent === 'number') byMode[mode].scores.push(row.score_percent);
    });

    const result: BuildSentenceModeStats[] = (['untimed', 'timed', 'test'] as const).map((practiceMode) => {
      const arr = byMode[practiceMode];
      const count = arr ? arr.times.length : 0;
      const avgTimeSeconds = count && arr?.times.length ? arr.times.reduce((a, b) => a + b, 0) / arr.times.length : 0;
      const avgScorePercent = count && arr?.scores.length ? arr.scores.reduce((a, b) => a + b, 0) / arr.scores.length : 0;
      return { practiceMode, avgTimeSeconds, avgScorePercent, count };
    });
    return { data: result, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error'),
    };
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


