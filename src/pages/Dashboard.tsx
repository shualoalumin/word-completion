import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useDashboardStats, useRecentActivity } from '@/features/dashboard';
import { useUserSkills } from '@/features/skills';
import { useLearningPatterns } from '@/features/learning-patterns';
import { useTopicPerformance } from '@/features/topic-performance';
import { SkillRadarChart } from '@/components/charts/SkillRadarChart';
import { LearningHeatmap } from '@/components/charts/LearningHeatmap';
import { cn } from '@/lib/utils';
import {
  Book,
  Bookmark,
  Trophy,
  History,
  LayoutDashboard,
  PencilLine,
  ChevronRight,
  BarChart2,
  Calendar,
  Clock
} from 'lucide-react';

export default function Dashboard() {
  const { t } = useTranslation();
  const { user, isAuthenticated, loading, signOut } = useAuth();
  const navigate = useNavigate();

  // Dashboard 통계 데이터 fetching
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats();
  const { data: recentActivity, isLoading: activityLoading, error: activityError } = useRecentActivity(5);

  // Skills, Learning Patterns, Topic Performance
  const { data: skillsData, isLoading: skillsLoading } = useUserSkills();
  const { data: patternsData, isLoading: patternsLoading } = useLearningPatterns();
  const { data: topicPerformanceData, isLoading: topicPerformanceLoading } = useTopicPerformance();

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      navigate('/');
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-400">{t('common.loading')}</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Learner';

  return (
    <div className="text-white">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      {/* Content - Wider layout */}
      <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Welcome + Start Practice - Row layout */}
        <section className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">
              {t('auth.welcome')}, <span className="text-emerald-400">{userName}</span> 👋
            </h1>
            <p className="text-zinc-400 text-sm">Ready to continue your TOEFL preparation?</p>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => navigate('/practice')}
          >
            <PencilLine className="w-4 h-4 mr-2" />
            Practice
          </Button>
        </section>

        {/* Stats Overview - Compact */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {/* Exercises Today */}
          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
            {statsLoading ? (
              <div className="animate-pulse">
                <div className="h-7 bg-zinc-700 rounded mb-2"></div>
                <div className="h-4 bg-zinc-700 rounded w-24"></div>
              </div>
            ) : statsError ? (
              <>
                <div className="text-2xl font-bold text-red-400">-</div>
                <div className="text-sm text-zinc-400">Error loading</div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-blue-400">
                  {stats?.exercisesToday ?? 0}
                </div>
                <div className="text-sm text-zinc-400">{t('dashboard.exercisesToday')}</div>
              </>
            )}
          </div>

          {/* Day Streak */}
          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
            {statsLoading ? (
              <div className="animate-pulse">
                <div className="h-7 bg-zinc-700 rounded mb-2"></div>
                <div className="h-4 bg-zinc-700 rounded w-24"></div>
              </div>
            ) : statsError ? (
              <>
                <div className="text-2xl font-bold text-red-400">-</div>
                <div className="text-sm text-zinc-400">Error loading</div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-emerald-400">
                  {stats?.dayStreak ?? 0}
                </div>
                <div className="text-sm text-zinc-400">{t('dashboard.dayStreak')} 🔥</div>
              </>
            )}
          </div>

          {/* Average Score */}
          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
            {statsLoading ? (
              <div className="animate-pulse">
                <div className="h-7 bg-zinc-700 rounded mb-2"></div>
                <div className="h-4 bg-zinc-700 rounded w-24"></div>
              </div>
            ) : statsError ? (
              <>
                <div className="text-2xl font-bold text-red-400">-</div>
                <div className="text-sm text-zinc-400">Error loading</div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-purple-400">
                  {stats && stats.averageScore !== null && stats.averageScore !== undefined
                    ? `${Math.round(stats.averageScore)}%`
                    : '-'}
                </div>
                <div className="text-sm text-zinc-400">{t('dashboard.avgScore')}</div>
              </>
            )}
          </div>

          {/* Total Exercises */}
          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
            {statsLoading ? (
              <div className="animate-pulse">
                <div className="h-7 bg-zinc-700 rounded mb-2"></div>
                <div className="h-4 bg-zinc-700 rounded w-24"></div>
              </div>
            ) : statsError ? (
              <>
                <div className="text-2xl font-bold text-red-400">-</div>
                <div className="text-sm text-zinc-400">Error loading</div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-amber-400">
                  {stats?.totalExercises ?? 0}
                </div>
                <div className="text-sm text-zinc-400">{t('dashboard.totalExercises')}</div>
              </>
            )}
          </div>
        </section>

        {/* Difficulty Stats */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Performance by Difficulty
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Easy */}
            <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
              {statsLoading ? (
                <div className="animate-pulse">
                  <div className="h-7 bg-zinc-700 rounded mb-2"></div>
                  <div className="h-4 bg-zinc-700 rounded w-20"></div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                      Easy
                    </span>
                    <span className="text-zinc-500 text-xs">
                      {stats?.difficultyStats?.easy?.count ?? 0} exercises
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-green-400">
                    {stats?.difficultyStats?.easy?.avgScore !== null && stats?.difficultyStats?.easy?.avgScore !== undefined
                      ? `${Math.round(stats.difficultyStats.easy.avgScore)}%`
                      : '-'}
                  </div>
                  <div className="text-sm text-zinc-400">{t('dashboard.avgScore')}</div>
                </>
              )}
            </div>

            {/* Intermediate */}
            <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
              {statsLoading ? (
                <div className="animate-pulse">
                  <div className="h-7 bg-zinc-700 rounded mb-2"></div>
                  <div className="h-4 bg-zinc-700 rounded w-20"></div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                      Medium
                    </span>
                    <span className="text-zinc-500 text-xs">
                      {stats?.difficultyStats?.intermediate?.count ?? 0} exercises
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {stats?.difficultyStats?.intermediate?.avgScore !== null && stats?.difficultyStats?.intermediate?.avgScore !== undefined
                      ? `${Math.round(stats.difficultyStats.intermediate.avgScore)}%`
                      : '-'}
                  </div>
                  <div className="text-sm text-zinc-400">{t('dashboard.avgScore')}</div>
                </>
              )}
            </div>

            {/* Hard */}
            <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
              {statsLoading ? (
                <div className="animate-pulse">
                  <div className="h-7 bg-zinc-700 rounded mb-2"></div>
                  <div className="h-4 bg-zinc-700 rounded w-20"></div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                      Hard
                    </span>
                    <span className="text-zinc-500 text-xs">
                      {stats?.difficultyStats?.hard?.count ?? 0} exercises
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-red-400">
                    {stats?.difficultyStats?.hard?.avgScore !== null && stats?.difficultyStats?.hard?.avgScore !== undefined
                      ? `${Math.round(stats.difficultyStats.hard.avgScore)}%`
                      : '-'}
                  </div>
                  <div className="text-sm text-zinc-400">{t('dashboard.avgScore')}</div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Quick Actions</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {/* Vocabulary Link */}
            <div
              className="group relative p-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl hover:border-purple-600/50 transition-all cursor-pointer overflow-hidden"
              onClick={() => navigate('/vocabulary')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative flex items-center gap-4">
                <div className="w-14 h-14 bg-purple-600/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Book className="w-7 h-7 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1 group-hover:text-purple-400 transition-colors">
                    My Vocab
                  </h3>
                  <p className="text-sm text-zinc-400">
                    {t('dashboard.reviewAndManage')}
                  </p>
                </div>
                <svg className="w-5 h-5 text-zinc-500 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Bookmarks Link */}
            <div
              className="group relative p-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl hover:border-amber-600/50 transition-all cursor-pointer overflow-hidden"
              onClick={() => navigate('/bookmarks')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative flex items-center gap-4">
                <div className="w-14 h-14 bg-amber-600/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Bookmark className="w-7 h-7 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1 group-hover:text-amber-400 transition-colors">
                    {t('dashboard.myBookmarks')}
                  </h3>
                  <p className="text-sm text-zinc-400">
                    {t('dashboard.savedExercises')}
                  </p>
                </div>
                <svg className="w-5 h-5 text-zinc-500 group-hover:text-amber-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Achievements Link */}
            <div
              className="group relative p-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl hover:border-emerald-600/50 transition-all cursor-pointer overflow-hidden"
              onClick={() => navigate('/achievements')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-600/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Trophy className="w-7 h-7 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1 group-hover:text-emerald-400 transition-colors">
                    Achievements
                  </h3>
                  <p className="text-sm text-zinc-400">
                    View your unlocked achievements
                  </p>
                </div>
                <svg className="w-5 h-5 text-zinc-500 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Leaderboard Link */}
            <div
              className="group relative p-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl hover:border-indigo-600/50 transition-all cursor-pointer overflow-hidden"
              onClick={() => navigate('/leaderboard')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-600/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BarChart2 className="w-7 h-7 text-indigo-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1 group-hover:text-indigo-400 transition-colors">
                    Leaderboard
                  </h3>
                  <p className="text-sm text-zinc-400">
                    See how you rank this week
                  </p>
                </div>
                <svg className="w-5 h-5 text-zinc-500 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* Skills & Analytics */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Skills & Analytics</h2>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Skill Radar Chart */}
            <div className="p-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
              <h3 className="text-lg font-semibold mb-4">Skill Proficiency</h3>
              {skillsLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-pulse text-zinc-500">Loading skills...</div>
                </div>
              ) : skillsData && skillsData.length > 0 ? (
                <SkillRadarChart
                  data={skillsData.map((skill) => ({
                    skill: skill.skill_type.charAt(0).toUpperCase() + skill.skill_type.slice(1),
                    value: Math.round(skill.proficiency_score * 100),
                    fullMark: 100,
                  }))}
                  darkMode={true}
                />
              ) : (
                <div className="h-64 flex items-center justify-center text-zinc-500">
                  <p>Complete exercises to see your skills</p>
                </div>
              )}
            </div>

            {/* Learning Heatmap */}
            <div className="p-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
              <h3 className="text-lg font-semibold mb-4">Learning Activity</h3>
              {patternsLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-pulse text-zinc-500">Loading patterns...</div>
                </div>
              ) : patternsData && patternsData.length > 0 ? (
                <LearningHeatmap patterns={patternsData} darkMode={true} />
              ) : (
                <div className="h-64 flex items-center justify-center text-zinc-500">
                  <p>Complete exercises to see your learning patterns</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Recent Activity */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">{t('dashboard.recentActivity')}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/history')}
              className="text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/30"
            >
              {t('dashboard.viewAllHistory')}
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
          {activityLoading ? (
            <div className="p-8 bg-zinc-900/40 border border-zinc-800 rounded-2xl">
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-zinc-800 rounded-lg"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : recentActivity && recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity) => {
                const completedDate = new Date(activity.completedAt);
                const timeAgo = getTimeAgo(completedDate);
                const scorePercent = activity.scorePercent || 0;

                return (
                  <div
                    key={activity.id}
                    onClick={() => {
                      // Navigate to review the exercise
                      if (activity.exerciseId) {
                        navigate(`/practice/text-completion?review=${activity.exerciseId}`);
                      }
                    }}
                    className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl hover:border-blue-600/50 hover:bg-zinc-900/60 transition-all cursor-pointer group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${scorePercent >= 90 ? 'bg-emerald-500' :
                            scorePercent >= 70 ? 'bg-blue-500' :
                              scorePercent >= 50 ? 'bg-amber-500' :
                                'bg-red-500'
                            }`} />
                          <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
                            {activity.topic || 'Text Completion'}
                            {activity.attemptNumber && (
                              <span className="ml-1.5 text-zinc-500 text-[10px] font-normal">
                                (Attempt #{activity.attemptNumber})
                              </span>
                            )}
                          </h3>
                          {activity.difficulty && (
                            <span className={cn(
                              'text-[10px] px-1.5 py-0.5 rounded-full shrink-0',
                              activity.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                                activity.difficulty === 'hard' ? 'bg-red-500/20 text-red-400' :
                                  'bg-yellow-500/20 text-yellow-400'
                            )}>
                              {activity.difficulty === 'easy' ? 'Easy' :
                                activity.difficulty === 'hard' ? 'Hard' : 'Medium'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] sm:text-xs text-zinc-400 flex-wrap">
                          <span>
                            Score: {activity.score}/{activity.maxScore} ({Math.round(scorePercent)}%)
                          </span>
                          <span className="hidden sm:inline">•</span>
                          <span>{timeAgo}</span>
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400 flex items-center gap-1 ml-auto sm:ml-0">
                            <History className="w-3 h-3" />
                            Review
                          </span>
                        </div>
                      </div>
                      <div className={`self-start sm:self-center px-3 py-1 rounded-full text-sm font-medium shrink-0 ${scorePercent >= 90 ? 'bg-emerald-500/20 text-emerald-400' :
                        scorePercent >= 70 ? 'bg-blue-500/20 text-blue-400' :
                          scorePercent >= 50 ? 'bg-amber-500/20 text-amber-400' :
                            'bg-red-500/20 text-red-400'
                        }`}>
                        {Math.round(scorePercent)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 bg-zinc-900/40 border border-zinc-800 rounded-2xl text-center">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-zinc-500 mb-2">No activity yet</p>
              <p className="text-zinc-600 text-sm">Complete your first exercise to see your progress here!</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/**
 * Helper function to calculate time ago
 */
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
