import React, { useEffect, useState } from 'react';
import { getUserPerformanceStats, PerformanceStatsByDifficulty } from '../api';
import { TIMER_TARGET_BY_DIFFICULTY } from '@/core/constants';
import { cn } from '@/lib/utils';

interface PerformanceStatsProps {
  darkMode?: boolean;
}

export const PerformanceStats: React.FC<PerformanceStatsProps> = ({ darkMode = false }) => {
  const [stats, setStats] = useState<PerformanceStatsByDifficulty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await getUserPerformanceStats();

    if (err) {
      setError(err.message);
    } else {
      setStats(data || []);
    }
    setLoading(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTargetTime = (difficulty: 'easy' | 'intermediate' | 'hard'): number => {
    return TIMER_TARGET_BY_DIFFICULTY[difficulty];
  };

  const getStatusMessage = (avgTime: number, targetTime: number): { icon: string; message: string; color: string } => {
    const ratio = avgTime / targetTime;

    if (ratio <= 0.8) {
      return { icon: '🔥', message: 'Excellent!', color: 'text-emerald-500' };
    } else if (ratio <= 1.0) {
      return { icon: '✓', message: 'On target', color: 'text-blue-500' };
    } else if (ratio <= 1.3) {
      return { icon: '⚠️', message: 'Needs improvement', color: 'text-amber-500' };
    } else {
      return { icon: '⏱️', message: 'Practice more', color: 'text-red-500' };
    }
  };

  const getDifficultyLabel = (difficulty: 'easy' | 'intermediate' | 'hard'): string => {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  const getProgressPercent = (avgTime: number, targetTime: number): number => {
    // Invert the progress - lower time = higher progress
    const ratio = avgTime / targetTime;
    if (ratio <= 1.0) {
      return 100; // At or below target = 100%
    } else {
      // Above target: decrease from 100% as it gets slower
      return Math.max(0, Math.min(100, 100 - ((ratio - 1) * 100)));
    }
  };

  if (loading) {
    return (
      <div className={cn(
        "p-6 rounded-xl border",
        darkMode ? "bg-zinc-900/50 border-zinc-800" : "bg-white border-gray-200"
      )}>
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
          <span className={cn(darkMode ? "text-gray-400" : "text-gray-600")}>Loading stats...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        "p-6 rounded-xl border",
        darkMode ? "bg-zinc-900/50 border-zinc-800" : "bg-white border-gray-200"
      )}>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div className={cn(
        "p-8 rounded-xl border text-center",
        darkMode ? "bg-zinc-900/50 border-zinc-800" : "bg-white border-gray-200"
      )}>
        <div className="text-6xl mb-4">📊</div>
        <h3 className={cn(
          "text-lg font-semibold mb-2",
          darkMode ? "text-gray-200" : "text-gray-900"
        )}>
          No performance data yet
        </h3>
        <p className={cn(
          "text-sm",
          darkMode ? "text-gray-400" : "text-gray-600"
        )}>
          Complete 3+ exercises to see your time statistics
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      "p-6 rounded-xl border",
      darkMode ? "bg-zinc-900/50 border-zinc-800" : "bg-white border-gray-200"
    )}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={cn(
            "text-xl font-bold",
            darkMode ? "text-gray-100" : "text-gray-900"
          )}>
            Time Performance
          </h2>
          <p className={cn(
            "text-sm mt-1",
            darkMode ? "text-gray-400" : "text-gray-600"
          )}>
            Track your completion times by difficulty
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {stats.map((stat) => {
          const targetTime = getTargetTime(stat.difficulty);
          const status = getStatusMessage(stat.avgTime, targetTime);
          const progressPercent = getProgressPercent(stat.avgTime, targetTime);

          return (
            <div
              key={stat.difficulty}
              className={cn(
                "p-4 rounded-lg border",
                darkMode ? "bg-zinc-800/50 border-zinc-700" : "bg-gray-50 border-gray-200"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className={cn(
                    "text-base font-semibold",
                    darkMode ? "text-gray-200" : "text-gray-900"
                  )}>
                    {getDifficultyLabel(stat.difficulty)}
                  </h3>
                  <p className={cn(
                    "text-xs mt-0.5",
                    darkMode ? "text-gray-500" : "text-gray-500"
                  )}>
                    {stat.attempts} {stat.attempts === 1 ? 'attempt' : 'attempts'}
                  </p>
                </div>
                <div className={cn("flex items-center gap-1.5 text-sm font-medium", status.color)}>
                  <span>{status.icon}</span>
                  <span>{status.message}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <p className={cn("text-xs", darkMode ? "text-gray-500" : "text-gray-500")}>Your avg</p>
                  <p className={cn(
                    "text-lg font-bold tabular-nums",
                    darkMode ? "text-gray-200" : "text-gray-900"
                  )}>
                    {formatTime(stat.avgTime)}
                  </p>
                </div>
                <div>
                  <p className={cn("text-xs", darkMode ? "text-gray-500" : "text-gray-500")}>Target</p>
                  <p className={cn(
                    "text-lg font-bold tabular-nums",
                    darkMode ? "text-gray-200" : "text-gray-900"
                  )}>
                    {formatTime(targetTime)}
                  </p>
                </div>
                <div>
                  <p className={cn("text-xs", darkMode ? "text-gray-500" : "text-gray-500")}>Best</p>
                  <p className={cn(
                    "text-lg font-bold tabular-nums text-emerald-500"
                  )}>
                    {formatTime(stat.bestTime)}
                  </p>
                </div>
              </div>

              {/* Progress bar visualization */}
              <div className="relative h-2 rounded-full overflow-hidden" style={{ backgroundColor: darkMode ? '#27272a' : '#e5e7eb' }}>
                <div
                  className={cn(
                    "h-full transition-all duration-500",
                    progressPercent === 100 ? "bg-emerald-500" :
                    progressPercent >= 70 ? "bg-blue-500" :
                    progressPercent >= 50 ? "bg-amber-500" :
                    "bg-red-500"
                  )}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className={cn(
        "mt-6 pt-4 border-t",
        darkMode ? "border-zinc-700" : "border-gray-200"
      )}>
        <p className={cn(
          "text-xs",
          darkMode ? "text-gray-500" : "text-gray-500"
        )}>
          💡 Tip: Fast and accurate completion in Complete the Words saves time for harder Reading questions in TOEFL.
        </p>
      </div>
    </div>
  );
};
