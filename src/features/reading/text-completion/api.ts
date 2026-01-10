import { supabase } from '@/integrations/supabase/client';
import { TextCompletionPassage } from './types';
import { API_CONFIG } from '@/core/constants';

export interface GeneratePassageResult {
  data: TextCompletionPassage | null;
  error: Error | null;
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







