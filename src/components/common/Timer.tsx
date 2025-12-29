import React from 'react';
import { formatTime } from '@/core/utils';
import { cn } from '@/lib/utils';

export interface TimerProps {
  remaining: number;
  overtime: number;
  isOvertime: boolean;
  darkMode?: boolean;
  className?: string;
}

export const Timer: React.FC<TimerProps> = ({
  remaining,
  overtime,
  isOvertime,
  darkMode = false,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg',
        isOvertime
          ? darkMode
            ? 'bg-red-900/40 text-red-400'
            : 'bg-red-100 text-red-700'
          : darkMode
            ? 'bg-gray-800 text-gray-200'
            : 'bg-gray-100 text-gray-800',
        className
      )}
    >
      <span className="text-sm font-sans mr-2">
        {isOvertime ? 'Overtime:' : 'Timer:'}
      </span>
      <span className={cn('font-bold', isOvertime && 'text-red-500')}>
        {isOvertime ? `+${formatTime(overtime)}` : formatTime(remaining)}
      </span>
    </div>
  );
};



