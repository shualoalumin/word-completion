import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './Dashboard';
import { BrowserRouter } from 'react-router-dom';

// Mock auth hook
vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    isAuthenticated: true,
    loading: false,
    signOut: vi.fn(),
  }),
}));

// Mock dashboard hooks
vi.mock('@/features/dashboard', () => ({
  useDashboardStats: () => ({
    data: {
      exercisesToday: 5,
      dayStreak: 3,
      averageScore: 85,
      totalExercises: 20,
    },
    isLoading: false,
    error: null,
  }),
  useRecentActivity: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

describe('Dashboard', () => {
  it('should render dashboard title', () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      </QueryClientProvider>
    );

    // Check if dashboard elements are rendered
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it('should display statistics', () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      </QueryClientProvider>
    );

    // Check if stats are displayed
    expect(screen.getByText(/5/)).toBeInTheDocument(); // exercisesToday
  });
});
