import React from 'react';
import { TextCompletionBlank } from '../types';
import { cn } from '@/lib/utils';

export interface ResultsPanelProps {
  blanks: TextCompletionBlank[];
  userAnswers: Record<number, string>;
  darkMode: boolean;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  blanks,
  userAnswers,
  darkMode,
}) => {
  return (
    <div className={cn('border-t pt-6', darkMode ? 'border-gray-700' : 'border-gray-200')}>
      <h2 className={cn('text-lg font-bold mb-4', darkMode ? 'text-gray-100' : 'text-gray-900')}>
        Answers & Explanations
      </h2>
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
                    ? 'bg-green-900/30 border-green-700'
                    : 'bg-green-50 border-green-200'
                  : darkMode
                    ? 'bg-red-900/30 border-red-700'
                    : 'bg-red-50 border-red-200'
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    'text-xs font-bold px-2 py-0.5 rounded',
                    isCorrect
                      ? darkMode
                        ? 'bg-green-800 text-green-200'
                        : 'bg-green-200 text-green-800'
                      : darkMode
                        ? 'bg-red-800 text-red-200'
                        : 'bg-red-200 text-red-800'
                  )}
                >
                  {blank.id}
                </span>
                <div className="flex-1">
                  <p className={cn('font-semibold', darkMode ? 'text-gray-100' : 'text-gray-900')}>
                    {blank.prefix}
                    <span className={isCorrect ? 'text-green-500' : 'text-red-500'}>
                      {correctSuffix}
                    </span>
                    <span className={cn('font-normal ml-2', darkMode ? 'text-gray-400' : 'text-gray-600')}>
                      — {blank.clue || 'Common word used in academic contexts.'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};





