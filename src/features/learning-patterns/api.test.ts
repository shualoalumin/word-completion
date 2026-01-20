import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getLearningPatterns } from './api';
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

describe('Learning Patterns API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch learning patterns', async () => {
    const mockSession = {
      data: {
        session: {
          user: { id: 'test-user' },
        },
      },
    };

    const mockPatterns = [
      {
        hour_of_day: 14,
        day_of_week: 1,
        avg_score_percent: '85.00',
        avg_time_spent_seconds: 180,
        exercises_count: 5,
        last_updated_at: '2026-01-18T00:00:00Z',
      },
    ];

    vi.mocked(supabase.auth.getSession).mockResolvedValue(mockSession as any);
    
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockPatterns,
        error: null,
      }),
    };

    vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

    const result = await getLearningPatterns();

    expect(result.data).toBeDefined();
    expect(result.data?.length).toBeGreaterThan(0);
  });
});
