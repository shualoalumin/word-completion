import React from 'react';
import { Check, RotateCcw, User, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Timer, DarkModeToggle, ScoreCard } from '@/components/common';
import { UseTimerReturn } from '@/core/hooks';
import { Difficulty } from '@/core/types/exercise';
import { cn } from '@/lib/utils';
import { useAuth, AuthModal, UserMenu } from '@/features/auth';

export interface ExerciseLayoutProps {
  // Required
  children: React.ReactNode;
  timer: UseTimerReturn;
  darkMode: boolean;
  onDarkModeToggle: () => void;
  
  // Header
  title: string;
  subtitle?: string;
  
  // Metadata (new)
  difficulty?: Difficulty;
  topicCategory?: string;
  
  // Actions
  showResults: boolean;
  onCheckAnswers: () => void;
  onNextExercise: () => void;
  
  // Results (optional, for when showResults is true)
  score?: number;
  totalQuestions?: number;
  
  // Optional render props for custom sections
  renderResults?: () => React.ReactNode;
  
  className?: string;
}

// Difficulty badge colors and labels
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
        darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
        className
      )}
    >
      {/* Consistent max-w-6xl like Dashboard */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Top bar - consistent with Dashboard header */}
        <div className="flex justify-between items-center mb-8">
          {/* Left side: Back button + Logo */}
          <div className="flex items-center gap-4">
            {isAuthenticated && (
              <button
                onClick={() => navigate('/dashboard')}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm',
                  darkMode 
                    ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
                )}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
            )}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center font-bold text-lg text-white">
                GP
              </div>
              <span className={cn(
                "text-xl font-semibold tracking-tight",
                darkMode ? "text-white" : "text-gray-900"
              )}>
                GlobalPrep
              </span>
            </div>
          </div>
          
          {/* Right side: Timer + Dark Mode + Auth */}
          <div className="flex items-center gap-4">
            <Timer
              remaining={timer.remaining}
              overtime={timer.overtime}
              isOvertime={timer.isOvertime}
              darkMode={darkMode}
            />
            <DarkModeToggle darkMode={darkMode} onToggle={onDarkModeToggle} />
            
            {/* Auth Section */}
            {!authLoading && (
              isAuthenticated && user ? (
                <UserMenu 
                  user={user} 
                  onSignOut={() => {}} 
                  darkMode={darkMode} 
                />
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

        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
          darkMode={darkMode}
        />

        {/* Metadata badges (Difficulty + Topic Category) */}
        {(difficultyConfig || topicCategory) && (
          <div className="flex items-center gap-3 mb-4">
            {difficultyConfig && (
              <span className={cn(
                'px-3 py-1 text-xs font-medium rounded-full border',
                difficultyConfig.color
              )}>
                {difficultyConfig.label}
              </span>
            )}
            {topicCategory && (
              <span className={cn(
                'px-3 py-1 text-xs font-medium rounded-full border',
                darkMode 
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  : 'bg-blue-50 text-blue-600 border-blue-200'
              )}>
                {topicCategory}
              </span>
            )}
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <h1
            className={cn(
              'text-xl font-bold mb-1',
              darkMode ? 'text-gray-100' : 'text-gray-900'
            )}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className={cn(
                'text-lg font-bold',
                darkMode ? 'text-gray-100' : 'text-gray-900'
              )}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Main content */}
        {children}

        {/* Actions */}
        <div className="mt-10 flex items-center gap-4">
          {!showResults ? (
            <button
              onClick={onCheckAnswers}
              className={cn(
                'px-5 py-2 text-sm font-semibold transition-colors rounded flex items-center gap-2',
                darkMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-800 text-white hover:bg-gray-900'
              )}
            >
              <Check className="w-4 h-4" /> Check Answers
            </button>
          ) : (
            <button
              onClick={onNextExercise}
              className={cn(
                'px-5 py-2 text-sm font-semibold transition-colors rounded flex items-center gap-2',
                darkMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-800 text-white hover:bg-gray-900'
              )}
            >
              <RotateCcw className="w-4 h-4" /> Next Passage
            </button>
          )}
        </div>

        {/* Results section */}
        {showResults && (
          <div className="mt-8 space-y-6">
            <ScoreCard
              score={score}
              total={totalQuestions}
              duration={timer.totalElapsed}
              isOvertime={timer.isOvertime}
              darkMode={darkMode}
            />

            {/* Custom results section */}
            {renderResults?.()}
          </div>
        )}
      </div>
    </div>
  );
};



