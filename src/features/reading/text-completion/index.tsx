import React, { useEffect, useCallback } from 'react';
import { ExerciseLayout } from '@/components/layout';
import { LoadingSpinner } from '@/components/common';
import { useTimer, useDarkMode } from '@/core/hooks';
import { TIMER_CONFIG } from '@/core/constants';
import { toast } from '@/hooks/use-toast';
import { useTextCompletion } from './hooks';
import { PassageDisplay, ResultsPanel } from './components';

export const TextCompletion: React.FC = () => {
  const { darkMode, toggle: toggleDarkMode } = useDarkMode();
  
  const timer = useTimer({
    duration: TIMER_CONFIG.TEXT_COMPLETION,
    autoStart: false,
  });

  const {
    loading,
    passage,
    userAnswers,
    showResults,
    error,
    blanks,
    score,
    loadNewPassage,
    updateAnswer,
    checkAnswers,
    setInputRef,
    scheduleFocus,
    getBlankLength,
    getPrevBlank,
    getNextBlank,
  } = useTextCompletion();

  // Load initial passage
  useEffect(() => {
    loadNewPassage();
  }, [loadNewPassage]);

  // Start timer when passage loads
  useEffect(() => {
    if (passage && !showResults) {
      timer.reset();
      timer.start();
    }
  }, [passage, showResults]);

  // Stop timer when showing results
  useEffect(() => {
    if (showResults) {
      timer.stop();
    }
  }, [showResults, timer]);

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
  const handleCheckAnswers = useCallback(() => {
    checkAnswers();
    timer.stop();
  }, [checkAnswers, timer]);

  // Handle next exercise
  const handleNextExercise = useCallback(() => {
    loadNewPassage();
  }, [loadNewPassage]);

  // Loading state
  if (loading) {
    return <LoadingSpinner message="Preparing passage..." darkMode={darkMode} />;
  }

  // No passage
  if (!passage) {
    return null;
  }

  return (
    <ExerciseLayout
      timer={timer}
      darkMode={darkMode}
      onDarkModeToggle={toggleDarkMode}
      title="Fill in the missing letters in the paragraph."
      subtitle="(Questions 1-10)"
      showResults={showResults}
      onCheckAnswers={handleCheckAnswers}
      onNextExercise={handleNextExercise}
      score={score}
      totalQuestions={10}
      renderResults={() => (
        <ResultsPanel
          blanks={blanks}
          userAnswers={userAnswers}
          darkMode={darkMode}
        />
      )}
    >
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



