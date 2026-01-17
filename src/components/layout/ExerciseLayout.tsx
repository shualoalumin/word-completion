import React from 'react';
import { Check, RotateCcw, User, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Timer, DarkModeToggle, ScoreCard } from '@/components/common';
import { UseTimerReturn } from '@/core/hooks';
import { Difficulty } from '@/core/types/exercise';
import { cn } from '@/lib/utils';
import { useAuth, AuthModal, UserMenu } from '@/features/auth';

export interface ExerciseLayoutProps {
  children: React.ReactNode;
  timer: UseTimerReturn;
  darkMode: boolean;
  onDarkModeToggle: () => void;
  title: string;
  subtitle?: string;
  difficulty?: Difficulty;
  topicCategory?: string;
  showResults: boolean;
  onCheckAnswers: () => void;
  onNextExercise: () => void;
  score?: number;
  totalQuestions?: number;
  renderResults?: () => React.ReactNode;
  className?: string;
}

const DIFFICULTY_CONFIG = {
  easy: { label: 'Easy', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  intermediate: { label: 'Medium', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  hard: { label: 'Hard', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export const ExerciseLayout: React.FC<ExerciseLayoutProps> = ({
  children,
  timer,
  darkMode,
  onDarkModeToggle,
  title,
  subtitle,
  difficulty,
  topicCategory,
  showResults,
  onCheckAnswers,
  onNextExercise,
  score = 0,
  totalQuestions = 10,
  renderResults,
  className,
}) => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const navigate = useNavigate();

  const difficultyConfig = difficulty ? DIFFICULTY_CONFIG[difficulty] : null;

  return (
    <div
      className={cn(
        'min-h-screen transition-colors duration-300',
        darkMode ? 'bg-zinc-950 text-gray-100' : 'bg-gray-50 text-gray-900',
        className
      )}
    >
      {/* Fixed Header - Khan Academy Style */}
      <header className={cn(
        'sticky top-0 z-40 border-b backdrop-blur-sm',
        darkMode ? 'bg-zinc-950/90 border-zinc-800' : 'bg-white/90 border-gray-200'
      )}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            {/* Left: Navigation + Logo */}
            <div className="flex items-center gap-3">
              {isAuthenticated && (
                <button
                  onClick={() => navigate('/dashboard')}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors text-sm',
                    darkMode 
                      ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' 
                      : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
                  )}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </button>
              )}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center font-bold text-sm text-white">
                  GP
                </div>
                <span className={cn(
                  "text-lg font-semibold tracking-tight hidden sm:block",
                  darkMode ? "text-white" : "text-gray-900"
                )}>
                  GlobalPrep
                </span>
              </div>
            </div>

            {/* Center: Metadata badges */}
            <div className="flex items-center gap-2">
              {difficultyConfig && (
                <span className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded-full border',
                  difficultyConfig.color
                )}>
                  {difficultyConfig.label}
                </span>
              )}
              {topicCategory && (
                <span className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded-full border hidden md:block',
                  darkMode 
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    : 'bg-blue-50 text-blue-600 border-blue-200'
                )}>
                  {topicCategory}
                </span>
              )}
            </div>
            
            {/* Right: Timer + Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Timer
                remaining={timer.remaining}
                overtime={timer.overtime}
                isOvertime={timer.isOvertime}
                darkMode={darkMode}
              />
              <DarkModeToggle darkMode={darkMode} onToggle={onDarkModeToggle} />
              
              {!authLoading && (
                isAuthenticated && user ? (
                  <UserMenu user={user} onSignOut={() => {}} darkMode={darkMode} />
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className={cn(
                      'p-2 rounded-full transition-colors',
                      darkMode 
                        ? 'hover:bg-zinc-700 text-zinc-400 hover:text-white' 
                        : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
                    )}
                    title="Sign in"
                  >
                    <User className="w-5 h-5" />
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
        darkMode={darkMode}
      />

      {/* Main Content - Full width responsive */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Title & Subtitle */}
        <div className="mb-4">
          <h1 className={cn(
            'text-lg font-bold',
            darkMode ? 'text-gray-100' : 'text-gray-900'
          )}>
            {title}
          </h1>
          {subtitle && (
            <p className={cn(
              'text-sm',
              darkMode ? 'text-zinc-400' : 'text-gray-600'
            )}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Exercise Content */}
        <div className={cn(
          'rounded-xl border p-4 sm:p-6',
          darkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-gray-200'
        )}>
          {children}
        </div>

        {/* Action Button */}
        <div className="mt-4 flex items-center gap-4">
          {!showResults ? (
            <button
              onClick={onCheckAnswers}
              className={cn(
                'px-5 py-2.5 text-sm font-semibold transition-colors rounded-lg flex items-center gap-2',
                'bg-blue-600 text-white hover:bg-blue-700'
              )}
            >
              <Check className="w-4 h-4" /> Check Answers
            </button>
          ) : (
            <button
              onClick={onNextExercise}
              className={cn(
                'px-5 py-2.5 text-sm font-semibold transition-colors rounded-lg flex items-center gap-2',
                'bg-blue-600 text-white hover:bg-blue-700'
              )}
            >
              <RotateCcw className="w-4 h-4" /> Next Passage
            </button>
          )}
        </div>

        {/* Results Section - Compact */}
        {showResults && (
          <div className="mt-6 space-y-4">
            {renderResults?.()}
          </div>
        )}
      </main>
    </div>
  );
};
