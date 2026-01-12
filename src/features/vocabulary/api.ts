import { supabase } from '@/integrations/supabase/client';

export interface VocabularyWord {
  id: string;
  word: string;
  definition: string | null;
  example_sentence: string | null;
  source_context: string | null;
  source_passage_id: string | null;
  added_from: 'manual' | 'auto_extract' | 'mistake_priority';
  mastery_level: number;
  review_count: number;
  last_reviewed_at: string | null;
  next_review_at: string | null;
  retention_score: number | null;
  difficulty_score: number | null;
  first_encountered_at: string | null;
  created_at: string;
}

export interface VocabularyStats {
  totalWords: number;
  masteredWords: number; // mastery_level >= 4
  learningWords: number; // mastery_level 1-3
  newWords: number; // mastery_level 0
  wordsDueForReview: number; // next_review_at <= now
}

/**
 * Get user's vocabulary list with optional filters
 */
export async function getVocabularyList(params?: {
  masteryLevel?: number;
  searchQuery?: string;
  sortBy?: 'word' | 'created_at' | 'mastery_level' | 'next_review_at';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}): Promise<{ data: VocabularyWord[] | null; error: Error | null }> {
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

    let query = supabase
      .from('user_vocabulary')
      .select('*')
      .eq('user_id', session.user.id);

    // Apply filters
    if (params?.masteryLevel !== undefined) {
      query = query.eq('mastery_level', params.masteryLevel);
    }

    if (params?.searchQuery) {
      query = query.ilike('word', `%${params.searchQuery}%`);
    }

    // Apply sorting
    const sortBy = params?.sortBy || 'created_at';
    const sortOrder = params?.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    if (params?.limit) {
      query = query.limit(params.limit);
    }
    if (params?.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      data: data as VocabularyWord[],
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
 * Get vocabulary statistics
 */
export async function getVocabularyStats(): Promise<{
  data: VocabularyStats | null;
  error: Error | null;
}> {
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

    // Get all words for the user
    const { data: words, error } = await supabase
      .from('user_vocabulary')
      .select('mastery_level, next_review_at')
      .eq('user_id', session.user.id);

    if (error) throw error;

    const now = new Date().toISOString();

    const stats: VocabularyStats = {
      totalWords: words?.length || 0,
      masteredWords: words?.filter((w) => (w.mastery_level || 0) >= 4).length || 0,
      learningWords: words?.filter((w) => {
        const level = w.mastery_level || 0;
        return level >= 1 && level < 4;
      }).length || 0,
      newWords: words?.filter((w) => (w.mastery_level || 0) === 0).length || 0,
      wordsDueForReview: words?.filter((w) => {
        if (!w.next_review_at) return false;
        return new Date(w.next_review_at) <= new Date(now);
      }).length || 0,
    };

    return {
      data: stats,
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
 * Delete a word from vocabulary
 */
export async function deleteVocabularyWord(wordId: string): Promise<{
  success: boolean;
  error: Error | null;
}> {
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
      .from('user_vocabulary')
      .delete()
      .eq('id', wordId)
      .eq('user_id', session.user.id);

    if (error) throw error;

    return {
      success: true,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error('Unknown error'),
    };
  }
}
