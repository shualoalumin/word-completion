/**
 * Learning Heatmap Component
 * GitHub 스타일 시간대별 학습 히트맵
 */

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { LearningPattern } from '@/features/learning-patterns/api';

interface LearningHeatmapProps {
  patterns: LearningPattern[];
  darkMode?: boolean;
  className?: string;
}

export const LearningHeatmap: React.FC<LearningHeatmapProps> = ({
  patterns,
  darkMode = true,
  className,
}) => {
  // Create a map for quick lookup
  const patternMap = useMemo(() => {
    const map = new Map<string, LearningPattern>();
    patterns.forEach((pattern) => {
      const key = `${pattern.day_of_week}-${pattern.hour_of_day}`;
      map.set(key, pattern);
    });
    return map;
  }, [patterns]);

  // Get intensity level (0-4) based on exercises_count
  const getIntensity = (count: number): number => {
    if (count === 0) return 0;
    if (count <= 2) return 1;
    if (count <= 5) return 2;
    if (count <= 10) return 3;
    return 4;
  };

  // Get color based on intensity
  const getColor = (intensity: number): string => {
    if (darkMode) {
      switch (intensity) {
        case 0: return 'bg-zinc-800';
        case 1: return 'bg-emerald-900/50';
        case 2: return 'bg-emerald-800/60';
        case 3: return 'bg-emerald-700/70';
        case 4: return 'bg-emerald-600';
        default: return 'bg-zinc-800';
      }
    } else {
      switch (intensity) {
        case 0: return 'bg-gray-100';
        case 1: return 'bg-emerald-100';
        case 2: return 'bg-emerald-200';
        case 3: return 'bg-emerald-300';
        case 4: return 'bg-emerald-400';
        default: return 'bg-gray-100';
      }
    }
  };

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className={cn('w-full', className)}>
      <div className="grid grid-cols-25 gap-1">
        {/* Day labels */}
        <div className="col-span-1"></div>
        {days.map((day, idx) => (
          <div
            key={day}
            className={cn(
              'text-xs text-center py-1 font-medium',
              darkMode ? 'text-zinc-400' : 'text-gray-600'
            )}
          >
            {day}
          </div>
        ))}

        {/* Hour rows */}
        {hours.map((hour) => (
          <React.Fragment key={hour}>
            {/* Hour label */}
            <div
              className={cn(
                'text-xs text-right pr-2 py-0.5',
                darkMode ? 'text-zinc-500' : 'text-gray-500'
              )}
            >
              {hour.toString().padStart(2, '0')}
            </div>
            {/* Day cells */}
            {days.map((_, dayIdx) => {
              const key = `${dayIdx}-${hour}`;
              const pattern = patternMap.get(key);
              const intensity = getIntensity(pattern?.exercises_count || 0);
              const color = getColor(intensity);

              return (
                <div
                  key={key}
                  className={cn(
                    'w-3 h-3 rounded-sm transition-colors',
                    color,
                    pattern && 'cursor-pointer hover:ring-2 hover:ring-blue-400'
                  )}
                  title={
                    pattern
                      ? `${pattern.exercises_count} exercises, ${Math.round(pattern.avg_score_percent)}% avg`
                      : 'No activity'
                  }
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 text-xs">
        <span className={cn(darkMode ? 'text-zinc-400' : 'text-gray-600')}>Less</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((intensity) => (
            <div
              key={intensity}
              className={cn('w-3 h-3 rounded-sm', getColor(intensity))}
            />
          ))}
        </div>
        <span className={cn(darkMode ? 'text-zinc-400' : 'text-gray-600')}>More</span>
      </div>
    </div>
  );
};
