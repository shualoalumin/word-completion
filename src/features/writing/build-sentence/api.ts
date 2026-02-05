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
