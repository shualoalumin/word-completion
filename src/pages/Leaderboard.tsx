import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { useLeaderboard, useUserRank } from '@/features/leaderboard';
import { cn } from '@/lib/utils';

export default function Leaderboard() {
  const { t } = useTranslation();
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  
  const { data: leaderboard, isLoading: leaderboardLoading } = useLeaderboard();
  const { data: userRank, isLoading: rankLoading } = useUserRank();

  // Redirect if not authenticated
  if (!loading && !isAuthenticated) {
    navigate('/');
    return null;
  }

  if (loading || leaderboardLoading || rankLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-400">{t('common.loading')}</div>
      </div>
    );
  }

  // Calculate current week start (Monday)
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  const weekStartStr = monday.toISOString().split('T')[0];
  const weekEnd = new Date(monday);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().split('T')[0];

  const getRankIcon = (rank: number | null) => {
    if (rank === null) return null;
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      {/* Global Header */}
      <GlobalHeader darkMode={true} />

      {/* Content */}
      <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold mb-2">Weekly Leaderboard</h1>
            <p className="text-zinc-400">
              {weekStartStr} - {weekEndStr}
            </p>
            {userRank && (
              <div className="mt-3 p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                <p className="text-sm text-zinc-400">
                  Your Rank: <span className="text-white font-semibold">
                    {userRank.rank ? `#${userRank.rank}` : 'Not ranked'} 
                  </span> out of {userRank.total} participants
                </p>
              </div>
            )}
          </div>

          {/* Leaderboard Table */}
          {leaderboard && leaderboard.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-3 px-4 text-zinc-400 font-medium">Rank</th>
                    <th className="text-left py-3 px-4 text-zinc-400 font-medium">User</th>
                    <th className="text-right py-3 px-4 text-zinc-400 font-medium">Exercises</th>
                    <th className="text-right py-3 px-4 text-zinc-400 font-medium">Avg Score</th>
                    <th className="text-right py-3 px-4 text-zinc-400 font-medium">Streak</th>
                    <th className="text-right py-3 px-4 text-zinc-400 font-medium">Words</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => {
                    const isCurrentUser = entry.user_id === user?.id;
                    return (
                      <tr
                        key={entry.id}
                        className={cn(
                          'border-b border-zinc-800/50 transition-colors',
                          isCurrentUser && 'bg-blue-600/10',
                          'hover:bg-zinc-900/40'
                        )}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getRankIcon(entry.rank)}</span>
                            {entry.rank && entry.rank > 3 && (
                              <span className="text-zinc-400">#{entry.rank}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            {entry.user_profile?.avatar_url ? (
                              <img
                                src={entry.user_profile.avatar_url}
                                alt={entry.user_profile.display_name || 'User'}
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs">
                                {entry.user_profile?.display_name?.[0]?.toUpperCase() || 'U'}
                              </div>
                            )}
                            <span className={cn(
                              'font-medium',
                              isCurrentUser && 'text-blue-400'
                            )}>
                              {entry.user_profile?.display_name || 'Anonymous'}
                            </span>
                            {isCurrentUser && (
                              <span className="text-xs px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded-full">
                                You
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right text-zinc-300">
                          {entry.exercises_completed}
                        </td>
                        <td className="py-4 px-4 text-right text-zinc-300">
                          {Math.round(entry.avg_score_percent)}%
                        </td>
                        <td className="py-4 px-4 text-right text-zinc-300">
                          {entry.streak_days} days
                        </td>
                        <td className="py-4 px-4 text-right text-zinc-300">
                          {entry.words_mastered}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 bg-zinc-900/60 border border-zinc-800 rounded-2xl text-center">
              <p className="text-zinc-400">No leaderboard data available yet.</p>
              <p className="text-sm text-zinc-500 mt-2">Complete exercises to appear on the leaderboard!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
