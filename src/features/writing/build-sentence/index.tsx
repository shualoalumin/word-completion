import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { ExerciseLayout } from '@/components/layout';
import { LoadingSpinner } from '@/components/common';
import { useDarkMode } from '@/core/hooks';
import { useTimerWithWarnings } from '@/core/hooks/useTimerWithWarnings';
import { TIMER_CONFIG, TIMER_TARGET_BY_DIFFICULTY } from '@/core/constants';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useBuildSentence } from './hooks';
import { mapToCoreDifficulty } from './types';
import {
  DialogueDisplay,
  SentenceSkeleton,
  WordBank,
  QuestionIndicator,
  BuildSentenceResultsPanel,
} from './components';

export const BuildSentenceExercise: React.FC = () => {
  const { t } = useTranslation();
  const { darkMode, toggle: toggleDarkMode } = useDarkMode();

  const [searchParams] = useSearchParams();
  const reviewId = searchParams.get('review');
  const isReviewMode = !!reviewId;

  // Get Ready modal & countdown - initialize based on whether it's a new session
  const isNewSession = !isReviewMode;
  const [showGetReadyModal, setShowGetReadyModal] = useState(isNewSession);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownValue, setCountdownValue] = useState(3);
  const [countdownComplete, setCountdownComplete] = useState(false);

  // DnD overlay state
  const [activeChunkId, setActiveChunkId] = useState<string | null>(null);
  const historySaveAttemptedRef = useRef(false);

  const bs = useBuildSentence();

  const getTargetTime = useCallback(
    (difficulty?: string): number => {
      if (!difficulty) return TIMER_TARGET_BY_DIFFICULTY.intermediate;
      const mapped = mapToCoreDifficulty(difficulty as any);
      return TIMER_TARGET_BY_DIFFICULTY[mapped];
    },
    []
  );

  const timer = useTimerWithWarnings({
    duration: TIMER_CONFIG.BUILD_SENTENCE,
    targetTime: getTargetTime(bs.currentQuestion?.difficulty),
    autoStart: false,
    callbacks: {
      onWarningThreshold: () => {
        toast.warning(t('buildSentence.timeWarning', '30 seconds left!'), { duration: 3000 });
      },
      onTargetReached: () => {},
      onOvertimeStart: () => {
        toast.info(t('buildSentence.overtime', "Taking longer - that's okay!"), { duration: 3000 });
      },
    },
  });

  // DnD sensors
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 5 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 150, tolerance: 5 },
  });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, touchSensor, keyboardSensor);

  // Load session or review on mount
  useEffect(() => {
    if (isReviewMode && reviewId) {
      bs.loadHistoryReview(reviewId);
      setShowGetReadyModal(false);
      setCountdownComplete(true);
    } else {
      bs.loadSession();
    }
  }, [isReviewMode, reviewId, bs.loadSession, bs.loadHistoryReview]);

  // Start timer when countdown finishes and questions are loaded
  useEffect(() => {
    if (bs.questions.length > 0 && !bs.sessionComplete && countdownComplete) {
      timer.reset();
      timer.start();
      bs.startTiming();
    }
  }, [bs.questions.length, bs.sessionComplete, countdownComplete, bs.startTiming]);

  // Stop timer and save history when session complete (once per session to avoid duplicate rows)
  useEffect(() => {
    if (!bs.sessionComplete || historySaveAttemptedRef.current) return;
    historySaveAttemptedRef.current = true;
    timer.stop();

    const elapsedTime = bs.startTimeRef.current
      ? Math.floor((Date.now() - bs.startTimeRef.current) / 1000)
      : timer.totalElapsed;
    const targetTime = getTargetTime(bs.questions[0]?.difficulty);
    bs.saveHistory(elapsedTime, targetTime);
  }, [bs.sessionComplete, timer, bs.saveHistory, bs.questions, getTargetTime]);

  // Countdown effect
  useEffect(() => {
    if (!showCountdown) return;
    if (countdownValue > 0) {
      const timeout = setTimeout(() => setCountdownValue((v) => v - 1), 1000);
      return () => clearTimeout(timeout);
    } else {
      setShowCountdown(false);
      setCountdownComplete(true);
    }
  }, [showCountdown, countdownValue]);

  // Blur during countdown
  useEffect(() => {
    if (showCountdown && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, [showCountdown]);

  const handleGetReadyConfirm = useCallback(() => {
    setShowGetReadyModal(false);
    setShowCountdown(true);
    setCountdownValue(3);
  }, []);

  // DnD handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const chunkId = event.active.data.current?.chunkId as string | undefined;
    setActiveChunkId(chunkId ?? null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveChunkId(null);
      const { active, over } = event;
      if (!over) return;

      const chunkId = active.data.current?.chunkId as string | undefined;
      if (!chunkId) return;

      const overId = String(over.id);

      // Dropped on a slot
      if (overId.startsWith('slot-')) {
        const slotIndex = parseInt(overId.replace('slot-', ''), 10);
        if (!isNaN(slotIndex)) {
          bs.placeChunk(chunkId, slotIndex);
        }
      }
    },
    [bs.placeChunk]
  );

  // Handle check — per-question check or session finish
  const handleCheck = useCallback(() => {
    if (bs.showQuestionResult) {
      // "Next Question" mode
      bs.nextQuestion();
    } else {
      bs.checkCurrentAnswer();
    }
  }, [bs.showQuestionResult, bs.checkCurrentAnswer, bs.nextQuestion]);

  // Handle next exercise (new session)
  const handleNextExercise = useCallback(() => {
    setCountdownComplete(true); // Skip countdown on subsequent sessions
    bs.retrySession();
  }, [bs.retrySession]);

  // Handle retry
  const handleRetry = useCallback(() => {
    setCountdownComplete(true);
    bs.retrySession();
  }, [bs.retrySession]);

  // Get active chunk for overlay
  const activeChunk = activeChunkId && bs.currentQuestion
    ? bs.currentQuestion.puzzle.chunks.find((c) => c.id === activeChunkId)
    : null;

  // ── Render: Get Ready Modal and Countdown (combined to prevent flash) ──
  if (showGetReadyModal || showCountdown) {
    return (
      <div className={cn(
        'min-h-screen flex items-center justify-center transition-colors',
        darkMode ? 'bg-zinc-950' : 'bg-gray-50',
      )}>
        {showGetReadyModal && (
          <div className={cn(
            'max-w-md mx-4 p-8 rounded-2xl border shadow-2xl animate-in zoom-in-95 duration-300',
            darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200',
          )}>
            <div className="text-center">
              <div className={cn(
                'w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center',
                darkMode ? 'bg-emerald-500/10' : 'bg-emerald-50',
              )}>
                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </div>
              <h3 className={cn(
                'text-2xl font-bold mb-3',
                darkMode ? 'text-gray-100' : 'text-gray-900',
              )}>
                {t('buildSentence.getReady', 'Build a Sentence')}
              </h3>
              <div className={cn(
                'text-left space-y-3 mb-8 p-4 rounded-xl',
                darkMode ? 'bg-zinc-800/50' : 'bg-gray-50',
              )}>
                <p className={cn('text-sm flex items-start gap-2', darkMode ? 'text-gray-300' : 'text-gray-700')}>
                  <span className="text-blue-500 font-bold shrink-0">💬</span>
                  <span>{t('buildSentence.instruction1', 'Read the conversation and build a reply')}</span>
                </p>
                <p className={cn('text-sm flex items-start gap-2', darkMode ? 'text-gray-300' : 'text-gray-700')}>
                  <span className="text-emerald-500 font-bold shrink-0">🧩</span>
                  <span>{t('buildSentence.instruction2', 'Click or drag words into the correct order')}</span>
                </p>
                <p className={cn('text-sm flex items-start gap-2', darkMode ? 'text-gray-300' : 'text-gray-700')}>
                  <span className="text-amber-500 font-bold shrink-0">⚠️</span>
                  <span>{t('buildSentence.instruction3', 'Watch out for distractor words in hard mode!')}</span>
                </p>
              </div>
              <button
                onClick={handleGetReadyConfirm}
                className="w-full h-12 px-6 text-[15px] font-semibold bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
              >
                {t('buildSentence.iGotIt', "I got it!")}
              </button>
            </div>
          </div>
        )}

        {showCountdown && (
          <div className="text-center animate-in zoom-in-50 duration-300 select-none" style={{ caretColor: 'transparent' }}>
            <div
              key={countdownValue}
              className={cn(
                'text-[120px] font-black tabular-nums leading-none mb-4',
                'animate-in zoom-in-95 duration-200',
                '[text-shadow:none] [box-shadow:none]',
                countdownValue === 3 && 'text-emerald-500',
                countdownValue === 2 && 'text-amber-500',
                countdownValue === 1 && 'text-red-500',
              )}
              style={{ outline: 'none', border: 'none' }}
            >
              {countdownValue}
            </div>
            <p className={cn(
              'text-xl font-semibold',
              darkMode ? 'text-gray-400' : 'text-gray-600',
            )}>
              {t('buildSentence.getReadyDots', 'Get ready...')}
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── Render: Loading ────────────────────────────────────
  if (bs.loading || !bs.currentQuestion) {
    return <LoadingSpinner message={t('buildSentence.loading', 'Preparing questions...')} darkMode={darkMode} />;
  }

  const question = bs.currentQuestion;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <ExerciseLayout
        timer={timer}
        darkMode={darkMode}
        onDarkModeToggle={toggleDarkMode}
        title={t('buildSentence.title', 'Make an appropriate sentence.')}
        subtitle={
          <QuestionIndicator
            current={bs.currentIndex}
            total={bs.questions.length}
            results={bs.questionResults}
            darkMode={darkMode}
          />
        }
        showResults={bs.sessionComplete}
        onCheckAnswers={handleCheck}
        onNextExercise={handleNextExercise}
        onRetry={handleRetry}
        score={bs.sessionScore}
        totalQuestions={bs.questions.length}
        useProgressBar={true}
        timerTotalDuration={TIMER_CONFIG.BUILD_SENTENCE}
        renderResults={() => (
          <BuildSentenceResultsPanel
            questions={bs.questions}
            results={bs.questionResults}
            darkMode={darkMode}
            elapsedTime={bs.startTimeRef.current ? Math.floor((Date.now() - bs.startTimeRef.current) / 1000) : timer.totalElapsed}
            targetTime={getTargetTime(question.difficulty)}
          />
        )}
      >
        {/* Per-question result feedback */}
        {bs.showQuestionResult && (
          <div className={cn(
            'mb-4 px-4 py-3 rounded-lg border',
            bs.questionResults[bs.questionResults.length - 1]?.isCorrect
              ? darkMode
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : darkMode
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'bg-red-50 border-red-200 text-red-700',
          )}>
            {bs.questionResults[bs.questionResults.length - 1]?.isCorrect ? (
              <p className="text-sm font-medium">
                ✓ {t('buildSentence.correct', 'Correct!')}
              </p>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  ✗ {t('buildSentence.incorrect', 'Not quite.')}
                </p>
                <p className={cn(
                  'text-sm',
                  darkMode ? 'text-emerald-400' : 'text-emerald-700',
                )}>
                  {t('buildSentence.correctAnswer', 'Correct')}: {question.dialogue.speaker_b.full_response}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Dialogue + Sentence Skeleton + Word Bank */}
        <DialogueDisplay dialogue={question.dialogue} darkMode={darkMode}>
          <SentenceSkeleton
            anchorStart={question.dialogue.speaker_b.anchor_start}
            anchorEnd={question.dialogue.speaker_b.anchor_end}
            slotsCount={question.puzzle.slots_count}
            slotContents={bs.slotContents}
            chunks={question.puzzle.chunks}
            darkMode={darkMode}
            showResult={bs.showQuestionResult}
            correctOrder={question.puzzle.correct_order}
            onRemoveSlot={bs.removeChunk}
          />
        </DialogueDisplay>

        <WordBank
          chunks={question.puzzle.chunks}
          availableChunkIds={bs.availableChunks}
          darkMode={darkMode}
          showResult={bs.showQuestionResult}
          onClickChunk={bs.clickChunk}
        />
      </ExerciseLayout>

      {/* Drag overlay */}
      <DragOverlay>
        {activeChunk ? (
          <div className={cn(
            'px-4 py-2 rounded-lg border text-sm font-medium shadow-xl',
            darkMode
              ? 'bg-zinc-700 border-zinc-600 text-zinc-100'
              : 'bg-white border-gray-300 text-gray-800 shadow-lg',
          )}>
            {activeChunk.text}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default BuildSentenceExercise;
