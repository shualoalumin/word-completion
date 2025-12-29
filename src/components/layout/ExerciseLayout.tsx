import React from 'react';
import { Check, RotateCcw, User } from 'lucide-react';
import { Timer, DarkModeToggle, ScoreCard } from '@/components/common';
import { UseTimerReturn } from '@/core/hooks';
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

export const ExerciseLayout: React.FC<ExerciseLayoutProps> = ({
  children,
  timer,
  darkMode,
  onDarkModeToggle,
  title,
  subtitle,
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

  return (
    <div
      className={cn(
        'min-h-screen transition-colors duration-300',
        darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
        className
      )}
    >
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Top bar */}
        <div className="flex justify-between items-center mb-6">
          <Timer
            remaining={timer.remaining}
            overtime={timer.overtime}
            isOvertime={timer.isOvertime}
            darkMode={darkMode}
          />
          <div className="flex items-center gap-3">
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



