import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { UserMenu } from '@/features/auth/components/UserMenu';
import { Button } from '@/components/ui/button';
import { useAchievements, useUserAchievements } from '@/features/achievements';
import { cn } from '@/lib/utils';

export default function Achievements() {
  const { t } = useTranslation();
  const { user, isAuthenticated, loading, signOut } = useAuth();
  const navigate = useNavigate();
  
  const { data: allAchievements, isLoading: achievementsLoading } = useAchievements();
  const { data: userAchievements, isLoading: userAchievementsLoading } = useUserAchievements();

  // Redirect if not authenticated
  if (!loading && !isAuthenticated) {
    navigate('/');
    return null;
  }

  if (loading || achievementsLoading || userAchievementsLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-400">{t('common.loading')}</div>
      </div>
    );
  }

  const unlockedAchievementIds = new Set(
    (userAchievements || []).map((ua) => ua.achievement_id)
  );

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'border-amber-500 bg-amber-500/10';
      case 'epic':
        return 'border-purple-500 bg-purple-500/10';
      case 'rare':
        return 'border-blue-500 bg-blue-500/10';
      default:
        return 'border-zinc-600 bg-zinc-800/50';
    }
  };

  const achievementsByCategory = (allAchievements || []).reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, typeof allAchievements>);

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

        {/* Achievements Content */}
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">Achievements</h1>
            <p className="text-zinc-400">
              {unlockedAchievementIds.size} / {allAchievements?.length || 0} unlocked
            </p>
          </div>

          {/* Achievements by Category */}
          {Object.entries(achievementsByCategory).map(([category, achievements]) => (
            <section key={category} className="space-y-4">
              <h2 className="text-lg font-semibold capitalize">{category}</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement) => {
                  const isUnlocked = unlockedAchievementIds.has(achievement.id);
                  return (
                    <div
                      key={achievement.id}
                      className={cn(
                        'p-4 border rounded-2xl transition-all',
                        isUnlocked
                          ? getRarityColor(achievement.rarity)
                          : 'border-zinc-800 bg-zinc-900/40 opacity-60'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">{achievement.icon || '🏆'}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold">{achievement.name}</h3>
                            {isUnlocked && (
                              <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
                                Unlocked
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-zinc-400 mb-2">
                            {achievement.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-zinc-500">{achievement.points} pts</span>
                            <span className="text-zinc-600">•</span>
                            <span className="capitalize text-zinc-500">{achievement.rarity}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
