import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AuthModal } from '@/features/auth/components/AuthModal';
import { Button } from '@/components/ui/button';
import { trackCTAClick, trackDemoStart } from '@/core/utils/analytics';

export default function Landing() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);

  // Hero demo card state (same logic as Landing C)
  const [showModal, setShowModal] = useState(false);
  const [demoChars, setDemoChars] = useState<string[]>(Array(8).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const demoAnswer = 'ynthesis';
  const demoInput = demoChars.join('');
  const demoCorrect = demoInput.toLowerCase() === demoAnswer.toLowerCase();
  const demoAttempted = demoInput.length >= 5;

  const handleAuthSuccess = useCallback(() => {
    setShowAuth(false);
    setTimeout(() => {
      navigate('/dashboard', { replace: true });
    }, 100);
  }, [navigate]);

  const handleDemoCharInput = (index: number, char: string) => {
    const newChars = [...demoChars];
    newChars[index] = char;
    setDemoChars(newChars);
    if (char && index < 7) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleDemoKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setShowModal(true);
      trackCTAClick('demo');
      return;
    }
    if (e.key === 'Backspace' && !demoChars[index] && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 7) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleModalConfirm = () => {
    setShowModal(false);
    trackCTAClick('demo');
    trackDemoStart();
    navigate('/practice/text-completion');
  };

  const handleTryDemo = () => {
    trackCTAClick('demo');
    trackDemoStart();
    navigate('/practice/text-completion');
  };

  const handleSignIn = () => {
    trackCTAClick('sign_in');
    setShowAuth(true);
  };

  const handlePrimaryCTA = () => {
    trackCTAClick('primary');
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/practice/text-completion');
    }
  };

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
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl" />
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
        <header className="flex items-center justify-between mb-16">
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
              onClick={handleSignIn}
            >
              Sign In
            </Button>
          )}
        </header>

        {/* ────────────────────────────────────────────── */}
        {/* Hero Section */}
        {/* ────────────────────────────────────────────── */}
        <main>
          <section className="text-center mt-12 mb-24">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900/80 border border-zinc-800 rounded-full text-sm text-zinc-400 mb-8">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              TOEFL iBT 2026 New Format
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
              Stop Losing Points on
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-emerald-400 to-purple-400 bg-clip-text text-transparent">
                Complete the Words
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
              Each blank counts as much as a full reading question.
              <br className="hidden sm:block" />
              Most test-takers lose points here — not because they don't know the word,
              but because they lack a system.
            </p>

            {/* Hero demo card — same as Landing C (photosynthesis fill-in-the-blank) */}
            <div className="max-w-xl mx-auto mb-12 p-6 sm:p-8 bg-zinc-900/80 border border-zinc-700 rounded-3xl shadow-xl shadow-black/20">
              <p className="text-xs font-medium text-zinc-400 mb-4">
                Fill in the missing letters in the paragraph.
              </p>
              <p className="text-[15px] leading-relaxed mb-5 text-zinc-300">
                The process of <span className="text-emerald-400 font-semibold">photosynthesis</span> converts light energy into chemical
                compounds. During this process, the{' '}
                <span className="inline-flex items-baseline gap-[1px]">
                  <span className="text-zinc-200">s</span>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <input
                      key={i}
                      ref={(el) => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="text"
                      maxLength={1}
                      value={demoChars[i]}
                      onChange={(e) => {
                        const char = e.target.value.slice(-1);
                        if (!char || /^[a-zA-Z]$/.test(char)) {
                          handleDemoCharInput(i, char);
                        }
                      }}
                      onKeyDown={(e) => handleDemoKeyDown(i, e)}
                      className={`w-[11px] h-[20px] text-center text-[17px] border-b-2 bg-transparent outline-none p-0 leading-tight caret-emerald-500 transition-colors ${
                        demoAttempted
                          ? demoCorrect
                            ? 'border-emerald-500 text-emerald-400'
                            : 'border-red-400 text-red-400'
                          : 'border-zinc-500 text-zinc-200 focus:border-emerald-500'
                      }`}
                      style={{ fontFamily: "'Arial Narrow', 'Helvetica Condensed', Arial, sans-serif" }}
                    />
                  ))}
                </span>{' '}
                of organic molecules provides essential nutrients.
              </p>
              {demoAttempted && (
                <div className={`text-sm rounded-xl px-4 py-3 mb-3 ${demoCorrect ? 'bg-emerald-900/30 text-emerald-300' : 'bg-red-900/30 text-red-300'}`}>
                  {demoCorrect
                    ? "Correct! That's how it feels to nail it under pressure."
                    : 'Not quite — the answer is "synthesis". One letter off = zero credit on the real test.'}
                </div>
              )}
              <p className="text-xs text-zinc-500">
                {demoAttempted ? 'Press Enter to continue.' : 'Type the missing letters and press Enter.'}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Button
                size="lg"
                className="h-14 px-8 text-lg bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-lg shadow-blue-500/25"
                onClick={handlePrimaryCTA}
              >
                Practice Free — No Sign-up
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
              {!isAuthenticated && (
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 text-lg border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 text-white"
                  onClick={handleSignIn}
                >
                  Sign In to Track Progress
                </Button>
              )}
            </div>
            <p className="text-sm text-zinc-500">
              55+ AI-generated exercises ready to go
            </p>
          </section>

          {/* ────────────────────────────────────────────── */}
          {/* Problem Section — "Why This Matters" */}
          {/* ────────────────────────────────────────────── */}
          <section className="mb-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
              Why High Scorers Still Fail This Section
            </h2>
            <p className="text-zinc-400 text-center max-w-xl mx-auto mb-12">
              Based on real test-taker experiences shared on Reddit and TOEFL communities
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Problem 1 */}
              <div className="p-6 bg-zinc-900/50 border border-red-900/30 rounded-2xl">
                <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-red-400 text-xl font-bold">=</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">1 Blank = 1 Full Question</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Each blank in Complete the Words is scored with the same weight
                  as a full reading comprehension question. Miss a few blanks and
                  your score drops fast.
                </p>
              </div>

              {/* Problem 2 */}
              <div className="p-6 bg-zinc-900/50 border border-amber-900/30 rounded-2xl">
                <div className="w-12 h-12 bg-amber-600/20 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">No Strategy = Guessing</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Even advanced learners rely on intuition. When an unfamiliar word shows up,
                  they have no systematic method to generate candidates — and just guess.
                </p>
              </div>

              {/* Problem 3 */}
              <div className="p-6 bg-zinc-900/50 border border-orange-900/30 rounded-2xl">
                <div className="w-12 h-12 bg-orange-600/20 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">One Typo = Zero Points</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  You know the word. You just can't spell it under pressure.
                  One wrong letter means zero credit — the most frustrating way to lose points.
                </p>
              </div>
            </div>
          </section>

          {/* ────────────────────────────────────────────── */}
          {/* Solution Section — "How GlobalPrep Helps" */}
          {/* ────────────────────────────────────────────── */}
          <section className="mb-24">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
              Train With a System, Not Just Repetition
            </h2>
            <p className="text-zinc-400 text-center max-w-xl mx-auto mb-12">
              Every feature is designed to address the exact reasons test-takers fail Complete the Words
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
              {/* Feature 1 */}
              <div className="group p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-blue-800/50 transition-all hover:-translate-y-1">
                <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Complete the Words</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  AI-generated ETS-style passages with 10 blanks each.
                  Three difficulty levels adapt to your skill.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="group p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-emerald-800/50 transition-all hover:-translate-y-1">
                <div className="w-12 h-12 bg-emerald-600/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Smart Vocabulary</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Save words from exercises to your personal word list.
                  Review with flashcards, fill-in-blank, and multiple choice.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="group p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-purple-800/50 transition-all hover:-translate-y-1">
                <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Progress Tracking</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  See your scores, streaks, and performance by difficulty.
                  Know exactly where you need more practice.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="group p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-all hover:-translate-y-1">
                <div className="w-12 h-12 bg-zinc-700/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Build a Sentence</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Arrange words in the correct order with grammar insights.
                </p>
                <span className="inline-block mt-2 px-2 py-1 bg-zinc-800 text-zinc-500 text-xs rounded">Coming Soon</span>
              </div>
            </div>
          </section>

          {/* ────────────────────────────────────────────── */}
          {/* Social Proof / Credibility */}
          {/* ────────────────────────────────────────────── */}
          <section className="mb-24">
            <div className="max-w-3xl mx-auto p-8 bg-zinc-900/30 border border-zinc-800 rounded-2xl text-center">
              <p className="text-zinc-300 text-lg leading-relaxed italic mb-4">
                "The Complete the Words section is short, but each blank carries the weight
                of a full reading question. Even strong test-takers and tutors lose points here."
              </p>
              <p className="text-zinc-500 text-sm">
                — Insight from TOEFL community discussions on r/ToefliBT
              </p>
            </div>
          </section>

          {/* ────────────────────────────────────────────── */}
          {/* Bottom CTA */}
          {/* ────────────────────────────────────────────── */}
          <section className="text-center mb-24">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Ready to stop guessing?
            </h2>
            <p className="text-zinc-400 max-w-lg mx-auto mb-8">
              Try a free session now. No account needed — just start practicing
              and see why this section matters more than you think.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="h-14 px-8 text-lg bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 shadow-lg shadow-blue-500/25"
                onClick={handleTryDemo}
              >
                Start a Free Session
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
              {!isAuthenticated && (
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 text-lg border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 text-white"
                  onClick={handleSignIn}
                >
                  Sign In to Save Progress
                </Button>
              )}
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="text-center text-zinc-600 text-sm pb-8">
          <p>&copy; 2026 GlobalPrep. Built for learners worldwide.</p>
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

      {/* Demo Completion Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Nice work!</h3>
              <p className="text-zinc-400">
                Ready to practice with full passages? Try a complete exercise now.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 text-white"
                onClick={() => setShowModal(false)}
              >
                Maybe Later
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700"
                onClick={handleModalConfirm}
              >
                I got it!
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
