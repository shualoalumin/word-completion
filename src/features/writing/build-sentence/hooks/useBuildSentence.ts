import { useState, useCallback, useRef } from 'react';
import { BuildSentenceQuestion, BuildSentenceQuestionResult } from '../types';
import { getSessionQuestions } from '../data/sampleQuestions';
import { generateSessionQuestions, saveBuildSentenceHistory, loadHistoryRecordById } from '../api';
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
  historySaved: boolean;

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
  saveHistory: (elapsedTime: number, targetTime: number) => Promise<void>;
  loadHistoryReview: (historyId: string) => Promise<void>;

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
  const [historySaved, setHistorySaved] = useState(false);

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
        setHistorySaved(false);
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
        setHistorySaved(false);
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
    setHistorySaved(false);
    startTimeRef.current = null;
  }, []);

  const saveHistory = useCallback(async (elapsedTime: number, targetTime: number) => {
    if (historySaved || questionResults.length === 0) return;

    const score = questionResults.filter((r) => r.isCorrect).length;
    const maxScore = questionResults.length;
    const scorePercent = maxScore > 0 ? (score / maxScore) * 100 : 0;

    // Get first question's exercise_id if available
    const exerciseId = questions[0]?.exercise_id || undefined;
    const difficulty = questions[0]?.difficulty || 'medium';
    const topicCategory = questions[0]?.topic_category || undefined;

    const mistakes = questionResults
      .filter((r) => !r.isCorrect)
      .map((r) => ({
        questionIndex: r.questionIndex,
        correctOrder: r.correctOrder,
        userOrder: r.userOrder,
      }));

    const answers = questionResults.map((r) => ({
      questionIndex: r.questionIndex,
      userOrder: r.userOrder,
      isCorrect: r.isCorrect,
      questionData: questions[r.questionIndex], // Store full context
    }));

    const result = await saveBuildSentenceHistory({
      exerciseId,
      score,
      maxScore,
      scorePercent,
      timeSpentSeconds: elapsedTime,
      targetTimeSeconds: targetTime,
      answers,
      mistakes,
      difficulty,
      topicCategory,
    });

    if (result.success) {
      setHistorySaved(true);
      console.log('[BuildSentence] History saved successfully');
    } else {
      console.error('[BuildSentence] Failed to save history:', result.error);
    }
  }, [historySaved, questionResults, questions]);

  const loadHistoryReview = useCallback(async (historyId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: historyError } = await loadHistoryRecordById(historyId);
      if (historyError) throw historyError;
      if (!data) throw new Error('History record not found');

      // Reconstruct state from history record
      // We stored full questionData in each answer
      const historyAnswers = data.answers as any[];
      if (!historyAnswers || historyAnswers.length === 0) {
        throw new Error('No answer data in history record');
      }

      const reconstructedQuestions = historyAnswers.map(a => a.questionData as BuildSentenceQuestion);
      const reconstructedResults = historyAnswers.map(a => ({
        questionIndex: a.questionIndex,
        userOrder: a.userOrder,
        correctOrder: (a.questionData as BuildSentenceQuestion).puzzle.correct_order,
        isCorrect: a.isCorrect
      } as BuildSentenceQuestionResult));

      setQuestions(reconstructedQuestions);
      setQuestionResults(reconstructedResults);
      setCurrentIndex(0);
      setSlotContents(new Array(reconstructedQuestions[0]?.puzzle.slots_count ?? 0).fill(null));
      setSessionComplete(true);
      setShowQuestionResult(false);
      setHistorySaved(true);
    } catch (err) {
      console.error('[BuildSentence] Failed to load history review:', err);
      setError('Failed to load history record for review.');
    } finally {
      setLoading(false);
    }
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
    historySaved,
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
    saveHistory,
    loadHistoryReview,
    startTimeRef,
  };
}
