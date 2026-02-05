import { useState, useCallback, useRef } from 'react';
import { BuildSentenceQuestion, BuildSentenceQuestionResult } from '../types';
import { getSessionQuestions } from '../data/sampleQuestions';
import { generateSessionQuestions } from '../api';
import { EXERCISE_CONFIG } from '@/core/constants';

export interface UseBuildSentenceReturn {
  // State
  loading: boolean;
  questions: BuildSentenceQuestion[];
  currentIndex: number;
  slotContents: (string | null)[];
  questionResults: BuildSentenceQuestionResult[];
  showQuestionResult: boolean;
  sessionComplete: boolean;
  error: string | null;

  // Computed
  currentQuestion: BuildSentenceQuestion | null;
  availableChunks: string[];
  allSlotsFilled: boolean;
  sessionScore: number;

  // Actions
  loadSession: () => void;
  placeChunk: (chunkId: string, slotIndex: number) => void;
  removeChunk: (slotIndex: number) => void;
  clickChunk: (chunkId: string) => void;
  checkCurrentAnswer: () => void;
  nextQuestion: () => void;
  retrySession: () => void;
  startTiming: () => void;

  // Timing
  startTimeRef: React.MutableRefObject<number | null>;
}

export function useBuildSentence(): UseBuildSentenceReturn {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<BuildSentenceQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slotContents, setSlotContents] = useState<(string | null)[]>([]);
  const [questionResults, setQuestionResults] = useState<BuildSentenceQuestionResult[]>([]);
  const [showQuestionResult, setShowQuestionResult] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startTimeRef = useRef<number | null>(null);

  // Computed
  const currentQuestion = questions[currentIndex] ?? null;

  const placedChunkIds = new Set(slotContents.filter(Boolean) as string[]);
  const availableChunks = currentQuestion
    ? currentQuestion.puzzle.chunks
        .map((c) => c.id)
        .filter((id) => !placedChunkIds.has(id))
    : [];

  const allSlotsFilled = currentQuestion
    ? slotContents.length === currentQuestion.puzzle.slots_count &&
      slotContents.every((s) => s !== null)
    : false;

  const sessionScore = questionResults.filter((r) => r.isCorrect).length;

  // Actions
  const loadSession = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Try AI generation first
      console.log('[BuildSentence] Attempting AI generation...');
      const result = await generateSessionQuestions(EXERCISE_CONFIG.BUILD_SENTENCE.QUESTIONS_PER_SET);
      
      if (result.data && result.data.length > 0) {
        console.log(`[BuildSentence] AI generated ${result.data.length} questions`);
        setQuestions(result.data);
        setCurrentIndex(0);
        setSlotContents(new Array(result.data[0]?.puzzle.slots_count ?? 0).fill(null));
        setQuestionResults([]);
        setShowQuestionResult(false);
        setSessionComplete(false);
        startTimeRef.current = null;
      } else {
        // Fallback to local sample questions
        console.log('[BuildSentence] AI failed, falling back to sample questions');
        const picked = getSessionQuestions(EXERCISE_CONFIG.BUILD_SENTENCE.QUESTIONS_PER_SET);
        setQuestions(picked);
        setCurrentIndex(0);
        setSlotContents(new Array(picked[0]?.puzzle.slots_count ?? 0).fill(null));
        setQuestionResults([]);
        setShowQuestionResult(false);
        setSessionComplete(false);
        startTimeRef.current = null;
      }
    } catch {
      // Fallback to local sample questions on any error
      console.log('[BuildSentence] Error occurred, falling back to sample questions');
      try {
        const picked = getSessionQuestions(EXERCISE_CONFIG.BUILD_SENTENCE.QUESTIONS_PER_SET);
        setQuestions(picked);
        setCurrentIndex(0);
        setSlotContents(new Array(picked[0]?.puzzle.slots_count ?? 0).fill(null));
        setQuestionResults([]);
        setShowQuestionResult(false);
        setSessionComplete(false);
        startTimeRef.current = null;
      } catch {
        setError('Failed to load questions.');
      }
    }

    setLoading(false);
  }, []);


  const startTiming = useCallback(() => {
    startTimeRef.current = Date.now();
  }, []);

  const placeChunk = useCallback(
    (chunkId: string, slotIndex: number) => {
      if (showQuestionResult || sessionComplete) return;
      setSlotContents((prev) => {
        const next = [...prev];
        // If chunk is already in another slot, remove it first
        const existingIdx = next.indexOf(chunkId);
        if (existingIdx !== -1) {
          next[existingIdx] = null;
        }
        // If target slot already has a chunk, swap to source or just clear
        // (no swap needed — the old chunk goes back to bank)
        next[slotIndex] = chunkId;
        return next;
      });
    },
    [showQuestionResult, sessionComplete]
  );

  const removeChunk = useCallback(
    (slotIndex: number) => {
      if (showQuestionResult || sessionComplete) return;
      setSlotContents((prev) => {
        const next = [...prev];
        next[slotIndex] = null;
        return next;
      });
    },
    [showQuestionResult, sessionComplete]
  );

  /** Click-to-place: place chunk in the first empty slot */
  const clickChunk = useCallback(
    (chunkId: string) => {
      if (showQuestionResult || sessionComplete) return;
      setSlotContents((prev) => {
        // If already placed, remove it (toggle)
        const existingIdx = prev.indexOf(chunkId);
        if (existingIdx !== -1) {
          const next = [...prev];
          next[existingIdx] = null;
          return next;
        }
        // Place in first empty slot
        const emptyIdx = prev.indexOf(null);
        if (emptyIdx === -1) return prev;
        const next = [...prev];
        next[emptyIdx] = chunkId;
        return next;
      });
    },
    [showQuestionResult, sessionComplete]
  );

  const checkCurrentAnswer = useCallback(() => {
    if (!currentQuestion || showQuestionResult) return;

    const userOrder = slotContents.filter(Boolean) as string[];
    const correctOrder = currentQuestion.puzzle.correct_order;
    const isCorrect =
      userOrder.length === correctOrder.length &&
      userOrder.every((id, i) => id === correctOrder[i]);

    const result: BuildSentenceQuestionResult = {
      questionIndex: currentIndex,
      userOrder,
      correctOrder,
      isCorrect,
    };

    setQuestionResults((prev) => [...prev, result]);
    setShowQuestionResult(true);
  }, [currentQuestion, currentIndex, slotContents, showQuestionResult]);

  const nextQuestion = useCallback(() => {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= questions.length) {
      setSessionComplete(true);
      setShowQuestionResult(false);
      return;
    }
    setCurrentIndex(nextIdx);
    setSlotContents(new Array(questions[nextIdx].puzzle.slots_count).fill(null));
    setShowQuestionResult(false);
  }, [currentIndex, questions]);

  const retrySession = useCallback(() => {
    const picked = getSessionQuestions(EXERCISE_CONFIG.BUILD_SENTENCE.QUESTIONS_PER_SET);
    setQuestions(picked);
    setCurrentIndex(0);
    setSlotContents(new Array(picked[0]?.puzzle.slots_count ?? 0).fill(null));
    setQuestionResults([]);
    setShowQuestionResult(false);
    setSessionComplete(false);
    startTimeRef.current = null;
  }, []);

  return {
    loading,
    questions,
    currentIndex,
    slotContents,
    questionResults,
    showQuestionResult,
    sessionComplete,
    error,
    currentQuestion,
    availableChunks,
    allSlotsFilled,
    sessionScore,
    loadSession,
    placeChunk,
    removeChunk,
    clickChunk,
    checkCurrentAnswer,
    nextQuestion,
    retrySession,
    startTiming,
    startTimeRef,
  };
}
