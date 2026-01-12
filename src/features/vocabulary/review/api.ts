import { supabase } from '@/integrations/supabase/client';

export type ReviewType = 'flashcard' | 'fill_blank' | 'multiple_choice' | 'context_matching' | 'sentence_completion';

export interface ReviewWord {
  id: string;
  word: string;
  definition: string | null;
  example_sentence: string | null;
  source_context: string | null;
  mastery_level: number;
  next_review_at: string | null;
}

export interface ReviewResult {
  vocabularyId: string;
  reviewType: ReviewType;
  isCorrect: boolean;
  responseTimeSeconds: number;
  confidenceLevel?: number;
  userAnswer?: string;
  correctAnswer?: string;
}

/**
 * Get words due for review
 */
export async function getWordsForReview(limit: number = 10): Promise<{
  data: ReviewWord[] | null;
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

    const now = new Date().toISOString();

    // Get words that are due for review (next_review_at <= now) or have never been reviewed
    const { data, error } = await supabase
      .from('user_vocabulary')
      .select('id, word, definition, example_sentence, source_context, mastery_level, next_review_at')
      .eq('user_id', session.user.id)
      .or(`next_review_at.is.null,next_review_at.lte.${now}`)
      .order('next_review_at', { ascending: true, nullsFirst: true })
      .limit(limit);

    if (error) throw error;

    return {
      data: data as ReviewWord[],
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
 * Submit review result and update vocabulary word
 * This will update the SM-2 algorithm parameters
 */
export async function submitReviewResult(result: ReviewResult): Promise<{
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

    // Get current word state
    const { data: word, error: wordError } = await supabase
      .from('user_vocabulary')
      .select('mastery_level, review_count, retention_score, next_review_at')
      .eq('id', result.vocabularyId)
      .eq('user_id', session.user.id)
      .single();

    if (wordError || !word) {
      return {
        success: false,
        error: new Error('Word not found'),
      };
    }

    // Simple SM-2 algorithm implementation
    const currentLevel = word.mastery_level || 0;
    const reviewCount = word.review_count || 0;
    
    let newLevel = currentLevel;
    let newRetentionScore = word.retention_score || 0.5;
    let nextReviewDays = 1;

    if (result.isCorrect) {
      // Correct answer: increase mastery
      newLevel = Math.min(currentLevel + 1, 5);
      newRetentionScore = Math.min((newRetentionScore || 0.5) + 0.1, 1.0);
      
      // Calculate next review interval (simple exponential backoff)
      if (newLevel >= 4) {
        nextReviewDays = 30; // Mastered: review monthly
      } else if (newLevel >= 2) {
        nextReviewDays = 7; // Learning: review weekly
      } else {
        nextReviewDays = 1; // New: review daily
      }
    } else {
      // Wrong answer: decrease mastery (but not below 0)
      newLevel = Math.max(currentLevel - 1, 0);
      newRetentionScore = Math.max((newRetentionScore || 0.5) - 0.2, 0.0);
      nextReviewDays = 1; // Review again tomorrow
    }

    // Calculate next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + nextReviewDays);

    // Update vocabulary word
    const { error: updateError } = await supabase
      .from('user_vocabulary')
      .update({
        mastery_level: newLevel,
        review_count: reviewCount + 1,
        retention_score: newRetentionScore,
        last_reviewed_at: new Date().toISOString(),
        next_review_at: nextReviewDate.toISOString(),
      })
      .eq('id', result.vocabularyId)
      .eq('user_id', session.user.id);

    if (updateError) throw updateError;

    // Save review record
    const { error: reviewError } = await supabase
      .from('user_vocabulary_reviews')
      .insert({
        user_id: session.user.id,
        vocabulary_id: result.vocabularyId,
        review_type: result.reviewType,
        is_correct: result.isCorrect,
        response_time_seconds: result.responseTimeSeconds,
        confidence_level: result.confidenceLevel,
        user_answer: result.userAnswer,
        correct_answer: result.correctAnswer,
        mastery_level_before: currentLevel,
        mastery_level_after: newLevel,
      });

    if (reviewError) throw reviewError;

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
