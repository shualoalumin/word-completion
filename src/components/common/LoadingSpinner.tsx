import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LoadingSpinnerProps {
  message?: string;
  darkMode?: boolean;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  darkMode = false,
  className,
}) => {
  return (
    <div
      className={cn(
        'min-h-screen flex flex-col items-center justify-center',
        darkMode ? 'bg-gray-900' : 'bg-white',
        className
      )}
    >
      <Loader2
        className={cn(
          'w-10 h-10 animate-spin mb-3',
          darkMode ? 'text-gray-400' : 'text-gray-600'
        )}
      />
      <p className={cn('text-sm', darkMode ? 'text-gray-400' : 'text-gray-500')}>
        {message}
      </p>
    </div>
  );
};





