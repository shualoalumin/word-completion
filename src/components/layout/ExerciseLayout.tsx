import React from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Timer } from '@/components/common';
import { UseTimerReturn } from '@/core/hooks';
import { Difficulty } from '@/core/types/exercise';
import { cn } from '@/lib/utils';

export interface ExerciseLayoutProps {
  children: React.ReactNode;
  timer: UseTimerReturn;
  darkMode: boolean;
  onDarkModeToggle: () => void;
  title: string;
  subtitle?: string;
  difficulty?: Difficulty;
  topicCategory?: string;
  showResults: boolean;
  onCheckAnswers: () => void;
  onNextExercise: () => void;
  score?: number;
  totalQuestions?: number;
  renderResults?: () => React.ReactNode;
  className?: string;
}

export const ExerciseLayout: React.FC<ExerciseLayoutProps> = ({
  children,
  timer,
  darkMode,
  title,
  subtitle,
  showResults,
  onCheckAnswers,
  onNextExercise,
  renderResults,
  className,
}) => {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        'min-h-screen transition-colors duration-300',
        darkMode ? 'bg-zinc-950 text-gray-100' : 'bg-gray-50 text-gray-900',
        className
      )}
    >


      {/* Main Content - ETS style max-width for readability */}
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Title & Subtitle */}
        {/* Title & Subtitle & Timer */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className={cn(
              'text-lg font-bold',
              darkMode ? 'text-gray-100' : 'text-gray-900'
            )}>
              {title}
            </h1>
            {subtitle && (
              <p className={cn(
                'text-sm',
                darkMode ? 'text-zinc-400' : 'text-gray-600'
              )}>
                {subtitle}
              </p>
            )}
          </div>
          <Timer
            remaining={timer.remaining}
            overtime={timer.overtime}
            isOvertime={timer.isOvertime}
            darkMode={darkMode}
            className="py-1 px-3 text-base"
          />
        </div>

        {/* Exercise Content - Responsive max-width for better readability on wide screens */}
        <div className={cn(
          'rounded-xl border p-4 sm:p-6',
          darkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-gray-200'
        )}>
          <div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto">

            {children}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4 flex items-center gap-4">
          {!showResults ? (
            <button
              onClick={onCheckAnswers}
              className={cn(
                'px-5 py-2.5 text-sm font-semibold transition-colors rounded-lg flex items-center gap-2',
                'bg-blue-600 text-white hover:bg-blue-700'
              )}
            >
              <Check className="w-4 h-4" /> {t('practice.checkAnswers')}
            </button>
          ) : (
            <button
              onClick={onNextExercise}
              className={cn(
                'px-5 py-2.5 text-sm font-semibold transition-colors rounded-lg flex items-center gap-2',
                'bg-blue-600 text-white hover:bg-blue-700'
              )}
            >
              <RotateCcw className="w-4 h-4" /> {t('practice.nextExercise')}
            </button>
          )}
        </div>

        {/* Results Section */}
        {showResults && (
          <div className="mt-6 space-y-4">
            {renderResults?.()}
          </div>
        )}
      </main>
    </div>
  );
};
