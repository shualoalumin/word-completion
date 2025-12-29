import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DarkModeToggleProps {
  darkMode: boolean;
  onToggle: () => void;
  className?: string;
}

export const DarkModeToggle: React.FC<DarkModeToggleProps> = ({
  darkMode,
  onToggle,
  className,
}) => {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'p-2 rounded-lg transition-colors',
        darkMode
          ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400'
          : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
        className
      )}
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
};



