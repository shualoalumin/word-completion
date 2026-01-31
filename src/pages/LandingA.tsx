/**
 * Version A: "Authority & Trust"
 *
 * Concept: Light background, data-heavy, institutional credibility.
 * Inspired by: TestGlider's authority + Stripe's clarity.
 * Tone: "We have the data. We have the system. Trust the numbers."
 *
 * - White/slate background (opposite of current dark)
 * - Navy/indigo primary color
 * - Big stat numbers, score transformation visuals
 * - Serif headline for academic authority
 * - Minimal decoration, max information density
 */
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AuthModal } from '@/features/auth/components/AuthModal';
import { trackCTAClick, trackDemoStart } from '@/core/utils/analytics';

export default function LandingA() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);

  const handleAuthSuccess = useCallback(() => {
    setShowAuth(false);
    setTimeout(() => navigate('/dashboard', { replace: true }), 100);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 antialiased">

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center text-white text-[10px] font-bold">GP</div>
            <span className="text-sm font-semibold text-slate-800">GlobalPrep</span>
          </div>
          <div className="flex items-center gap-3">
            {!isAuthenticated && (
              <button onClick={() => setShowAuth(true)} className="text-sm text-slate-500 hover:text-slate-800 transition-colors">
                Sign in
              </button>
            )}
            <button
              onClick={() => { trackCTAClick('primary'); navigate(isAuthenticated ? '/dashboard' : '/practice/text-completion'); }}
              className="h-9 px-4 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Start Free Practice
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold mb-8 tracking-wide">
          TOEFL iBT 2026 &middot; NEW FORMAT
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
          The section that quietly
          <br />
          <span className="text-indigo-600">lowers your score</span>
        </h1>

        <p className="text-lg text-slate-500 max-w-xl mx-auto mb-10 leading-relaxed">
          Complete the Words looks simple. But each blank is weighted like a full reading question.
          A single typo cost a 6/6 scorer half a point.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
          <button
            onClick={() => { trackCTAClick('demo'); trackDemoStart(); navigate('/practice/text-completion'); }}
            className="h-12 px-8 text-[15px] font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-all"
          >
            Try a Free Session
          </button>
          <button
            onClick={() => { trackCTAClick('sign_in'); setShowAuth(true); }}
            className="h-12 px-8 text-[15px] font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all"
          >
            Sign In to Track Progress
          </button>
        </div>
        <p className="text-xs text-slate-400">No sign-up required &middot; Unlimited practice &middot; Free</p>
      </section>

      {/* Score Impact Visual */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 sm:p-10 grid sm:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold text-red-500 mb-2">5.5</div>
              <div className="text-sm text-slate-400">Reading score — with typos</div>
            </div>
            <div className="flex items-center justify-center">
              <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
            <div>
              <div className="text-5xl font-bold text-emerald-600 mb-2">6/6</div>
              <div className="text-sm text-slate-400">Reading score — with a system</div>
            </div>
          </div>
          <div className="px-8 sm:px-10 py-4 bg-slate-50 border-t border-slate-100">
            <p className="text-sm text-slate-500 text-center italic">
              "A single typo in this section kept my Reading at 5.5 / 6 instead of 6 / 6."
              <span className="not-italic text-slate-400"> — 6/6 scorer &amp; TOEFL tutor, r/ToeflAdvice</span>
            </p>
          </div>
        </div>
      </section>

      {/* 3 Problems */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400 text-center mb-3">Why it happens</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center tracking-tight mb-14">
            Three reasons high scorers still fail
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                num: '01',
                title: '1 Blank = 1 Full Question',
                quote: 'Each small blank seems to be weighted like a full question, similar in impact to a hard academic reading question.',
                source: '6/6 scorer',
                color: 'text-red-500',
              },
              {
                num: '02',
                title: 'No Systematic Method',
                quote: "Advanced learners 'feel' what word is right, but don't have a clear method to generate possible answers.",
                source: 'TOEFL tutor',
                color: 'text-amber-500',
              },
              {
                num: '03',
                title: 'Typos Are Fatal',
                quote: "One missing letter turns a correct idea into a wrong answer. Your brain 'sees' the correct word and simply skips over the mistake.",
                source: 'r/ToeflAdvice',
                color: 'text-orange-500',
              },
            ].map((item) => (
              <div key={item.num}>
                <span className={`text-4xl font-black ${item.color} opacity-30`}>{item.num}</span>
                <h3 className="text-lg font-semibold mt-2 mb-3">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed italic">"{item.quote}"</p>
                <p className="text-xs text-slate-400 mt-2">— {item.source}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400 text-center mb-3">How GlobalPrep helps</p>
        <h2 className="text-2xl sm:text-3xl font-bold text-center tracking-tight mb-14">
          A system that targets every failure point
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { title: 'Complete the Words', desc: 'AI-generated ETS-style passages. 10 blanks, 3 difficulty levels.', accent: 'bg-indigo-500' },
            { title: 'Smart Vocabulary', desc: 'Save words, review with flashcards and SM-2 spaced repetition.', accent: 'bg-emerald-500' },
            { title: 'Progress Tracking', desc: 'Scores, streaks, and performance by difficulty.', accent: 'bg-purple-500' },
            { title: 'Build a Sentence', desc: 'Word ordering with grammar insights. Coming soon.', accent: 'bg-slate-300' },
          ].map((f) => (
            <div key={f.title} className="p-6 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-shadow">
              <div className={`w-2 h-2 ${f.accent} rounded-full mb-4`} />
              <h3 className="text-[15px] font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews */}
      <section className="bg-slate-50 border-y border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <h2 className="text-2xl font-bold text-center mb-12">Early Takers' Reviews</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="p-6 bg-white border border-slate-200 rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">6/6</div>
                <div className="text-xs text-slate-400">TOEFL tutor &middot; Jan 2026</div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                "I took the new TOEFL on Jan 21, 2026 and got <strong className="text-emerald-600">6/6 in Reading</strong>.
                Strong students and even some TOEFL teachers I know have still missed some of these.
                This tiny section is <strong>quietly lowering scores</strong>."
              </p>
            </div>
            <div className="p-6 bg-white border border-slate-200 rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div className="text-xs text-slate-400">Test-taker &middot; New format</div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                "In the first task I <strong>spent too long on some blanks</strong>,
                then realized I still had more than 15 exercises left.
                I got <strong className="text-amber-600">anxious and rushed</strong>."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl font-bold mb-4">Start your path to 6/6</h2>
        <p className="text-slate-500 mb-8">Free, no sign-up, unlimited practice.</p>
        <button
          onClick={() => { trackCTAClick('demo'); trackDemoStart(); navigate('/practice/text-completion'); }}
          className="h-12 px-8 text-[15px] font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-sm shadow-indigo-600/20"
        >
          Start a Free Session
        </button>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-xs text-slate-400">
        &copy; 2026 GlobalPrep
      </footer>

      {showAuth && <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} onSuccess={handleAuthSuccess} />}
    </div>
  );
}
