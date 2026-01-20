import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface HistoryRecord {
  id: string;
  exerciseId: string;
  score: number;
  maxScore: number;
  scorePercent: number;
  completedAt: string;
  topic?: string;
  difficulty?: string;
  topicCategory?: string;
  timeSpentSeconds?: number;
}

interface GroupedHistory {
  [date: string]: HistoryRecord[];
}

const DIFFICULTY_CONFIG = {
  easy: { label: 'Easy', color: 'bg-green-500/20 text-green-400' },
  intermediate: { label: 'Medium', color: 'bg-yellow-500/20 text-yellow-400' },
  hard: { label: 'Hard', color: 'bg-red-500/20 text-red-400' },
};

export default function History() {
  const { t } = useTranslation();
  const { user, isAuthenticated, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Redirect to landing if not authenticated
  if (!loading && !isAuthenticated) {
    navigate('/');
    return null;
  }

  // Fetch all history
  const { data: historyData, isLoading } = useQuery({
    queryKey: ['exercise-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: history, error } = await supabase
        .from('user_exercise_history')
        .select(`
          id,
          exercise_id,
          score,
          max_score,
          score_percent,
          completed_at,
          difficulty,
          topic_category,
          time_spent_seconds
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('Error fetching history:', error);
        return [];
      }

      // Get topics from exercises table
      const exerciseIds = (history || []).map(h => h.exercise_id).filter(Boolean);
      let topicsMap: Record<string, string> = {};

      if (exerciseIds.length > 0) {
        const { data: exercises } = await supabase
          .from('exercises')
          .select('id, topic')
          .in('id', exerciseIds);

        if (exercises) {
          topicsMap = exercises.reduce((acc, ex) => {
            acc[ex.id] = ex.topic;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      return (history || []).map((record: any): HistoryRecord => ({
        id: record.id,
        exerciseId: record.exercise_id,
        score: record.score || 0,
        maxScore: record.max_score || 10,
        scorePercent: typeof record.score_percent === 'number'
          ? record.score_percent
          : parseFloat(String(record.score_percent || 0)),
        completedAt: record.completed_at || '',
        topic: topicsMap[record.exercise_id],
        difficulty: record.difficulty,
        topicCategory: record.topic_category,
        timeSpentSeconds: record.time_spent_seconds,
      }));
    },
    enabled: !!user?.id,
  });

  // Group history by date
  const groupedHistory = useMemo(() => {
    if (!historyData) return {};

    const filtered = selectedMonth === 'all'
      ? historyData
      : historyData.filter(h => {
          const date = new Date(h.completedAt);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          return monthKey === selectedMonth;
        });

    return filtered.reduce((groups: GroupedHistory, record) => {
      const date = new Date(record.completedAt).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(record);
      return groups;
    }, {});
  }, [historyData, selectedMonth]);

  // Get available months for filter
  const availableMonths = useMemo(() => {
    if (!historyData) return [];
    const months = new Set<string>();
    historyData.forEach(h => {
      const date = new Date(h.completedAt);
      months.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    });
    return Array.from(months).sort().reverse();
  }, [historyData]);

  const formatTime = (seconds?: number) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-400">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Title + Filter */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t('history.title')}</h1>
            <p className="text-zinc-400 text-sm">
              {historyData?.length || 0} total exercises completed
            </p>
          </div>

          {/* Month Filter */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t('history.allMonths')}</option>
            {availableMonths.map(month => {
              const [year, m] = month.split('-');
              const date = new Date(parseInt(year), parseInt(m) - 1);
              return (
                <option key={month} value={month}>
                  {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </option>
              );
            })}
          </select>
        </div>

        {/* History List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-zinc-800 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : Object.keys(groupedHistory).length === 0 ? (
          <div className="p-12 bg-zinc-900/40 border border-zinc-800 rounded-2xl text-center">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-zinc-500 mb-2">{t('history.noHistory')}</p>
            <p className="text-zinc-600 text-sm mb-4">{t('history.completeExercises')}</p>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate('/practice/text-completion')}
            >
              {t('practice.title')}
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedHistory).map(([date, records]) => (
              <div key={date}>
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <h2 className="text-lg font-semibold text-zinc-300">{date}</h2>
                  <span className="text-sm text-zinc-500">({records.length} exercises)</span>
                </div>

                {/* Records for this date */}
                <div className="space-y-2 ml-4 border-l-2 border-zinc-800 pl-4">
                  {records.map((record) => {
                    const difficultyConfig = record.difficulty
                      ? DIFFICULTY_CONFIG[record.difficulty as keyof typeof DIFFICULTY_CONFIG]
                      : null;
                    const time = new Date(record.completedAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={record.id}
                        onClick={() => navigate(`/practice/text-completion?review=${record.exerciseId}`)}
                        className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl hover:border-blue-600/50 hover:bg-zinc-900/60 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <span className="text-zinc-500 text-sm">{time}</span>
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                record.scorePercent >= 90 ? 'bg-emerald-500' :
                                record.scorePercent >= 70 ? 'bg-blue-500' :
                                record.scorePercent >= 50 ? 'bg-amber-500' :
                                'bg-red-500'
                              }`} />
                              <h3 className="font-medium text-white group-hover:text-blue-400 transition-colors">
                                {record.topic || 'Text Completion'}
                              </h3>
                              {difficultyConfig && (
                                <span className={cn(
                                  'text-xs px-2 py-0.5 rounded-full',
                                  difficultyConfig.color
                                )}>
                                  {difficultyConfig.label}
                                </span>
                              )}
                              {record.topicCategory && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                                  {record.topicCategory}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-zinc-400">
                              <span>
                                {t('history.score')}: {record.score}/{record.maxScore}
                              </span>
                              <span>•</span>
                              <span>Time: {formatTime(record.timeSpentSeconds)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                              record.scorePercent >= 90 ? 'bg-emerald-500/20 text-emerald-400' :
                              record.scorePercent >= 70 ? 'bg-blue-500/20 text-blue-400' :
                              record.scorePercent >= 50 ? 'bg-amber-500/20 text-amber-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {Math.round(record.scorePercent)}%
                            </div>
                            <span className="text-zinc-500 group-hover:text-blue-400 transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
