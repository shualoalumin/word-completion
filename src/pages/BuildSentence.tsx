import { Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ErrorBoundary, LoadingSpinner } from '@/components/common';

const BuildSentenceExercise = lazy(() => import('@/features/writing/build-sentence'));

export default function BuildSentence() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="">
      {/* Demo banner for non-authenticated users */}
      {!isAuthenticated && (
        <div className="bg-gradient-to-r from-blue-600/20 to-emerald-600/20 border-b border-zinc-800">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
            <p className="text-sm text-zinc-300">
              <span className="font-medium">Demo Mode</span> — {t('auth.signIn')} to save your progress
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

      {/* Exercise component - lazy loaded */}
      <ErrorBoundary>
        <Suspense fallback={<div className="flex justify-center p-12"><LoadingSpinner /></div>}>
          <BuildSentenceExercise />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
