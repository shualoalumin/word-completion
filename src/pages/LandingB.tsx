/**
 * Version B: "Ultra-minimal Dark"
 *
 * Concept: Linear.app / Vercel — monochrome, surgical precision.
 * Tone: "No noise. Just the tool."
 *
 * - Pure black bg (#000)
 * - Only white + one accent (blue-500)
 * - Monospace for data, sans-serif for copy
 * - Terminal/code-inspired exercise preview
 * - Extreme whitespace, nothing unnecessary
 * - No gradients, no glow, no decoration
 */
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AuthModal } from '@/features/auth/components/AuthModal';
import { trackCTAClick, trackDemoStart } from '@/core/utils/analytics';

export default function LandingB() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);

  const handleAuthSuccess = useCallback(() => {
    setShowAuth(false);
    setTimeout(() => navigate('/dashboard', { replace: true }), 100);
  }, [navigate]);

  const go = () => { trackCTAClick('primary'); navigate(isAuthenticated ? '/dashboard' : '/practice/text-completion'); };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Nav — barely there */}
      <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-sm font-medium tracking-tight text-neutral-300">GlobalPrep</span>
          <div className="flex items-center gap-4">
            {!isAuthenticated && (
              <button onClick={() => { trackCTAClick('sign_in'); setShowAuth(true); }} className="text-xs text-neutral-500 hover:text-white transition-colors">
                Sign in
              </button>
            )}
            <button onClick={go} className="text-xs text-white border border-neutral-800 px-3 py-1.5 rounded-md hover:border-neutral-600 transition-colors">
              Start
            </button>
          </div>
        </div>
      </nav>

      {/* Hero — massive type, nothing else */}
      <section className="max-w-5xl mx-auto px-6 pt-40 pb-24">
        <p className="text-xs text-neutral-600 mb-6 tracking-widest uppercase font-mono">TOEFL iBT 2026</p>

        <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold tracking-[-0.05em] leading-[0.95] mb-0">
          Complete
          <br />
          the Words.
        </h1>

        <div className="mt-10 flex items-start gap-16">
          <div className="max-w-sm">
            <p className="text-neutral-500 text-[15px] leading-relaxed mb-8">
              Each blank is weighted like a full reading question.
              One typo drops a 6/6 to 5.5. We built a system to fix that.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { trackCTAClick('demo'); trackDemoStart(); navigate('/practice/text-completion'); }}
                className="h-10 px-5 text-sm font-medium bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Practice now
              </button>
              <span className="text-xs text-neutral-600">Free &middot; No account</span>
            </div>
          </div>

          {/* Terminal-style preview */}
          <div className="hidden md:block flex-1 max-w-md font-mono text-sm">
            <div className="border border-neutral-900 rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-neutral-950 border-b border-neutral-900 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
                <div className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
                <div className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
                <span className="ml-2 text-[10px] text-neutral-600">exercise.preview</span>
              </div>
              <div className="p-4 text-neutral-500 leading-relaxed">
                <span className="text-neutral-400">The process of</span>{' '}
                <span className="text-blue-400">photo</span>
                <span className="text-neutral-700">_________</span>{' '}
                <span className="text-neutral-400">converts light</span>
                <br />
                <span className="text-neutral-400">energy into</span>{' '}
                <span className="text-blue-400">chem</span>
                <span className="text-neutral-700">____</span>{' '}
                <span className="text-neutral-400">compounds</span>
                <br />
                <span className="text-neutral-400">that sustain life.</span>
                <br /><br />
                <span className="text-neutral-700">{'>'} score: </span>
                <span className="text-emerald-500">8/10</span>
                <span className="text-neutral-700"> &middot; difficulty: </span>
                <span className="text-neutral-400">medium</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider line */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="h-px bg-neutral-900" />
      </div>

      {/* Problems — horizontal, minimal */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <p className="text-xs text-neutral-600 mb-12 tracking-widest uppercase font-mono">Why it matters</p>

        <div className="grid md:grid-cols-3 gap-12">
          {[
            { label: '01', title: '1 blank = 1 question', body: 'Same weight as a full reading comprehension item.' },
            { label: '02', title: 'No method', body: "Learners 'feel' the word but have no system when intuition fails." },
            { label: '03', title: 'Typos kill', body: 'One wrong letter. Zero credit. Your brain skips the mistake.' },
          ].map((p) => (
            <div key={p.label}>
              <span className="text-xs text-neutral-700 font-mono">{p.label}</span>
              <h3 className="text-[15px] font-semibold mt-2 mb-2">{p.title}</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6"><div className="h-px bg-neutral-900" /></div>

      {/* Features — list, not cards */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <p className="text-xs text-neutral-600 mb-12 tracking-widest uppercase font-mono">Features</p>

        <div className="space-y-6">
          {[
            { title: 'Complete the Words', desc: 'ETS-style passages, 10 blanks, 3 levels.', status: 'live' },
            { title: 'Smart Vocabulary', desc: 'Personal word list. Flashcards, SM-2 spaced repetition.', status: 'live' },
            { title: 'Progress Tracking', desc: 'Scores, streaks, difficulty breakdown.', status: 'live' },
            { title: 'Build a Sentence', desc: 'Word ordering with grammar.', status: 'soon' },
          ].map((f) => (
            <div key={f.title} className="flex items-start justify-between py-4 border-b border-neutral-900">
              <div>
                <h3 className="text-[15px] font-medium">{f.title}</h3>
                <p className="text-sm text-neutral-600 mt-1">{f.desc}</p>
              </div>
              <span className={`text-[10px] font-mono uppercase tracking-wider mt-1 ${f.status === 'live' ? 'text-emerald-600' : 'text-neutral-700'}`}>
                {f.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6"><div className="h-px bg-neutral-900" /></div>

      {/* Reviews */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <p className="text-xs text-neutral-600 mb-12 tracking-widest uppercase font-mono">Early takers</p>

        <div className="grid md:grid-cols-2 gap-8">
          <blockquote className="text-sm text-neutral-500 leading-relaxed">
            "I took the new TOEFL and got <span className="text-white">6/6 in Reading</span>.
            Strong students and even TOEFL teachers have missed these.
            This tiny section is <span className="text-white">quietly lowering scores</span>."
            <footer className="mt-3 text-xs text-neutral-700 font-mono">— 6/6 scorer, r/ToeflAdvice</footer>
          </blockquote>
          <blockquote className="text-sm text-neutral-500 leading-relaxed">
            "I <span className="text-white">spent too long on some blanks</span>,
            then realized I had 15+ exercises left.
            I got <span className="text-amber-500">anxious and rushed</span>."
            <footer className="mt-3 text-xs text-neutral-700 font-mono">— test-taker, new format</footer>
          </blockquote>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6"><div className="h-px bg-neutral-900" /></div>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Ready?</h2>
            <p className="text-sm text-neutral-600 mt-1">Free. No sign-up. Start now.</p>
          </div>
          <button
            onClick={() => { trackCTAClick('demo'); trackDemoStart(); navigate('/practice/text-completion'); }}
            className="h-10 px-5 text-sm font-medium bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Practice now
          </button>
        </div>
      </section>

      <footer className="py-8 text-center text-[11px] text-neutral-800 font-mono">
        &copy; 2026 GlobalPrep
      </footer>

      {showAuth && <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} onSuccess={handleAuthSuccess} darkMode />}
    </div>
  );
}
