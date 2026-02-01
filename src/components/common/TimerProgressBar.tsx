import { useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface TimerProgressBarProps {
  /** Current elapsed time in seconds */
  elapsed: number;
  /** Overtime in seconds (after totalDuration) */
  overtime: number;
  /** Total bar length in seconds (fixed, e.g. 2:30 = 150) */
  totalDuration: number;
  /** Target completion time by difficulty (e.g. 60/90/120) */
  targetTime: number;
  /** Whether timer is active */
  isActive: boolean;
  /** Dark mode styling */
  darkMode?: boolean;
  /** Optional className for container (use w-full to match passage card width) */
  className?: string;
}

export function TimerProgressBar({
  elapsed,
  overtime,
  totalDuration,
  targetTime,
  isActive,
  darkMode = false,
  className,
}: TimerProgressBarProps) {
  const warningSeconds = useMemo(
    () => Math.floor(targetTime * 0.67),
    [targetTime]
  );

  // Fill: 0–100% of totalDuration; cap at 100% so bar doesn't grow past 2:30 (overtime still counts)
  const fillPercent = useMemo(() => {
    if (totalDuration <= 0) return 0;
    return Math.min((elapsed / totalDuration) * 100, 100);
  }, [elapsed, totalDuration]);

  // Segment boundaries as % of total bar (0–100%)
  const greenEnd = totalDuration > 0 ? (warningSeconds / totalDuration) * 100 : 0;
  const yellowEnd = totalDuration > 0 ? (targetTime / totalDuration) * 100 : 0;
  // red: yellowEnd to 100%

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const trackBg = darkMode ? 'bg-zinc-800' : 'bg-slate-200';
  const fillColor = useMemo(() => {
    if (elapsed >= targetTime) return 'bg-red-500';
    if (elapsed >= warningSeconds) return 'bg-amber-500';
    return 'bg-emerald-500';
  }, [elapsed, targetTime, warningSeconds]);

  const textColor = useMemo(() => {
    if (elapsed >= targetTime) return darkMode ? 'text-red-400' : 'text-red-600';
    if (elapsed >= warningSeconds) return darkMode ? 'text-amber-400' : 'text-amber-600';
    return darkMode ? 'text-emerald-400' : 'text-emerald-600';
  }, [elapsed, targetTime, warningSeconds, darkMode]);

  return (
    <div className={cn('space-y-2 w-full', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className={cn('font-mono font-medium', textColor)}>
          {overtime > 0 ? (
            <>
              <span className="opacity-70">{formatTime(totalDuration)}</span>
              <span className="ml-1">+{formatTime(overtime)}</span>
            </>
          ) : (
            <>
              {formatTime(elapsed)} / {formatTime(totalDuration)}
            </>
          )}
        </span>
        <span className={cn('text-xs font-medium', darkMode ? 'text-zinc-500' : 'text-slate-500')}>
          Target: {formatTime(targetTime)}
        </span>
      </div>

      {/* Bar: total = totalDuration; background shows green / yellow / red segments */}
      <div className="relative h-2 rounded-full overflow-hidden">
        {/* Background segments (full width) */}
        <div className={cn('absolute inset-0 flex', trackBg)}>
          <div
            className="h-full bg-emerald-500/30"
            style={{ width: `${greenEnd}%` }}
          />
          <div
            className="h-full bg-amber-500/30"
            style={{ width: `${yellowEnd - greenEnd}%` }}
          />
          <div
            className="h-full flex-1 bg-red-500/30"
          />
        </div>
        {/* Filled portion (elapsed) */}
        <div
          className={cn(
            'absolute inset-y-0 left-0 h-full transition-all duration-300 ease-linear rounded-full',
            fillColor,
            !isActive && 'opacity-60'
          )}
          style={{ width: `${fillPercent}%` }}
        />
      </div>
    </div>
  );
}
