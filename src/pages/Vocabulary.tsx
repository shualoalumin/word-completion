import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { useVocabularyList, useVocabularyStats, useDeleteVocabularyWord } from '@/features/vocabulary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function Vocabulary() {
  const { t } = useTranslation();
  const { user, isAuthenticated, loading, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [masteryFilter, setMasteryFilter] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'word' | 'created_at' | 'mastery_level' | 'next_review_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: statsData, isLoading: statsLoading } = useVocabularyStats();
  const { data: vocabData, isLoading: vocabLoading } = useVocabularyList({
    searchQuery: searchQuery || undefined,
    masteryLevel: masteryFilter,
    sortBy,
    sortOrder,
  });
  const deleteWordMutation = useDeleteVocabularyWord();

  // Redirect if not authenticated
  if (!loading && !isAuthenticated) {
    navigate('/');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-400">{t('common.loading')}</div>
      </div>
    );
  }

  const stats = statsData?.data;
  const vocabulary = vocabData?.data || [];

  const handleDeleteWord = async (wordId: string, word: string) => {
    if (!confirm(t('vocabulary.confirmDelete'))) return;

    const result = await deleteWordMutation.mutateAsync(wordId);
    if (result.success) {
      toast.success(`"${word}" removed from vocabulary`);
    } else {
      toast.error(result.error?.message || 'Failed to delete word');
    }
  };

  const getMasteryColor = (level: number) => {
    if (level >= 4) return 'text-emerald-400 bg-emerald-900/20 border-emerald-800';
    if (level >= 2) return 'text-blue-400 bg-blue-900/20 border-blue-800';
    if (level >= 1) return 'text-amber-400 bg-amber-900/20 border-amber-800';
    return 'text-zinc-400 bg-zinc-800 border-zinc-700';
  };

  const getMasteryLabel = (level: number) => {
    if (level >= 4) return t('vocabulary.mastered');
    if (level >= 2) return t('vocabulary.learning');
    if (level >= 1) return t('vocabulary.new');
    return t('vocabulary.new');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      {/* Global Header */}
      <GlobalHeader darkMode={true} />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">

        {/* Stats Overview */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {/* Total Words */}
          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
            {statsLoading ? (
              <div className="animate-pulse">
                <div className="h-7 bg-zinc-700 rounded mb-2"></div>
                <div className="h-4 bg-zinc-700 rounded w-20"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-purple-400">
                  {stats?.totalWords ?? 0}
                </div>
                <div className="text-sm text-zinc-400">{t('vocabulary.totalWords')}</div>
              </>
            )}
          </div>

          {/* Mastered */}
          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
            {statsLoading ? (
              <div className="animate-pulse">
                <div className="h-7 bg-zinc-700 rounded mb-2"></div>
                <div className="h-4 bg-zinc-700 rounded w-20"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-emerald-400">
                  {stats?.masteredWords ?? 0}
                </div>
                <div className="text-sm text-zinc-400">{t('vocabulary.mastered')}</div>
              </>
            )}
          </div>

          {/* Learning */}
          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
            {statsLoading ? (
              <div className="animate-pulse">
                <div className="h-7 bg-zinc-700 rounded mb-2"></div>
                <div className="h-4 bg-zinc-700 rounded w-20"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-blue-400">
                  {stats?.learningWords ?? 0}
                </div>
                <div className="text-sm text-zinc-400">{t('vocabulary.learning')}</div>
              </>
            )}
          </div>

          {/* New */}
          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
            {statsLoading ? (
              <div className="animate-pulse">
                <div className="h-7 bg-zinc-700 rounded mb-2"></div>
                <div className="h-4 bg-zinc-700 rounded w-20"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-amber-400">
                  {stats?.newWords ?? 0}
                </div>
                <div className="text-sm text-zinc-400">{t('vocabulary.new')}</div>
              </>
            )}
          </div>

          {/* Due for Review */}
          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
            {statsLoading ? (
              <div className="animate-pulse">
                <div className="h-7 bg-zinc-700 rounded mb-2"></div>
                <div className="h-4 bg-zinc-700 rounded w-20"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-red-400">
                  {stats?.wordsDueForReview ?? 0}
                </div>
                <div className="text-sm text-zinc-400">{t('vocabulary.dueForReview')}</div>
              </>
            )}
          </div>
        </section>

        {/* Review Button */}
        {stats && stats.wordsDueForReview > 0 && (
          <div className="mb-6">
            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              size="lg"
              onClick={() => navigate('/vocabulary/review')}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Start Review Session ({stats.wordsDueForReview} words due)
            </Button>
          </div>
        )}

        {/* Filters and Search */}
        <section className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder={t('vocabulary.searchWords')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-900/60 border-zinc-800 text-white placeholder:text-zinc-500"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={masteryFilter === undefined ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMasteryFilter(undefined)}
              className={cn(
                masteryFilter === undefined 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                  : 'border-zinc-700 text-zinc-300 hover:border-purple-500/50 hover:bg-purple-500/10'
              )}
            >
              {t('vocabulary.all')}
            </Button>
            <Button
              variant={masteryFilter === 0 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMasteryFilter(0)}
              className={cn(
                masteryFilter === 0 
                  ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                  : 'border-zinc-700 text-zinc-300 hover:border-amber-500/50 hover:bg-amber-500/10'
              )}
            >
              {t('vocabulary.new')}
            </Button>
            <Button
              variant={masteryFilter === 2 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMasteryFilter(2)}
              className={cn(
                masteryFilter === 2 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'border-zinc-700 text-zinc-300 hover:border-blue-500/50 hover:bg-blue-500/10'
              )}
            >
              {t('vocabulary.learning')}
            </Button>
            <Button
              variant={masteryFilter === 4 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMasteryFilter(4)}
              className={cn(
                masteryFilter === 4 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                  : 'border-zinc-700 text-zinc-300 hover:border-emerald-500/50 hover:bg-emerald-500/10'
              )}
            >
              {t('vocabulary.mastered')}
            </Button>
          </div>
        </section>

        {/* Vocabulary List */}
        <section>
          {vocabLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl">
                  <div className="h-6 bg-zinc-800 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-zinc-800 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : vocabulary.length === 0 ? (
            <div className="p-12 bg-zinc-900/40 border border-zinc-800 rounded-2xl text-center">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-zinc-500 mb-2">{t('vocabulary.noWords')}</p>
              <p className="text-zinc-600 text-sm">{t('vocabulary.completeExercises')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vocabulary.map((word) => {
                // Extract first sentence from context
                const getFirstSentence = (text: string) => {
                  if (!text) return '';
                  const sentences = text.match(/[^.!?]+[.!?]+/g);
                  return sentences ? sentences[0].trim() : text.split('.')[0].trim() + '.';
                };

                // Highlight word in context
                const highlightWordInContext = (context: string, wordToHighlight: string) => {
                  if (!context || !wordToHighlight) return context;
                  const regex = new RegExp(`\\b(${wordToHighlight})\\b`, 'gi');
                  return context.replace(regex, '<mark class="bg-blue-500/30 text-blue-300 font-semibold">$1</mark>');
                };

                const firstSentence = word.source_context ? getFirstSentence(word.source_context) : '';
                const highlightedContext = firstSentence ? highlightWordInContext(firstSentence, word.word) : '';

                return (
                  <div
                    key={word.id}
                    className="p-3 bg-zinc-900/40 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Header: Word + Mastery Level */}
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-white">{word.word}</h3>
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full border shrink-0',
                            getMasteryColor(word.mastery_level || 0)
                          )}>
                            {getMasteryLabel(word.mastery_level || 0)}
                          </span>
                        </div>

                        {/* Definition - Most Important */}
                        {word.definition && (
                          <div className="mb-2">
                            <p className="text-sm font-medium text-zinc-300 leading-relaxed">
                              {word.definition}
                            </p>
                          </div>
                        )}

                        {/* Source Context - One sentence with highlighted word */}
                        {highlightedContext && (
                          <div className="mb-2">
                            <p className="text-xs text-zinc-500 mb-1">{t('vocabulary.fromPassage')}:</p>
                            <p 
                              className="text-sm text-zinc-400 leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: highlightedContext }}
                            />
                          </div>
                        )}

                        {/* Metadata Row - Compact */}
                        <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-zinc-800/50 text-xs text-zinc-500">
                          {word.review_count > 0 && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {word.review_count}
                            </span>
                          )}
                          {word.last_reviewed_at && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {new Date(word.last_reviewed_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 shrink-0"
                        onClick={() => handleDeleteWord(word.id, word.word)}
                        title={t('vocabulary.deleteWord')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
