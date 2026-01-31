import { useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface TimerProgressBarProps {
  /** Current elapsed time in seconds */
  elapsed: number;
  /** Target completion time in seconds */
  targetTime: number;
  /** Whether timer is active */
  isActive: boolean;
  /** Whether in overtime (exceeded target) */
  isOvertime: boolean;
  /** Dark mode styling */
  darkMode?: boolean;
  /** Optional className for container */
  className?: string;
}

export function TimerProgressBar({
  elapsed,
  targetTime,
  isActive,
  isOvertime,
  darkMode = false,
  className,
}: TimerProgressBarProps) {
  // Calculate progress percentage (0-100+)
  const progressPercent = useMemo(() => {
    if (targetTime === 0) return 0;
    return Math.min((elapsed / targetTime) * 100, 100);
  }, [elapsed, targetTime]);

  // Determine color zone
  const colorZone = useMemo(() => {
    if (isOvertime || progressPercent >= 100) return 'red';
    if (progressPercent >= 67) return 'yellow';
    return 'green';
  }, [isOvertime, progressPercent]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get color classes based on zone
  const getBarColor = () => {
    if (darkMode) {
      switch (colorZone) {
        case 'green':
          return 'bg-emerald-500';
        case 'yellow':
          return 'bg-amber-500';
        case 'red':
          return 'bg-red-500';
      }
    } else {
      switch (colorZone) {
        case 'green':
          return 'bg-emerald-500';
        case 'yellow':
          return 'bg-amber-500';
        case 'red':
          return 'bg-red-500';
      }
    }
  };

  const getTextColor = () => {
    if (darkMode) {
      switch (colorZone) {
        case 'green':
          return 'text-emerald-400';
        case 'yellow':
          return 'text-amber-400';
        case 'red':
          return 'text-red-400';
      }
    } else {
      switch (colorZone) {
        case 'green':
          return 'text-emerald-600';
        case 'yellow':
          return 'text-amber-600';
        case 'red':
          return 'text-red-600';
      }
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Time display */}
      <div className="flex items-center justify-between text-sm">
        <span className={cn('font-mono font-medium', getTextColor())}>
          {isOvertime ? (
            <>
              <span className="opacity-70">Overtime:</span> +{formatTime(elapsed - targetTime)}
            </>
          ) : (
            <>
              {formatTime(elapsed)} / {formatTime(targetTime)}
            </>
          )}
        </span>
        <span className={cn('text-xs font-medium', darkMode ? 'text-zinc-500' : 'text-slate-500')}>
          Target: {formatTime(targetTime)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative">
        {/* Background track */}
        <div
          className={cn(
            'h-2 rounded-full overflow-hidden',
            darkMode ? 'bg-zinc-800' : 'bg-slate-200'
          )}
        >
          {/* Filled portion */}
          <div
            className={cn(
              'h-full transition-all duration-300 ease-linear',
              getBarColor(),
              !isActive && 'opacity-60'
            )}
            style={{
              width: `${progressPercent}%`,
            }}
          />
        </div>

        {/* Zone markers (subtle lines at 67% and 100%) */}
        <div className="absolute top-0 left-[67%] w-px h-2 bg-white/30" />
        <div className="absolute top-0 right-0 w-px h-2 bg-white/40" />
      </div>

      {/* Zone labels (optional, very subtle) */}
      <div className="flex justify-between text-[10px] opacity-50">
        <span className={darkMode ? 'text-zinc-600' : 'text-slate-400'}>Safe</span>
        <span className={darkMode ? 'text-zinc-600' : 'text-slate-400'}>Warning</span>
        <span className={darkMode ? 'text-zinc-600' : 'text-slate-400'}>Overtime</span>
      </div>
    </div>
  );
}
