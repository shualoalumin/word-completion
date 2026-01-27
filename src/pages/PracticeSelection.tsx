import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useDarkMode } from '@/core/hooks';
import { cn } from '@/lib/utils';

export default function PracticeSelection() {
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

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-12 text-center">
          <h1 className={cn(
            "text-4xl font-bold mb-4",
            darkMode ? "text-white" : "text-gray-900"
          )}>
            {t('practiceSelection.title', 'Choose Your Practice')}
          </h1>
          <p className={cn(
            "text-lg",
            darkMode ? "text-zinc-400" : "text-gray-600"
          )}>
            {t('practiceSelection.subtitle', 'Select an exercise type to begin')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Text Completion */}
          <div
            className="group relative p-8 bg-zinc-900/60 border border-zinc-800 rounded-2xl hover:border-blue-600/50 transition-all cursor-pointer overflow-hidden"
            onClick={() => navigate('/practice/text-completion')}
          >
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative">
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <span className="px-3 py-1 bg-blue-600/20 text-blue-400 text-xs font-medium rounded-full">
                  {t('dashboard.readingSection', 'Reading Section')}
                </span>
              </div>

              <h3 className="text-2xl font-semibold mb-3 group-hover:text-blue-400 transition-colors">
                {t('dashboard.completeTheWords', 'Complete the Words')}
              </h3>
              <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                {t('dashboard.fillMissingLetters', 'Fill in the missing letters to complete words in academic passages.')}
                {' '}
                {t('dashboard.aiAdaptsDifficulty', 'AI adapts difficulty based on your performance.')}
              </p>

              <div className="flex items-center gap-4 text-sm text-zinc-500">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  3 {t('dashboard.minutes', 'min')}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  10 {t('dashboard.blanks', 'blanks')}
                </span>
              </div>
            </div>
          </div>

          {/* Build a Sentence */}
          <div
            className="group relative p-8 bg-zinc-900/60 border border-zinc-800 rounded-2xl hover:border-emerald-600/50 transition-all cursor-pointer overflow-hidden"
            onClick={() => navigate('/practice/build-sentence')}
          >
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative">
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 bg-emerald-600/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                </div>
                <span className="px-3 py-1 bg-emerald-600/20 text-emerald-400 text-xs font-medium rounded-full">
                  {t('dashboard.readingSection', 'Reading Section')}
                </span>
              </div>

              <h3 className="text-2xl font-semibold mb-3 group-hover:text-emerald-400 transition-colors">
                {t('practiceSelection.buildSentence', 'Build a Sentence')}
              </h3>
              <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                {t('practiceSelection.buildSentenceDesc', 'Arrange scrambled words to form grammatically correct sentences. Practice word order and syntax patterns.')}
              </p>

              <div className="flex items-center gap-4 text-sm text-zinc-500">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  2 {t('dashboard.minutes', 'min')}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  5 {t('practiceSelection.sentences', 'sentences')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
