import { useState, useCallback, useRef } from 'react';
import { BuildSentenceQuestion, BuildSentenceQuestionResult } from '../types';
import { getSessionQuestions } from '../data/sampleQuestions';
import { generateBuildSentenceQuestion, getRecentBuildSentenceExerciseIds, getBuildSentenceHistory, saveBuildSentenceHistory, loadHistoryRecordById } from '../api';
import type { BuildSentencePracticeMode } from '../api';
import { EXERCISE_CONFIG } from '@/core/constants';

/**
 * Sanitize a question: shuffle chunks, remove empty chunks, ensure punctuation not in word bank
 */
function sanitizeQuestion(q: BuildSentenceQuestion): BuildSentenceQuestion {
  // Filter out empty chunks
  const validChunks = q.puzzle.chunks.filter(c => c.text && c.text.trim().length > 0);

  // Remove punctuation-only chunks (should be anchor_end)
  const filteredChunks = validChunks.filter(c => {
    const trimmed = c.text.trim();
    return trimmed !== '?' && trimmed !== '.' && trimmed !== '!' && trimmed !== ',';
  });

  // Shuffle chunks (Fisher-Yates) so they're never in answer order
  const shuffled = [...filteredChunks];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Check if still in correct order and re-shuffle if needed
  const correctOrder = q.puzzle.correct_order;
  const shuffledIds = shuffled.filter(c => !c.is_distractor).map(c => c.id);
  if (shuffledIds.length === correctOrder.length && shuffledIds.every((id, i) => id === correctOrder[i])) {
    // Still in order - do one more shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
  }

  return {
    ...q,
    puzzle: {
      ...q.puzzle,
      chunks: shuffled,
    },
  };
}

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
  saveHistory: (elapsedTime: number, targetTime: number, practiceMode?: BuildSentencePracticeMode) => Promise<void>;
  loadHistoryReview: (historyId: string) => Promise<void>;
  /** Test mode: call when time is up to submit current (if any) and mark rest skipped, then complete session */
  forceCompleteSession: () => void;

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

  // Track background generation cancellation
  const bgAbortRef = useRef(false);

  // Actions
  const loadSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    bgAbortRef.current = false;

    const totalCount = EXERCISE_CONFIG.BUILD_SENTENCE.QUESTIONS_PER_SET;

    // Collect recently used exercise IDs to prevent repetition
    let excludeIds: string[] = [];
    let excludeKeys = new Set<string>();
    try {
      const [recentIds, { data: recentHistory }] = await Promise.all([
        getRecentBuildSentenceExerciseIds(50),
        getBuildSentenceHistory(5),
      ]);
      excludeIds = recentIds;
      if (recentHistory?.length) {
        recentHistory.forEach((record: { answers?: Array<{ questionData?: { dialogue?: { speaker_b?: { full_response?: string } } } }> }) => {
          (record.answers || []).forEach((a: { questionData?: { dialogue?: { speaker_b?: { full_response?: string } } } }) => {
            const key = a.questionData?.dialogue?.speaker_b?.full_response;
            if (key) excludeKeys.add(key);
          });
        });
      }
    } catch {
      // ignore; proceed without exclusion
    }

    // Reset session state
    const resetState = (firstQuestion: BuildSentenceQuestion) => {
      setCurrentIndex(0);
      setSlotContents(new Array(firstQuestion.puzzle.slots_count).fill(null));
      setQuestionResults([]);
      setShowQuestionResult(false);
      setSessionComplete(false);
      setHistorySaved(false);
      startTimeRef.current = null;
    };

    try {
      // Step 1: Generate first question immediately
      console.log('[BuildSentence] Generating first question...');
      const firstResult = await generateBuildSentenceQuestion(excludeIds);

      if (firstResult.data) {
        const firstQ = sanitizeQuestion(firstResult.data);
        console.log('[BuildSentence] First question ready, showing immediately');
        setQuestions([firstQ]);
        resetState(firstQ);
        setLoading(false);

        // Track IDs to exclude within this session
        const sessionExcludeIds = [...excludeIds];
        if (firstQ.exercise_id) sessionExcludeIds.push(firstQ.exercise_id);

        // Step 2: Generate remaining questions in background
        const generateRemaining = async () => {
          for (let i = 1; i < totalCount; i++) {
            if (bgAbortRef.current) break;

            try {
              const result = await generateBuildSentenceQuestion(sessionExcludeIds);
              if (bgAbortRef.current) break;

              if (result.data) {
                if (result.data.exercise_id) {
                  sessionExcludeIds.push(result.data.exercise_id);
                }
                const sanitized = sanitizeQuestion(result.data);
                setQuestions(prev => [...prev, sanitized]);
                console.log(`[BuildSentence] Background: question ${i + 1}/${totalCount} ready`);
              }
            } catch (err) {
              console.warn(`[BuildSentence] Background generation ${i + 1} failed:`, err);
            }
          }
          console.log('[BuildSentence] All background questions generated');
        };

        // Fire and forget - don't await
        generateRemaining();
      } else {
        // AI failed for first question - fallback to sample questions
        console.log('[BuildSentence] AI failed, falling back to sample questions');
        const picked = getSessionQuestions(totalCount, excludeKeys);
        setQuestions(picked);
        resetState(picked[0]);
        setLoading(false);
      }
    } catch {
      // Complete fallback
      console.log('[BuildSentence] Error occurred, falling back to sample questions');
      try {
        const picked = getSessionQuestions(totalCount, excludeKeys);
        setQuestions(picked);
        resetState(picked[0]);
      } catch {
        setError('Failed to load questions.');
      }
      setLoading(false);
    }
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
    const totalCount = EXERCISE_CONFIG.BUILD_SENTENCE.QUESTIONS_PER_SET;

    // All questions answered
    if (nextIdx >= totalCount) {
      setSessionComplete(true);
      setShowQuestionResult(false);
      return;
    }

    // Next question is ready
    if (nextIdx < questions.length) {
      setCurrentIndex(nextIdx);
      setSlotContents(new Array(questions[nextIdx].puzzle.slots_count).fill(null));
      setShowQuestionResult(false);
      return;
    }

    // Next question still loading - show loading state briefly
    setLoading(true);
    setShowQuestionResult(false);
    const checkInterval = setInterval(() => {
      setQuestions(current => {
        if (nextIdx < current.length) {
          clearInterval(checkInterval);
          setCurrentIndex(nextIdx);
          setSlotContents(new Array(current[nextIdx].puzzle.slots_count).fill(null));
          setLoading(false);
        }
        return current;
      });
    }, 300);

    // Safety timeout - complete session if question never arrives
    setTimeout(() => {
      clearInterval(checkInterval);
      setLoading(false);
      setSessionComplete(true);
    }, 15000);
  }, [currentIndex, questions]);

  const forceCompleteSession = useCallback(() => {
    setQuestionResults((prev) => {
      const next = [...prev];
      const currentQ = questions[currentIndex];
      if (currentQ && next.length === currentIndex) {
        const userOrder = slotContents.filter(Boolean) as string[];
        const correctOrder = currentQ.puzzle.correct_order;
        const isCorrect =
          userOrder.length === correctOrder.length &&
          userOrder.every((id, i) => id === correctOrder[i]);
        next.push({ questionIndex: currentIndex, userOrder, correctOrder, isCorrect });
      }
      for (let i = next.length; i < questions.length; i++) {
        const q = questions[i];
        next.push({
          questionIndex: i,
          userOrder: [],
          correctOrder: q.puzzle.correct_order,
          isCorrect: false,
        });
      }
      return next;
    });
    setSessionComplete(true);
    setShowQuestionResult(false);
  }, [currentIndex, questions, slotContents]);

  const retrySession = useCallback(() => {
    // Cancel any ongoing background generation
    bgAbortRef.current = true;
    // Start a fresh session with progressive loading
    loadSession();
  }, [loadSession]);

  const saveHistory = useCallback(async (elapsedTime: number, targetTime: number, practiceMode?: BuildSentencePracticeMode) => {
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
      practiceMode: practiceMode ?? 'timed',
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
    forceCompleteSession,
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
