import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useDarkMode } from '@/core/hooks';
import { cn } from '@/lib/utils';

export default function BuildSentence() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();

  return (
    <div className="min-h-screen">
      {/* Demo banner for non-authenticated users */}
      {!isAuthenticated && (
        <div className="bg-gradient-to-r from-blue-600/20 to-emerald-600/20 border-b border-zinc-800">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
            <p className="text-sm text-zinc-300">
              ?렜 <span className="font-medium">Demo Mode</span> ??{t('auth.signIn')} to save your progress
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

      {/* Coming Soon Content */}
      <div className="max-w-4xl mx-auto px-6 py-24">
        <div className="text-center">
          <div className="w-24 h-24 bg-emerald-600/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </div>

          <h1 className={cn(
            "text-4xl font-bold mb-4",
            darkMode ? "text-white" : "text-gray-900"
          )}>
            {t('practiceSelection.buildSentence', 'Build a Sentence')}
          </h1>

          <p className={cn(
            "text-xl mb-8",
            darkMode ? "text-zinc-400" : "text-gray-600"
          )}>
            {t('practiceSelection.comingSoon', 'Coming Soon')}
          </p>

          <p className={cn(
            "text-lg mb-12 max-w-2xl mx-auto",
            darkMode ? "text-zinc-500" : "text-gray-500"
          )}>
            {t('practiceSelection.buildSentenceDesc', 'Arrange scrambled words to form grammatically correct sentences. Practice word order and syntax patterns.')}
          </p>

          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate('/practice')}
            >
              {t('common.back', 'Back')}
            </Button>
            <Button
              onClick={() => navigate('/practice/text-completion')}
            >
              {t('practiceSelection.tryTextCompletion', 'Try Text Completion Instead')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
