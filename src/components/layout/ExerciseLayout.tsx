import React from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Timer } from '@/components/common';
import { TimerProgressBar } from '@/components/common/TimerProgressBar';
import { UseTimerReturn } from '@/core/hooks';
import { UseTimerWithWarningsReturn } from '@/core/hooks/useTimerWithWarnings';
import { Difficulty } from '@/core/types/exercise';
import { cn } from '@/lib/utils';

export interface ExerciseLayoutProps {
  children: React.ReactNode;
  timer: UseTimerReturn | UseTimerWithWarningsReturn;
  darkMode: boolean;
  onDarkModeToggle: () => void;
  title: string;
  subtitle?: React.ReactNode;
  difficulty?: Difficulty;
  topicCategory?: string;
  showResults: boolean;
  onCheckAnswers: () => void;
  onNextExercise: () => void;
  onRetry?: () => void;
  score?: number;
  totalQuestions?: number;
  renderResults?: () => React.ReactNode;
  /** Use progress bar timer instead of text timer */
  useProgressBar?: boolean;
  /** Total bar length in seconds (e.g. 150 for 2:30). Used with useProgressBar. */
  timerTotalDuration?: number;
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
  onRetry,
  renderResults,
  useProgressBar = false,
  timerTotalDuration = 150,
  className,
}) => {
  const { t } = useTranslation();

  const hasProgressBar = (t: UseTimerReturn | UseTimerWithWarningsReturn): t is UseTimerWithWarningsReturn => {
    return 'targetTime' in t && 'progressPercent' in t && 'colorZone' in t;
  };

  const passageCardInner = 'max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto';

  return (
    <div
      className={cn(
        'min-h-screen transition-colors duration-300',
        darkMode ? 'bg-zinc-950 text-gray-100' : 'bg-gray-50 text-gray-900',
        className
      )}
    >
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-4">
          <div className="flex items-start justify-between mb-3">
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
            {!useProgressBar && (
              <Timer
                remaining={timer.remaining}
                overtime={timer.overtime}
                isOvertime={timer.isOvertime}
                darkMode={darkMode}
                className="py-1 px-3 text-base"
              />
            )}
          </div>

          {/* Progress Bar Timer - same width as passage card below */}
          {useProgressBar && hasProgressBar(timer) && (
            <div className={cn('w-full', passageCardInner)}>
              <TimerProgressBar
                elapsed={timer.elapsed}
                overtime={timer.overtime}
                totalDuration={timerTotalDuration}
                targetTime={timer.targetTime}
                isActive={timer.isActive}
                darkMode={darkMode}
                className="w-full"
              />
            </div>
          )}
        </div>

        <div className={cn(
          'rounded-xl border p-4 sm:p-6',
          darkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-gray-200'
        )}>
          <div className={passageCardInner}>
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
            <div className="flex items-center gap-3">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className={cn(
                    'px-5 py-2.5 text-sm font-semibold transition-colors rounded-lg flex items-center gap-2',
                    darkMode
                      ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                  )}
                >
                  <RotateCcw className="w-4 h-4" /> {t('common.retry')}
                </button>
              )}
              <button
                onClick={onNextExercise}
                className={cn(
                  'px-5 py-2.5 text-sm font-semibold transition-colors rounded-lg flex items-center gap-2',
                  'bg-blue-600 text-white hover:bg-blue-700'
                )}
              >
                <RotateCcw className="w-4 h-4" /> {t('practice.nextExercise')}
              </button>
            </div>
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
