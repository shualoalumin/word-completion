import React from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { Timer, DarkModeToggle, ScoreCard } from '@/components/common';
import { UseTimerReturn } from '@/core/hooks';
import { cn } from '@/lib/utils';

export interface ExerciseLayoutProps {
  // Required
  children: React.ReactNode;
  timer: UseTimerReturn;
  darkMode: boolean;
  onDarkModeToggle: () => void;
  
  // Header
  title: string;
  subtitle?: string;
  
  // Actions
  showResults: boolean;
  onCheckAnswers: () => void;
  onNextExercise: () => void;
  
  // Results (optional, for when showResults is true)
  score?: number;
  totalQuestions?: number;
  
  // Optional render props for custom sections
  renderResults?: () => React.ReactNode;
  
  className?: string;
}

export const ExerciseLayout: React.FC<ExerciseLayoutProps> = ({
  children,
  timer,
  darkMode,
  onDarkModeToggle,
  title,
  subtitle,
  showResults,
  onCheckAnswers,
  onNextExercise,
  score = 0,
  totalQuestions = 10,
  renderResults,
  className,
}) => {
  return (
    <div
      className={cn(
        'min-h-screen transition-colors duration-300',
        darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
        className
      )}
    >
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Top bar */}
        <div className="flex justify-between items-center mb-6">
          <Timer
            remaining={timer.remaining}
            overtime={timer.overtime}
            isOvertime={timer.isOvertime}
            darkMode={darkMode}
          />
          <DarkModeToggle darkMode={darkMode} onToggle={onDarkModeToggle} />
        </div>

        {/* Header */}
        <div className="mb-6">
          <h1
            className={cn(
              'text-xl font-bold mb-1',
              darkMode ? 'text-gray-100' : 'text-gray-900'
            )}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className={cn(
                'text-lg font-bold',
                darkMode ? 'text-gray-100' : 'text-gray-900'
              )}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Main content */}
        {children}

        {/* Actions */}
        <div className="mt-10 flex items-center gap-4">
          {!showResults ? (
            <button
              onClick={onCheckAnswers}
              className={cn(
                'px-5 py-2 text-sm font-semibold transition-colors rounded flex items-center gap-2',
                darkMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-800 text-white hover:bg-gray-900'
              )}
            >
              <Check className="w-4 h-4" /> Check Answers
            </button>
          ) : (
            <button
              onClick={onNextExercise}
              className={cn(
                'px-5 py-2 text-sm font-semibold transition-colors rounded flex items-center gap-2',
                darkMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-800 text-white hover:bg-gray-900'
              )}
            >
              <RotateCcw className="w-4 h-4" /> Next Passage
            </button>
          )}
        </div>

        {/* Results section */}
        {showResults && (
          <div className="mt-8 space-y-6">
            <ScoreCard
              score={score}
              total={totalQuestions}
              duration={timer.totalElapsed}
              isOvertime={timer.isOvertime}
              darkMode={darkMode}
            />

            {/* Custom results section */}
            {renderResults?.()}
          </div>
        )}
      </div>
    </div>
  );
};



