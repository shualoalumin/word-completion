import React from 'react';
import { formatTime } from '@/core/utils';
import { cn } from '@/lib/utils';

export interface ScoreCardProps {
  score: number;
  total: number;
  duration: number;
  isOvertime: boolean;
  darkMode?: boolean;
  className?: string;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  score,
  total,
  duration,
  isOvertime,
  darkMode = false,
  className,
}) => {
  return (
    <div className={cn('flex gap-4 flex-wrap', className)}>
      {/* Score */}
      <div
        className={cn(
          'p-4 rounded-lg inline-block',
          darkMode
            ? 'bg-gray-800 border border-gray-700'
            : 'bg-gray-50 border border-gray-200'
        )}
      >
        <p className={darkMode ? 'text-gray-200' : 'text-gray-800'}>
          Score:{' '}
          <span
            className={cn('font-bold', darkMode ? 'text-gray-100' : 'text-gray-900')}
          >
            {score}
          </span>{' '}
          / {total}
        </p>
      </div>

      {/* Duration */}
      <div
        className={cn(
          'p-4 rounded-lg inline-block',
          darkMode
            ? 'bg-gray-800 border border-gray-700'
            : 'bg-gray-50 border border-gray-200'
        )}
      >
        <p className={darkMode ? 'text-gray-200' : 'text-gray-800'}>
          Duration:{' '}
          <span
            className={cn(
              'font-bold',
              isOvertime
                ? 'text-red-500'
                : darkMode
                  ? 'text-gray-100'
                  : 'text-gray-900'
            )}
          >
            {formatTime(duration)}
          </span>
        </p>
      </div>
    </div>
  );
};



