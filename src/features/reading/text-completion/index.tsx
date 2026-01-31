import React, { useEffect, useCallback, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ExerciseLayout } from '@/components/layout';
import { LoadingSpinner } from '@/components/common';
import { useDarkMode } from '@/core/hooks';
import { useTimerWithWarnings } from '@/core/hooks/useTimerWithWarnings';
import { TIMER_CONFIG, TIMER_TARGET_BY_DIFFICULTY } from '@/core/constants';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTextCompletion } from './hooks';
import { PassageDisplay, ResultsPanel } from './components';

export const TextCompletion: React.FC = () => {
  const { t } = useTranslation();
  const { darkMode, toggle: toggleDarkMode } = useDarkMode();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reviewExerciseId = searchParams.get('review');
  const historyId = searchParams.get('historyId');
  const prevReviewIdRef = useRef<string | null | undefined>(undefined);
  const prevHistoryIdRef = useRef<string | null | undefined>(undefined);

  // Get Ready modal and countdown states
  const [showGetReadyModal, setShowGetReadyModal] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownValue, setCountdownValue] = useState(3);
  const [countdownComplete, setCountdownComplete] = useState(false);
  const hasShownGetReadyRef = useRef(false);

  // Calculate target time based on difficulty
  const getTargetTime = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy':
        return TIMER_TARGET_BY_DIFFICULTY.easy;
      case 'intermediate':
        return TIMER_TARGET_BY_DIFFICULTY.intermediate;
      case 'hard':
        return TIMER_TARGET_BY_DIFFICULTY.hard;
      default:
        return TIMER_TARGET_BY_DIFFICULTY.intermediate; // Default to medium
    }
  };

  const timer = useTimerWithWarnings({
    duration: TIMER_CONFIG.TEXT_COMPLETION,
    targetTime: getTargetTime(passage?.difficulty),
    autoStart: false,
    callbacks: {
      onWarningThreshold: () => {
        toast.warning('30 seconds left - you got this! 💪', {
          duration: 3000,
        });
      },
      onTargetReached: () => {
        // Silent - user might still be finishing up
      },
      onOvertimeStart: () => {
        toast.info("Taking a bit longer - that's okay! Keep going 📝", {
          duration: 3000,
        });
      },
    },
  });

  const {
    loading,
    passage,
    userAnswers,
    showResults,
    error,
    blanks,
    score,
    exerciseId,
    isReviewMode,
    historyTimeSpent,
    loadNewPassage,
    loadSpecificExercise,
    loadHistoryReview,
    retryCurrentExercise,
    updateAnswer,
    checkAnswers,
    setInputRef,
    scheduleFocus,
    getBlankLength,
    getPrevBlank,
    getNextBlank,
  } = useTextCompletion();

  // Load initial passage or specific exercise for review
  useEffect(() => {
    // Only run if params have actually changed
    if (prevReviewIdRef.current === reviewExerciseId && prevHistoryIdRef.current === historyId) return;
    prevReviewIdRef.current = reviewExerciseId;
    prevHistoryIdRef.current = historyId;

    if (historyId) {
      loadHistoryReview(historyId);
    } else if (reviewExerciseId) {
      loadSpecificExercise(reviewExerciseId);
    } else {
      loadNewPassage();
      // Show Get Ready modal for new practice sessions (not review mode)
      if (!hasShownGetReadyRef.current) {
        setShowGetReadyModal(true);
        hasShownGetReadyRef.current = true;
      }
    }
  }, [reviewExerciseId, historyId, loadSpecificExercise, loadHistoryReview, loadNewPassage]);

  // Start timer when passage loads AND countdown is complete
  useEffect(() => {
    if (passage && !showResults && countdownComplete) {
      timer.reset();
      timer.start();
    }
  }, [passage, showResults, countdownComplete]);

  // Stop timer when showing results
  useEffect(() => {
    if (showResults) {
      timer.stop();
    }
  }, [showResults, timer]);

  // Countdown effect
  useEffect(() => {
    if (!showCountdown) return;

    if (countdownValue > 0) {
      const timeout = setTimeout(() => {
        setCountdownValue(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timeout);
    } else {
      // Countdown finished
      setShowCountdown(false);
      setCountdownComplete(true);
    }
  }, [showCountdown, countdownValue]);

  // Handle "I got it" button click
  const handleGetReadyConfirm = useCallback(() => {
    setShowGetReadyModal(false);
    setShowCountdown(true);
    setCountdownValue(3); // Reset to 3
  }, []);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error]);

  // Handle input action
  const handleInput = useCallback(
    (
      wordId: number,
      charIndex: number,
      expectedLength: number,
      action: 'type' | 'backspace' | 'delete' | 'left' | 'right' | 'up' | 'down' | 'home' | 'end' | 'tab' | 'shift-tab',
      char?: string
    ) => {
      if (showResults) return;

      const currentAnswer = userAnswers[wordId] || '';

      switch (action) {
        case 'type': {
          if (!char) return;
          const englishChar = char.replace(/[^a-zA-Z]/g, '').slice(-1).toLowerCase();

          const chars = currentAnswer.padEnd(expectedLength, ' ').split('');
          chars[charIndex] = englishChar;
          updateAnswer(wordId, chars.join('').replace(/ /g, ''));

          if (englishChar) {
            if (charIndex < expectedLength - 1) {
              scheduleFocus(wordId, charIndex + 1);
            } else {
              const next = getNextBlank(wordId);
              if (next) scheduleFocus(next.wordId, 0);
            }
          } else {
            scheduleFocus(wordId, charIndex);
          }
          break;
        }

        case 'backspace': {
          const chars = currentAnswer.padEnd(expectedLength, ' ').split('');

          if (chars[charIndex].trim()) {
            chars[charIndex] = ' ';
            updateAnswer(wordId, chars.join('').replace(/ /g, ''));
            scheduleFocus(wordId, charIndex);
          } else if (charIndex > 0) {
            chars[charIndex - 1] = ' ';
            updateAnswer(wordId, chars.join('').replace(/ /g, ''));
            scheduleFocus(wordId, charIndex - 1);
          } else {
            const prevBlank = getPrevBlank(wordId);
            if (prevBlank && prevBlank.length > 0) {
              const prevAnswer = userAnswers[prevBlank.wordId] || '';
              const prevChars = prevAnswer.padEnd(prevBlank.length, ' ').split('');
              prevChars[prevBlank.length - 1] = ' ';
              updateAnswer(prevBlank.wordId, prevChars.join('').replace(/ /g, ''));
              scheduleFocus(prevBlank.wordId, prevBlank.length - 1);
            }
          }
          break;
        }

        case 'delete': {
          const chars = currentAnswer.padEnd(expectedLength, ' ').split('');

          if (chars[charIndex].trim()) {
            chars[charIndex] = ' ';
            updateAnswer(wordId, chars.join('').replace(/ /g, ''));
            scheduleFocus(wordId, charIndex);
          } else {
            if (charIndex < expectedLength - 1) {
              scheduleFocus(wordId, charIndex + 1);
            } else {
              const next = getNextBlank(wordId);
              if (next) scheduleFocus(next.wordId, 0);
              else scheduleFocus(wordId, charIndex);
            }
          }
          break;
        }

        case 'left': {
          if (charIndex > 0) {
            scheduleFocus(wordId, charIndex - 1);
          } else {
            const prev = getPrevBlank(wordId);
            if (prev) scheduleFocus(prev.wordId, prev.length - 1);
          }
          break;
        }

        case 'right': {
          if (charIndex < expectedLength - 1) {
            scheduleFocus(wordId, charIndex + 1);
          } else {
            const next = getNextBlank(wordId);
            if (next) scheduleFocus(next.wordId, 0);
          }
          break;
        }

        case 'up': {
          const prev = getPrevBlank(wordId);
          if (prev) {
            const targetIdx = Math.min(charIndex, prev.length - 1);
            scheduleFocus(prev.wordId, targetIdx);
          }
          break;
        }

        case 'down': {
          const next = getNextBlank(wordId);
          if (next) {
            const targetIdx = Math.min(charIndex, next.length - 1);
            scheduleFocus(next.wordId, targetIdx);
          }
          break;
        }

        case 'home': {
          scheduleFocus(wordId, 0);
          break;
        }

        case 'end': {
          scheduleFocus(wordId, expectedLength - 1);
          break;
        }

        case 'tab': {
          const next = getNextBlank(wordId);
          if (next) scheduleFocus(next.wordId, 0);
          break;
        }

        case 'shift-tab': {
          const prev = getPrevBlank(wordId);
          if (prev) scheduleFocus(prev.wordId, 0);
          break;
        }
      }
    },
    [showResults, userAnswers, updateAnswer, scheduleFocus, getPrevBlank, getNextBlank]
  );

  // Handle check answers
  const handleCheckAnswers = useCallback(async () => {
    await checkAnswers();
    timer.stop();
  }, [checkAnswers, timer]);

  // Handle next exercise
  const handleNextExercise = useCallback(() => {
    // For subsequent exercises, skip countdown - timer starts immediately
    setCountdownComplete(true);

    if (isReviewMode) {
      // Clear review param and load new passage
      prevReviewIdRef.current = undefined;
      navigate('/practice/text-completion', { replace: true });
    } else {
      loadNewPassage();
    }
  }, [isReviewMode, navigate, loadNewPassage]);

  // Get Ready Modal (shown while loading for first-time practice)
  if (showGetReadyModal) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center transition-colors",
        darkMode ? "bg-zinc-950" : "bg-gray-50"
      )}>
        <div className={cn(
          "max-w-md mx-4 p-8 rounded-2xl border shadow-2xl animate-in zoom-in-95 duration-300",
          darkMode
            ? "bg-zinc-900 border-zinc-800"
            : "bg-white border-gray-200"
        )}>
          <div className="text-center">
            <div className={cn(
              "w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center",
              darkMode ? "bg-emerald-500/10" : "bg-emerald-50"
            )}>
              <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className={cn(
              "text-2xl font-bold mb-3",
              darkMode ? "text-gray-100" : "text-gray-900"
            )}>
              Ready to start?
            </h3>
            <div className={cn(
              "text-left space-y-3 mb-8 p-4 rounded-xl",
              darkMode ? "bg-zinc-800/50" : "bg-gray-50"
            )}>
              <p className={cn(
                "text-sm flex items-start gap-2",
                darkMode ? "text-gray-300" : "text-gray-700"
              )}>
                <span className="text-emerald-500 font-bold">⏱️</span>
                <span>Time limits vary by difficulty level</span>
              </p>
              <p className={cn(
                "text-sm flex items-start gap-2",
                darkMode ? "text-gray-300" : "text-gray-700"
              )}>
                <span className="text-amber-500 font-bold">🔔</span>
                <span>Watch for timer color changes and warnings</span>
              </p>
              <p className={cn(
                "text-sm flex items-start gap-2",
                darkMode ? "text-gray-300" : "text-gray-700"
              )}>
                <span className="text-blue-500 font-bold">🎯</span>
                <span>Aim to finish before the target time!</span>
              </p>
            </div>
            <button
              onClick={handleGetReadyConfirm}
              className="w-full h-12 px-6 text-[15px] font-semibold bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
            >
              I got it!
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Countdown Overlay (shown after "I got it" click, before exercise starts)
  if (showCountdown) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center transition-colors",
        darkMode ? "bg-zinc-950" : "bg-gray-50"
      )}>
        <div className="text-center animate-in zoom-in-50 duration-300">
          <div className={cn(
            "text-[120px] font-black tabular-nums leading-none mb-4",
            countdownValue === 3 && "text-emerald-500",
            countdownValue === 2 && "text-amber-500",
            countdownValue === 1 && "text-red-500"
          )}>
            {countdownValue}
          </div>
          <p className={cn(
            "text-xl font-semibold",
            darkMode ? "text-gray-400" : "text-gray-600"
          )}>
            Get ready...
          </p>
        </div>
      </div>
    );
  }

  // Loading state (fallback if passage not loaded yet)
  if (loading || !passage) {
    return <LoadingSpinner message="Preparing passage..." darkMode={darkMode} />;
  }

  return (
    <ExerciseLayout
      timer={timer}
      darkMode={darkMode}
      onDarkModeToggle={toggleDarkMode}
      title="Fill in the missing letters in the paragraph."
      subtitle={
        <div className="flex flex-col gap-1">
          <span>(Questions 1-10)</span>
          <span className="text-[11px] text-blue-500/80 dark:text-blue-400/60 font-medium">
            💡 {t('practice.englishModeHint')}
          </span>
          <span className="text-[11px] text-emerald-500/70 dark:text-emerald-400/60 font-medium mt-0.5">
            🎯 Target: {Math.floor(getTargetTime(passage?.difficulty) / 60)}:{(getTargetTime(passage?.difficulty) % 60).toString().padStart(2, '0')}
          </span>
        </div>
      }
      difficulty={passage?.difficulty}
      topicCategory={passage?.topic_category}
      showResults={showResults}
      onCheckAnswers={handleCheckAnswers}
      onNextExercise={handleNextExercise}
      onRetry={retryCurrentExercise}
      score={score}
      totalQuestions={10}
      useProgressBar={true}
      renderResults={() => (
        <ResultsPanel
          blanks={blanks}
          userAnswers={userAnswers}
          darkMode={darkMode}
          topic={passage?.topic}
          elapsedTime={historyTimeSpent !== null ? historyTimeSpent : timer.elapsed}
          passage={passage}
          exerciseId={exerciseId || undefined}
          targetTime={getTargetTime(passage?.difficulty)}
        />
      )}
    >
      {/* Start encouragement message */}
      {!showResults && passage && (
        <div className={cn(
          "mb-4 px-4 py-2.5 rounded-lg border",
          darkMode
            ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
            : "bg-emerald-50 border-emerald-200 text-emerald-700"
        )}>
          <p className="text-sm font-medium">
            🎯 Let's nail this! Aim for under {Math.floor(getTargetTime(passage.difficulty) / 60)}:{(getTargetTime(passage.difficulty) % 60).toString().padStart(2, '0')}
          </p>
        </div>
      )}

      <PassageDisplay
        passage={passage}
        userAnswers={userAnswers}
        showResults={showResults}
        darkMode={darkMode}
        onSetRef={setInputRef}
        onInput={handleInput}
      />
    </ExerciseLayout>
  );
};

export default TextCompletion;
