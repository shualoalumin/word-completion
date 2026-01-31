/**
 * Version C: "Warm & Interactive"
 *
 * Concept: Duolingo warmth + Notion clarity. Approachable, non-intimidating.
 * Tone: "Learning should feel good. Let's practice together."
 *
 * - Cream/warm white background
 * - Rounded shapes, soft shadows
 * - Teal/green primary (encouraging, not corporate)
 * - Interactive exercise mini-demo in hero
 * - Illustrated-feel iconography
 * - Friendly, conversational copy
 */
import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AuthModal } from '@/features/auth/components/AuthModal';
import { DarkModeToggle } from '@/components/common';
import { useDarkMode } from '@/core/hooks';
import { cn } from '@/lib/utils';
import { trackCTAClick, trackDemoStart } from '@/core/utils/analytics';

export default function LandingC() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { darkMode, toggle: toggleDarkMode } = useDarkMode();
  const [showAuth, setShowAuth] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [demoChars, setDemoChars] = useState<string[]>(Array(8).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const demoAnswer = 'ynthesis';
  const demoInput = demoChars.join('');
  const demoCorrect = demoInput.toLowerCase() === demoAnswer.toLowerCase();
  const demoAttempted = demoInput.length >= 5;

  const handleAuthSuccess = useCallback(() => {
    setShowAuth(false);
    setTimeout(() => navigate('/dashboard', { replace: true }), 100);
  }, [navigate]);

  const handleDemoCharInput = (index: number, char: string) => {
    const newChars = [...demoChars];
    newChars[index] = char;
    setDemoChars(newChars);
    if (char && index < 7) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleDemoKeyDown = (index: number, e: React.KeyboardEvent) => {
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
    trackDemoStart();
    navigate('/practice/text-completion');
  };

  return (
    <div
      className={cn(
        'min-h-screen font-[Inter,system-ui,sans-serif]',
        darkMode ? 'bg-zinc-950 text-zinc-100' : 'text-slate-800'
      )}
      style={darkMode ? undefined : { background: '#FEFCF9' }}
    >

      {/* Nav */}
      <nav
        className={cn(
          'sticky top-0 z-50 backdrop-blur-lg border-b',
          darkMode ? 'bg-zinc-950/90 border-zinc-800' : 'bg-[#FEFCF9]/80 border-amber-100/60'
        )}
      >
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-500 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-teal-500/30">
              GP
            </div>
            <span className={cn('text-sm font-bold', darkMode ? 'text-zinc-200' : 'text-slate-700')}>GlobalPrep</span>
          </div>
          <div className="flex items-center gap-3">
            <DarkModeToggle darkMode={darkMode} onToggle={toggleDarkMode} />
            {!isAuthenticated && (
              <button
                onClick={() => { trackCTAClick('sign_in'); setShowAuth(true); }}
                className={cn('text-sm transition-colors', darkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-400 hover:text-slate-700')}
              >
                Sign in
              </button>
            )}
            <button
              onClick={() => { trackCTAClick('primary'); navigate(isAuthenticated ? '/dashboard' : '/practice/text-completion'); }}
              className="h-9 px-4 text-sm font-semibold bg-teal-500 text-white rounded-xl hover:bg-teal-600 shadow-sm shadow-teal-500/20 transition-all"
            >
              Start Practicing
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-12">
        {/* Badge */}
        <div className="text-center mb-8">
          <div className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold',
            darkMode ? 'bg-teal-900/40 text-teal-300' : 'bg-teal-50 text-teal-700'
          )}>
            <span className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
            TOEFL 2026 New Format
          </div>
        </div>

        {/* Headline — centered */}
        <h1 className={cn(
          'text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1] mb-8 text-center',
          darkMode ? 'text-white' : 'text-slate-800'
        )}>
          The first section that trips you up?
          <br />
          <span className="text-teal-500">Nail it before test day.</span>
        </h1>

        {/* Interactive card — front and center */}
        <div className={cn(
          'max-w-xl mx-auto mb-10 rounded-3xl shadow-xl p-6 sm:p-8 border',
          darkMode ? 'bg-zinc-900/80 border-zinc-700 shadow-black/20' : 'bg-white border-amber-100 shadow-amber-900/[0.04]'
        )}>
          <p className={cn('text-xs font-medium mb-4', darkMode ? 'text-zinc-400' : 'text-slate-500')}>Fill in the missing letters in the paragraph.</p>

          <p className={cn('text-[15px] leading-relaxed mb-5', darkMode ? 'text-zinc-300' : 'text-slate-600')}>
            The process of <span className="text-teal-500 font-semibold">photosynthesis</span> converts light energy into chemical
            compounds. During this process, the{' '}
            <span className="inline-flex items-baseline gap-[1px]">
              <span className={darkMode ? 'text-zinc-200' : 'text-slate-700'}>s</span>
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
                  className={cn(
                    'w-[11px] h-[20px] text-center text-[17px] border-b-2 bg-transparent outline-none p-0 leading-tight caret-teal-500 transition-colors',
                    demoAttempted
                      ? demoCorrect
                        ? 'border-emerald-500 text-emerald-400'
                        : 'border-red-400 text-red-400'
                      : darkMode ? 'border-zinc-500 text-zinc-200 focus:border-teal-500' : 'border-slate-300 text-slate-700 focus:border-teal-500'
                  )}
                  style={{ fontFamily: "'Arial Narrow', 'Helvetica Condensed', Arial, sans-serif" }}
                />
              ))}
            </span>{' '}
            of organic molecules provides essential nutrients.
          </p>

          {demoAttempted && (
            <div className={cn(
              'text-sm rounded-xl px-4 py-3 mb-3',
              demoCorrect ? (darkMode ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-50 text-emerald-700') : (darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-600')
            )}>
              {demoCorrect
                ? 'Correct! That\'s how it feels to nail it under pressure.'
                : 'Not quite — the answer is "synthesis". One letter off = zero credit on the real test.'}
            </div>
          )}

          <p className={cn('text-xs', darkMode ? 'text-zinc-500' : 'text-slate-400')}>
            {demoAttempted ? 'Press Enter to continue.' : 'Type the missing letters and press Enter.'}
          </p>
        </div>

        {/* Explanation line */}
        <p className={cn('text-center text-lg leading-relaxed max-w-lg mx-auto mb-6', darkMode ? 'text-zinc-400' : 'text-slate-500')}>
          Complete the Words looks easy
          <br />
          <span className={cn('font-semibold', darkMode ? 'text-zinc-200' : 'text-slate-700')}>
            Until a single typo drops your score!
          </span>
        </p>

        {/* Did you know + Reddit quote */}
        <div className="max-w-2xl mx-auto text-center mb-8">
          <p className={cn('text-lg font-semibold mb-4 whitespace-normal', darkMode ? 'text-zinc-200' : 'text-slate-700')}>
            Did you know each blank counts
            <br className="sm:hidden" />
            as much as a full reading question?
          </p>
          <div className={cn(
            'inline-block w-full max-w-2xl text-center px-5 py-4 rounded-2xl border',
            darkMode ? 'bg-zinc-800/50 border-zinc-700' : 'bg-slate-50 border-slate-200'
          )}>
            <p className={cn('text-sm italic leading-relaxed', darkMode ? 'text-zinc-400' : 'text-slate-500')}>
              "A <span className="text-red-400 font-semibold not-italic">single typo</span> in this section kept my Reading at{' '}
              <span className="text-red-400 font-semibold not-italic">5.5 / 6 instead of 6 / 6</span>."
            </p>
            <p className={cn('text-xs mt-2 text-center', darkMode ? 'text-zinc-500' : 'text-slate-400')}>
              6/6 scorer &amp; TOEFL tutor &middot; r/ToeflAdvice
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
          <button
            onClick={() => { trackCTAClick('demo'); trackDemoStart(); navigate('/practice/text-completion'); }}
            className="h-12 px-8 text-[15px] font-semibold bg-teal-500 text-white rounded-2xl hover:bg-teal-600 shadow-md shadow-teal-500/20 transition-all active:scale-[0.98]"
          >
            Start Free Practice
          </button>
        </div>
      </section>

      {/* Stats pills */}
      <div className="max-w-3xl mx-auto px-6 pb-16">
        <div className="flex flex-wrap justify-center gap-3">
          {[
            { label: '55+ exercises', icon: '&#9998;' },
            { label: '3 difficulty levels', icon: '&#9650;' },
            { label: 'SM-2 spaced repetition', icon: '&#8635;' },
            { label: 'Free forever', icon: '&#10003;' },
          ].map((s) => (
            <div
              key={s.label}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full text-sm shadow-sm',
                darkMode ? 'bg-zinc-800/80 border border-zinc-700 text-zinc-300' : 'bg-white border border-amber-100 text-slate-600'
              )}
            >
              <span className="text-teal-500" dangerouslySetInnerHTML={{ __html: s.icon }} />
              {s.label}
            </div>
          ))}
        </div>
      </div>

      {/* Problems as conversation */}
      <section className={cn('border-y', darkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-amber-100')}>
        <div className="max-w-4xl mx-auto px-6 py-20">
          <h2 className={cn('text-2xl font-bold text-center mb-3', darkMode ? 'text-white' : 'text-slate-800')}>Why do people keep losing points here?</h2>
          <p className={cn('text-sm text-center mb-12', darkMode ? 'text-zinc-500' : 'text-slate-400')}>Real stories from r/ToeflAdvice</p>

          <div className="space-y-4 max-w-2xl mx-auto">
            {[
              { q: 'How much does one blank cost?', a: '"Each small blank seems to be weighted like a full question." — 6/6 scorer' },
              { q: 'What if I know the word but misspell it?', a: '"One missing letter turns a correct idea into a wrong answer." — r/ToeflAdvice' },
              { q: 'Can strong test-takers fail this?', a: '"Strong students and even some TOEFL teachers I know have still missed some of these." — 6/6 scorer' },
              { q: 'What happens under time pressure?', a: '"I spent too long on some blanks, then realized I had 15+ exercises left. I got anxious and rushed." — Real test-taker' },
            ].map((item, i) => (
              <div key={i} className={cn('rounded-2xl border overflow-hidden', darkMode ? 'border-zinc-700' : 'border-amber-100')}>
                <div className={cn('px-5 py-3 text-sm font-semibold', darkMode ? 'bg-zinc-800/50 text-zinc-200' : 'bg-amber-50/50 text-slate-700')}>{item.q}</div>
                <div className={cn('px-5 py-3 text-sm italic', darkMode ? 'text-zinc-400' : 'text-slate-500')}>{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className={cn('text-2xl font-bold text-center mb-12', darkMode ? 'text-white' : 'text-slate-800')}>What you get</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { title: 'Complete the Words', desc: 'AI passages with 10 blanks. Easy, medium, hard.', emoji: '\u270F\uFE0F', bg: darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-100', text: darkMode ? 'text-zinc-300' : 'text-slate-500' },
            { title: 'Smart Vocabulary', desc: 'Save words. Flashcards + fill-in-blank review.', emoji: '\uD83D\uDCD6', bg: darkMode ? 'bg-emerald-900/20 border-emerald-800' : 'bg-emerald-50 border-emerald-100', text: darkMode ? 'text-zinc-300' : 'text-slate-500' },
            { title: 'Progress Tracking', desc: 'Streaks, scores, difficulty breakdown.', emoji: '\uD83D\uDCC8', bg: darkMode ? 'bg-purple-900/20 border-purple-800' : 'bg-purple-50 border-purple-100', text: darkMode ? 'text-zinc-300' : 'text-slate-500' },
            { title: 'Visual Timer Guidance', desc: 'Smart progress bar. Easy: 1min, Medium: 1.5min, Hard: 2min.', emoji: '\u23F1\uFE0F', bg: darkMode ? 'bg-rose-900/20 border-rose-800' : 'bg-rose-50 border-rose-100', text: darkMode ? 'text-zinc-300' : 'text-slate-500' },
          ].map((f) => (
            <div key={f.title} className={cn('p-5 rounded-2xl border', f.bg)}>
              <span className="text-2xl mb-3 block">{f.emoji}</span>
              <h3 className={cn('text-[15px] font-semibold mb-1', darkMode ? 'text-zinc-100' : 'text-slate-800')}>{f.title}</h3>
              <p className={cn('text-sm', f.text)}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Strategy Callout */}
      <section className="max-w-3xl mx-auto px-6 py-12">
        <div className={cn(
          'px-6 py-6 rounded-3xl border',
          darkMode ? 'border-teal-800 bg-teal-900/30' : 'border-teal-200 bg-teal-50'
        )}>
          <div className="flex items-start gap-4">
            <div className={cn('shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center mt-1', darkMode ? 'bg-teal-800' : 'bg-teal-100')}>
              <span className="text-2xl">⚡</span>
            </div>
            <div>
              <h3 className={cn('text-base font-bold mb-2', darkMode ? 'text-teal-200' : 'text-teal-900')}>Winning Strategy</h3>
              <p className={cn('text-sm leading-relaxed mb-2', darkMode ? 'text-zinc-300' : 'text-slate-600')}>
                Complete the Words <span className={cn('font-semibold', darkMode ? 'text-zinc-100' : 'text-slate-800')}>fast &amp; accurate</span> =
                More time for harder reading questions
              </p>
              <p className={cn('text-xs', darkMode ? 'text-zinc-500' : 'text-slate-500')}>
                The TOEFL Reading module is 10-12 minutes total. Master this section to maximize time for everything else.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className={cn('text-3xl font-bold mb-4', darkMode ? 'text-white' : 'text-slate-800')}>Ready to stop guessing?</h2>
        <p className={cn('mb-8', darkMode ? 'text-zinc-400' : 'text-slate-500')}>One free session is all it takes to see why this section matters.</p>
        <button
          onClick={() => { trackCTAClick('demo'); trackDemoStart(); navigate('/practice/text-completion'); }}
          className="h-12 px-8 text-[15px] font-semibold bg-teal-500 text-white rounded-2xl hover:bg-teal-600 shadow-md shadow-teal-500/20 active:scale-[0.98] transition-all"
        >
          Start Free Practice
        </button>
      </section>

      <footer className={cn('border-t py-8 text-center text-xs', darkMode ? 'border-zinc-800 text-zinc-500' : 'border-amber-100 text-slate-400')}>
        &copy; 2026 GlobalPrep
      </footer>

      {showAuth && <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} onSuccess={handleAuthSuccess} darkMode={darkMode} />}

      {/* Demo Conversion Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={cn(
            'relative max-w-md mx-4 p-8 rounded-3xl border shadow-2xl animate-in zoom-in-95 duration-200',
            darkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-amber-100'
          )}>
            <div className="text-center">
              <div className={cn('w-14 h-14 mx-auto mb-5 rounded-full flex items-center justify-center', darkMode ? 'bg-teal-900/40' : 'bg-teal-50')}>
                <svg className="w-7 h-7 text-teal-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className={cn('text-xl font-bold mb-3', darkMode ? 'text-white' : 'text-slate-800')}>Ready to crack the ETS algorithm?</h3>
              <p className={cn('text-sm mb-8', darkMode ? 'text-zinc-400' : 'text-slate-500')}>
                Get unlimited practice with 55+ exercises. Free, no sign-up required.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className={cn(
                    'flex-1 h-11 px-4 text-sm font-medium rounded-xl transition-colors border',
                    darkMode ? 'text-zinc-300 hover:text-white border-zinc-600 hover:border-zinc-500' : 'text-slate-600 hover:text-slate-800 border-slate-200 hover:border-slate-300'
                  )}
                >
                  Maybe later
                </button>
                <button
                  onClick={handleModalConfirm}
                  className="flex-1 h-11 px-4 text-sm font-semibold bg-teal-500 text-white hover:bg-teal-600 rounded-xl transition-colors shadow-lg shadow-teal-500/20"
                >
                  Let's practice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
