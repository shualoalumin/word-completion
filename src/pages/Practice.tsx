import { Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useDarkMode } from '@/core/hooks';
import { Button } from '@/components/ui/button';
import { ErrorBoundary, LoadingSpinner } from '@/components/common';
import { cn } from '@/lib/utils';

const TextCompletionExercise = lazy(() => import('@/features/reading/text-completion'));

export default function Practice() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();

  return (
    <div className={cn('min-h-screen', darkMode ? 'bg-zinc-950' : 'bg-gray-50')}>
      {/* Demo banner for non-authenticated users - at the top */}
      {!isAuthenticated && (
        <div className="bg-gradient-to-r from-blue-600/20 to-emerald-600/20 border-b border-zinc-800">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
            <p className="text-sm text-zinc-300">
              🎮 <span className="font-medium">Demo Mode</span> — {t('auth.signIn')} to save your progress
            </p>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate('/')}
            >
              {t('auth.signIn')}
            </Button>
          </div>
        </div>
      )}

      {/* Exercise component - lazy so text-completion chunk loads in isolation (avoids TDZ in prod) */}
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner darkMode={darkMode} />}>
          <TextCompletionExercise />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

