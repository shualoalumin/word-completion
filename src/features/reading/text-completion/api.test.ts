import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generatePassage } from './api';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
    auth: {
      getSession: vi.fn(),
    },
  },
}));

describe('Text Completion API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate a passage with valid structure', async () => {
    const mockResponse = {
      data: {
        content_parts: [
          { type: 'text', value: 'The ' },
          { type: 'blank', id: 1, prefix: 'The ', full_word: 'The quick' },
        ],
        topic: 'Science',
        difficulty: 'intermediate',
      },
      error: null,
    };

    vi.mocked(supabase.functions.invoke).mockResolvedValue(mockResponse);

    const result = await generatePassage();

    expect(result.data).toBeDefined();
    expect(result.data?.content_parts).toBeDefined();
    expect(result.data?.content_parts.length).toBeGreaterThan(0);
  });

  it('should handle API errors gracefully', async () => {
    const mockError = { message: 'API Error', status: 500 };
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: mockError,
    });

    const result = await generatePassage();

    expect(result.error).toBeDefined();
    expect(result.data).toBeNull();
  });
});
