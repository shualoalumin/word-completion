import React from 'react';
import { BuildSentenceQuestionResult } from '../types';
import { cn } from '@/lib/utils';

interface QuestionIndicatorProps {
  current: number; // 0-indexed
  total: number;
  results: BuildSentenceQuestionResult[];
  darkMode: boolean;
}

export const QuestionIndicator: React.FC<QuestionIndicatorProps> = ({
  current,
  total,
  results,
  darkMode,
}) => {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => {
        const result = results.find((r) => r.questionIndex === i);
        const isCurrent = i === current;

        return (
          <div
            key={i}
            className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all',
              // Current question
              isCurrent && !result && (darkMode
                ? 'bg-blue-500 text-white ring-2 ring-blue-500/30'
                : 'bg-blue-500 text-white ring-2 ring-blue-300'),
              // Completed — correct
              result?.isCorrect && (darkMode
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-emerald-100 text-emerald-600'),
              // Completed — incorrect
              result && !result.isCorrect && (darkMode
                ? 'bg-red-500/20 text-red-400'
                : 'bg-red-100 text-red-600'),
              // Pending (not current, no result)
              !isCurrent && !result && (darkMode
                ? 'bg-zinc-800 text-zinc-500'
                : 'bg-gray-200 text-gray-400'),
            )}
          >
            {result ? (result.isCorrect ? '✓' : '✗') : i + 1}
          </div>
        );
      })}
    </div>
  );
};
