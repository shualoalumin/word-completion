import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AuthModal } from '@/features/auth/components/AuthModal';
import { Button } from '@/components/ui/button';

export default function Landing() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);

  // onSuccess 콜백을 useCallback으로 안정화 (무한 루프 방지)
  const handleAuthSuccess = useCallback(() => {
    setShowAuth(false);
    // 인증 성공 후 바로 리디렉션 (명시적 로그인 시에만)
    // 약간의 지연을 두어 인증 상태 업데이트 보장
    setTimeout(() => {
      navigate('/dashboard', { replace: true });
    }, 100);
  }, [navigate]);

  // 자동 리디렉션 제거: 사용자가 명시적으로 로그인할 때만 Dashboard로 이동
  // 이미 로그인된 사용자도 랜딩 페이지를 볼 수 있도록 함

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl" />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), 
                              linear-gradient(to bottom, white 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex items-center justify-between mb-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center font-bold text-lg">
              GP
            </div>
            <span className="text-xl font-semibold tracking-tight">GlobalPrep</span>
          </div>
          
          {isAuthenticated ? (
            <Button 
              variant="outline" 
              className="border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 text-white"
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </Button>
          ) : (
            <Button 
              variant="outline" 
              className="border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 text-white"
              onClick={() => setShowAuth(true)}
            >
              Sign In
            </Button>
          )}
        </header>

        {/* Hero Section */}
        <main className="text-center mt-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900/80 border border-zinc-800 rounded-full text-sm text-zinc-400 mb-8">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            AI-Powered TOEFL iBT Practice
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Master Your
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-emerald-400 to-purple-400 bg-clip-text text-transparent">
              English Skills
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Practice with AI-generated exercises tailored to your level.
            <br />
            Track your progress and ace the TOEFL iBT.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Button 
              size="lg"
              className="h-14 px-8 text-lg bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-lg shadow-blue-500/25"
              onClick={() => setShowAuth(true)}
            >
              Start Practicing Free
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="h-14 px-8 text-lg border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 text-white"
              onClick={() => navigate('/practice/text-completion')}
            >
              Try Demo
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 text-left">
            {/* Feature 1 */}
            <div className="group p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Complete the Words</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Fill in missing letters based on context. AI adapts to your skill level.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-emerald-600/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Build a Sentence</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Arrange words in correct order. Coming soon with grammar insights.
              </p>
              <span className="inline-block mt-2 px-2 py-1 bg-zinc-800 text-zinc-500 text-xs rounded">Coming Soon</span>
            </div>

            {/* Feature 3 */}
            <div className="group p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Track Progress</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Personalized analytics show your strengths and areas to improve.
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-32 text-center text-zinc-600 text-sm">
          <p>© 2025 GlobalPrep. Built for learners worldwide.</p>
        </footer>
      </div>

      {/* Auth Modal */}
      {showAuth && (
        <AuthModal 
          isOpen={showAuth} 
          onClose={() => setShowAuth(false)} 
          onSuccess={handleAuthSuccess}
          darkMode={true}
        />
      )}
    </div>
  );
}

