import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generatePassage } from './api';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(),
  },
}));

// Mock fetch globally
global.fetch = vi.fn();

describe('Text Completion API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Provide a mock URL for the test
    vi.stubEnv('VITE_SUPABASE_URL', 'https://mock-project.supabase.co');

    // Default mock for getSession
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);
  });

  it('should generate a passage with valid structure', async () => {
    const mockPassage = {
      topic: 'Science',
      content_parts: [
        { type: 'text', value: 'The ' },
        { type: 'blank', id: 1, prefix: 'qu', full_word: 'quick' },
      ],
      difficulty: 'intermediate',
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockPassage,
    } as Response);

    const result = await generatePassage();

    expect(result.data).toEqual(mockPassage);
    expect(result.error).toBeNull();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/functions/v1/generate-passage'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('should handle API errors gracefully', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    } as Response);

    const result = await generatePassage();

    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain('Internal Server Error');
    expect(result.data).toBeNull();
  });
});
