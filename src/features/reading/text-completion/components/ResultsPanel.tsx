import React from 'react';
import { TextCompletionBlank } from '../types';
import { cn } from '@/lib/utils';

export interface ResultsPanelProps {
  blanks: TextCompletionBlank[];
  userAnswers: Record<number, string>;
  darkMode: boolean;
  topic?: string;
  elapsedTime?: number; // in seconds
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  blanks,
  userAnswers,
  darkMode,
  topic,
  elapsedTime,
}) => {
  // Calculate score
  const correctCount = blanks.filter((blank) => {
    const userSuffix = userAnswers[blank.id] || '';
    const correctSuffix = blank.full_word.slice(blank.prefix.length);
    return userSuffix.toLowerCase() === correctSuffix.toLowerCase();
  }).length;

  const totalCount = blanks.length;
  const percentage = Math.round((correctCount / totalCount) * 100);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get performance message
  const getPerformanceMessage = () => {
    if (percentage >= 90) return { text: "Excellent! 🎉", color: "text-emerald-400" };
    if (percentage >= 70) return { text: "Good job! 👍", color: "text-blue-400" };
    if (percentage >= 50) return { text: "Keep practicing! 💪", color: "text-amber-400" };
    return { text: "Don't give up! 📚", color: "text-red-400" };
  };

  const performance = getPerformanceMessage();

  // Circular progress component
  const CircularProgress = ({ value, size = 120 }: { value: number; size?: number }) => {
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={darkMode ? '#27272a' : '#e5e7eb'}
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={value >= 70 ? '#10b981' : value >= 50 ? '#f59e0b' : '#ef4444'}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-3xl font-bold", darkMode ? "text-white" : "text-gray-900")}>
            {value}%
          </span>
          <span className={cn("text-xs", darkMode ? "text-zinc-400" : "text-gray-500")}>
            {correctCount}/{totalCount}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Score Summary Card */}
      <div className={cn(
        "p-6 rounded-2xl border",
        darkMode ? "bg-zinc-900/50 border-zinc-800" : "bg-gray-50 border-gray-200"
      )}>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Circular Progress */}
          <CircularProgress value={percentage} />

          {/* Stats */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className={cn("text-2xl font-bold mb-1", performance.color)}>
              {performance.text}
            </h2>
            <p className={cn("text-sm mb-4", darkMode ? "text-zinc-400" : "text-gray-600")}>
              You got {correctCount} out of {totalCount} correct
            </p>

            <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
              {/* Time */}
              {elapsedTime !== undefined && (
                <div className={cn(
                  "px-4 py-2 rounded-lg",
                  darkMode ? "bg-zinc-800" : "bg-gray-100"
                )}>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className={cn("text-sm font-medium", darkMode ? "text-white" : "text-gray-900")}>
                      {formatTime(elapsedTime)}
                    </span>
                  </div>
                  <p className={cn("text-xs mt-1", darkMode ? "text-zinc-500" : "text-gray-500")}>
                    Time Taken
                  </p>
                </div>
              )}

              {/* Topic */}
              {topic && (
                <div className={cn(
                  "px-4 py-2 rounded-lg",
                  darkMode ? "bg-zinc-800" : "bg-gray-100"
                )}>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className={cn("text-sm font-medium", darkMode ? "text-white" : "text-gray-900")}>
                      {topic}
                    </span>
                  </div>
                  <p className={cn("text-xs mt-1", darkMode ? "text-zinc-500" : "text-gray-500")}>
                    Topic
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Answers */}
      <div className={cn('border-t pt-6', darkMode ? 'border-zinc-800' : 'border-gray-200')}>
        <h3 className={cn('text-lg font-bold mb-4', darkMode ? 'text-gray-100' : 'text-gray-900')}>
          Answers & Explanations
        </h3>
        <div className="grid gap-3">
          {blanks.map((blank) => {
            const userSuffix = userAnswers[blank.id] || '';
            const correctSuffix = blank.full_word.slice(blank.prefix.length);
            const isCorrect = userSuffix.toLowerCase() === correctSuffix.toLowerCase();

            return (
              <div
                key={blank.id}
                className={cn(
                  'p-3 rounded-lg border',
                  isCorrect
                    ? darkMode
                      ? 'bg-emerald-900/20 border-emerald-800'
                      : 'bg-green-50 border-green-200'
                    : darkMode
                      ? 'bg-red-900/20 border-red-800'
                      : 'bg-red-50 border-red-200'
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1',
                      isCorrect
                        ? darkMode
                          ? 'bg-emerald-800 text-emerald-200'
                          : 'bg-green-200 text-green-800'
                        : darkMode
                          ? 'bg-red-800 text-red-200'
                          : 'bg-red-200 text-red-800'
                    )}
                  >
                    {isCorrect ? '✓' : '✗'} {blank.id}
                  </span>
                  <div className="flex-1">
                    <p className={cn('font-semibold', darkMode ? 'text-gray-100' : 'text-gray-900')}>
                      {blank.prefix}
                      <span className={isCorrect ? 'text-emerald-400' : 'text-red-400'}>
                        {correctSuffix}
                      </span>
                      {!isCorrect && userSuffix && (
                        <span className="text-red-400 line-through ml-2 opacity-60">
                          {blank.prefix}{userSuffix}
                        </span>
                      )}
                    </p>
                    <p className={cn('text-sm mt-1', darkMode ? 'text-zinc-400' : 'text-gray-600')}>
                      {blank.clue || 'Common word used in academic contexts.'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};







