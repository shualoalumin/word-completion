import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { UserMenu } from '@/features/auth/components/UserMenu';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { user, isAuthenticated, loading, signOut } = useAuth();
  const navigate = useNavigate();

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      navigate('/');
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Learner';

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center font-bold text-lg">
              GP
            </div>
            <span className="text-xl font-semibold tracking-tight">GlobalPrep</span>
          </div>
          
          {user && <UserMenu user={user} onSignOut={signOut} darkMode={true} />}
        </header>

        {/* Welcome Section */}
        <section className="mb-12">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, <span className="text-emerald-400">{userName}</span> 👋
          </h1>
          <p className="text-zinc-400">Ready to continue your TOEFL preparation?</p>
        </section>

        {/* Stats Overview */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
            <div className="text-2xl font-bold text-blue-400">0</div>
            <div className="text-sm text-zinc-400">Exercises Today</div>
          </div>
          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
            <div className="text-2xl font-bold text-emerald-400">0</div>
            <div className="text-sm text-zinc-400">Day Streak 🔥</div>
          </div>
          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
            <div className="text-2xl font-bold text-purple-400">-</div>
            <div className="text-sm text-zinc-400">Avg. Score</div>
          </div>
          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
            <div className="text-2xl font-bold text-amber-400">0</div>
            <div className="text-sm text-zinc-400">Total Exercises</div>
          </div>
        </section>

        {/* Practice Cards */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Choose Your Practice</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Complete the Words */}
            <div 
              className="group relative p-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl hover:border-blue-600/50 transition-all cursor-pointer overflow-hidden"
              onClick={() => navigate('/practice/text-completion')}
            >
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-blue-600/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <span className="px-3 py-1 bg-blue-600/20 text-blue-400 text-xs font-medium rounded-full">
                    Reading Section
                  </span>
                </div>

                <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-400 transition-colors">
                  Complete the Words
                </h3>
                <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
                  Fill in the missing letters to complete words in academic passages. 
                  AI adapts difficulty based on your performance.
                </p>

                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-zinc-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    ~3 min
                  </span>
                  <span className="flex items-center gap-1 text-zinc-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    10 blanks
                  </span>
                </div>

                <Button 
                  className="mt-6 w-full bg-blue-600 hover:bg-blue-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/practice/text-completion');
                  }}
                >
                  Start Practice
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </div>
            </div>

            {/* Build a Sentence */}
            <div className="group relative p-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl opacity-60 cursor-not-allowed overflow-hidden">
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-emerald-600/20 rounded-2xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                  </div>
                  <span className="px-3 py-1 bg-zinc-700 text-zinc-400 text-xs font-medium rounded-full">
                    Coming Soon
                  </span>
                </div>

                <h3 className="text-xl font-semibold mb-2">
                  Build a Sentence
                </h3>
                <p className="text-zinc-500 text-sm mb-4 leading-relaxed">
                  Arrange scrambled words to form grammatically correct sentences. 
                  Practice word order and syntax patterns.
                </p>

                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-zinc-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    ~2 min
                  </span>
                  <span className="flex items-center gap-1 text-zinc-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    5 sentences
                  </span>
                </div>

                <Button 
                  className="mt-6 w-full"
                  variant="outline"
                  disabled
                >
                  Coming Soon
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Activity Placeholder */}
        <section>
          <h2 className="text-xl font-semibold mb-6">Recent Activity</h2>
          <div className="p-8 bg-zinc-900/40 border border-zinc-800 rounded-2xl text-center">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-zinc-500 mb-2">No activity yet</p>
            <p className="text-zinc-600 text-sm">Complete your first exercise to see your progress here!</p>
          </div>
        </section>
      </div>
    </div>
  );
}

