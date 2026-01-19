import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { UserMenu } from '@/features/auth/components/UserMenu';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { getBookmarks, BookmarkItem } from '@/features/reading/text-completion/api';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/common';

const DIFFICULTY_CONFIG = {
  easy: { label: 'Easy', color: 'bg-green-500/20 text-green-400' },
  intermediate: { label: 'Medium', color: 'bg-yellow-500/20 text-yellow-400' },
  hard: { label: 'Hard', color: 'bg-red-500/20 text-red-400' },
};

export default function Bookmarks() {
  const { user, isAuthenticated, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [selectedFolder, setSelectedFolder] = useState<string>('all');

  // Redirect to landing if not authenticated
  if (!loading && !isAuthenticated) {
    navigate('/');
    return null;
  }

  // Fetch bookmarks
  const { data: bookmarksData, isLoading, refetch } = useQuery({
    queryKey: ['bookmarks', user?.id, selectedFolder],
    queryFn: async () => {
      if (!user?.id) return null;
      const result = await getBookmarks(selectedFolder === 'all' ? undefined : selectedFolder);
      if (result.error) {
        throw result.error;
      }
      return result.data || [];
    },
    enabled: !!user?.id,
  });

  // Get unique folders
  const folders = ['all', 'default'];
  const bookmarks = bookmarksData || [];

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return '방금 전';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <LoadingSpinner message="북마크를 불러오는 중..." darkMode={true} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
        <div className="mx-auto max-w-[1600px] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/30"
              >
                ← Dashboard
              </Button>
              <h1 className="text-xl font-bold text-white">My Bookmarks</h1>
            </div>
            <UserMenu user={user} onSignOut={signOut} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[1600px] px-6 py-8">
        {/* Folder Filter */}
        <div className="mb-6 flex items-center gap-3">
          <span className="text-sm text-zinc-400">Filter:</span>
          {folders.map((folder) => (
            <Button
              key={folder}
              variant={selectedFolder === folder ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFolder(folder)}
              className={cn(
                selectedFolder === folder
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'border-zinc-700 text-zinc-300 hover:border-blue-500/50 hover:bg-blue-500/10'
              )}
            >
              {folder === 'all' ? 'All' : folder}
            </Button>
          ))}
        </div>

        {/* Bookmarks List */}
        {bookmarks.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-12 text-center">
            <svg
              className="mx-auto mb-4 h-16 w-16 text-zinc-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
            <h3 className="mb-2 text-lg font-semibold text-zinc-300">북마크가 없습니다</h3>
            <p className="mb-4 text-sm text-zinc-500">
              문제를 풀고 결과 화면에서 북마크를 저장하세요.
            </p>
            <Button onClick={() => navigate('/practice/text-completion')} variant="outline">
              문제 풀러 가기
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                onClick={() => navigate(`/practice/text-completion?review=${bookmark.exerciseId}`)}
                className="group cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition-all hover:border-blue-600/50 hover:bg-zinc-900/60"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {bookmark.topic || 'Text Completion'}
                      </h3>
                      {bookmark.difficulty && (
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full',
                          DIFFICULTY_CONFIG[bookmark.difficulty as keyof typeof DIFFICULTY_CONFIG]?.color ||
                          'bg-zinc-700 text-zinc-300'
                        )}>
                          {DIFFICULTY_CONFIG[bookmark.difficulty as keyof typeof DIFFICULTY_CONFIG]?.label || bookmark.difficulty}
                        </span>
                      )}
                      {bookmark.topicCategory && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                          {bookmark.topicCategory}
                        </span>
                      )}
                    </div>
                    {bookmark.note && (
                      <p className="mb-2 text-sm text-zinc-400">{bookmark.note}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <span>{getTimeAgo(bookmark.createdAt)}</span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Review
                      </span>
                    </div>
                  </div>
                  <svg
                    className="h-5 w-5 text-amber-500 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
