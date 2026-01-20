import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserSkills, getUserSkill } from './api';
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

describe('Skills API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch user skills', async () => {
    const mockSession = {
      data: {
        session: {
          user: { id: 'test-user' },
        },
      },
    };

    const mockSkills = [
      {
        skill_type: 'vocabulary',
        proficiency_score: '0.75',
        exercises_completed: 10,
        correct_rate: '75.00',
        last_updated_at: '2026-01-18T00:00:00Z',
      },
    ];

    vi.mocked(supabase.auth.getSession).mockResolvedValue(mockSession as any);
    
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockSkills,
        error: null,
      }),
    };

    vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

    const result = await getUserSkills();

    expect(result.data).toBeDefined();
    expect(result.data?.length).toBeGreaterThan(0);
  });

  it('should handle authentication errors', async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
    } as any);

    const result = await getUserSkills();

    expect(result.error).toBeDefined();
    expect(result.data).toBeNull();
  });
});
