import { useState, useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { TextCompletionPassage, TextCompletionBlank, TextCompletionPart, UserAnswers, isBlankPart } from '../types';
import { generatePassage, getRecentTextCompletionExerciseIds, saveExerciseHistory, findExerciseId, loadExerciseById, loadHistoryRecordById } from '../api';
import { UI_CONFIG, TIMER_TARGET_BY_DIFFICULTY } from '@/core/constants';
import { toast } from 'sonner';

/**
 * 공백 정규화 함수 (Fallback)
 * 
 * NOTE: 현재는 Edge Function(BE)에서 정규화된 데이터를 반환하므로
 * 이 로직은 네트워크 오류나 예상치 못한 케이스를 대비한 '안전장치'로만 동작합니다.
 * BE 로직과 동일한 규칙을 따릅니다.
 */
function normalizeSpacing(passage: TextCompletionPassage): TextCompletionPassage {
  const parts = passage.content_parts;
  const normalizedParts: TextCompletionPart[] = [];

  for (let i = 0; i < parts.length; i++) {
    const current = parts[i];
    const next = parts[i + 1];

    if (current.type === 'text') {
      let value = current.value;

      // 다음이 blank인데, 현재 text가 공백으로 끝나지 않으면 공백 추가
      if (next && isBlankPart(next)) {
        if (value.length > 0 && !/\s$/.test(value)) {
          value = value + ' ';
        }
      }

      normalizedParts.push({ ...current, value });
    } else if (isBlankPart(current)) {
      normalizedParts.push(current);

      // 다음이 text인데, 공백/구두점으로 시작하지 않으면 공백 삽입
      if (next && next.type === 'text') {
        const nextValue = next.value;
        // 구두점(.,!?;:)이나 공백으로 시작하지 않으면
        if (nextValue.length > 0 && !/^[\s.,!?;:']/.test(nextValue)) {
          // 다음 text 앞에 공백 추가 (다음 루프에서 처리하기 위해 원본 수정)
          parts[i + 1] = { ...next, value: ' ' + nextValue };
        }
      }
    } else {
      normalizedParts.push(current);
    }
  }

  return { ...passage, content_parts: normalizedParts };
}

export interface UseTextCompletionReturn {
  // State
  loading: boolean;
  passage: TextCompletionPassage | null;
  userAnswers: UserAnswers;
  showResults: boolean;
  error: string | null;
  isReviewMode: boolean;
  historyTimeSpent: number | null;
  
  // Computed
  blanks: TextCompletionBlank[];
  blankOrder: number[];
  score: number;
  exerciseId: string | null;
  
  // Actions
  loadNewPassage: () => Promise<void>;
  loadSpecificExercise: (exerciseId: string) => Promise<void>;
  loadHistoryReview: (historyId: string) => Promise<void>;
  retryCurrentExercise: () => void;
  updateAnswer: (wordId: number, answer: string) => void;
  checkAnswers: () => Promise<void>;
  
  // Focus management
  inputRefs: React.MutableRefObject<Map<string, HTMLInputElement>>;
  focusTarget: React.MutableRefObject<string | null>;
  lastFocusedKey: React.MutableRefObject<string | null>;
  focusLocked: React.MutableRefObject<boolean>;
  setInputRef: (key: string, el: HTMLInputElement | null) => void;
  scheduleFocus: (wordId: number, charIndex: number) => void;
  getBlankLength: (wordId: number) => number;
  getPrevBlank: (wordId: number) => { wordId: number; length: number } | null;
  getNextBlank: (wordId: number) => { wordId: number; length: number } | null;
  /** Start timing (call when countdown completes so saved time excludes Get Ready + countdown) */
  startTiming: () => void;
}

export function useTextCompletion(): UseTextCompletionReturn {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [passage, setPassage] = useState<TextCompletionPassage | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [historyTimeSpent, setHistoryTimeSpent] = useState<number | null>(null);
  
  // Focus management refs
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const blankOrderRef = useRef<number[]>([]);
  const focusTarget = useRef<string | null>(null);
  const lastFocusedKey = useRef<string | null>(null);
  const focusLocked = useRef(false);
  
  // Track start time for calculating time spent
  const startTimeRef = useRef<number | null>(null);

  // Computed values
  const blanks: TextCompletionBlank[] = passage
    ? (passage.content_parts.filter(isBlankPart) as TextCompletionBlank[])
    : [];
  
  const blankOrder = blankOrderRef.current;

  // Calculate score
  const score = blanks.reduce((acc, blank) => {
    const suffix = blank.full_word.slice(blank.prefix.length);
    const userSuffix = userAnswers[blank.id] || '';
    return acc + (userSuffix.toLowerCase() === suffix.toLowerCase() ? 1 : 0);
  }, 0);

  /** Start timing (called when timer starts / countdown completes so saved time = actual solving time only) */
  const startTiming = useCallback(() => {
    startTimeRef.current = Date.now();
  }, []);

  // Load new passage (generate new)
  const loadNewPassage = useCallback(async () => {
    setLoading(true);
    setPassage(null);
    setUserAnswers({});
    setShowResults(false);
    setError(null);
    setIsReviewMode(false);
    setHistoryTimeSpent(null);
    inputRefs.current.clear();
    blankOrderRef.current = [];
    startTimeRef.current = null; // Reset start time

    const excludeIds = await getRecentTextCompletionExerciseIds(30);
    const result = await generatePassage(0, { excludeExerciseIds: excludeIds });

    if (result.error) {
      setError('Failed to generate passage. Please try again.');
    } else if (result.data) {
      // 공백 정규화 적용 (AI 생성 데이터의 공백 누락 수정)
      const normalizedPassage = normalizeSpacing(result.data);
      const newBlanks = normalizedPassage.content_parts.filter(isBlankPart) as TextCompletionBlank[];
      blankOrderRef.current = newBlanks.map((b) => b.id);
      setPassage(normalizedPassage);
      // startTimeRef set when countdown completes (startTiming) so saved time excludes Get Ready + countdown
      
      // Use exercise_id from Edge Function response (if available)
      // Otherwise fallback to findExerciseId
      if (result.data.exercise_id) {
        setExerciseId(result.data.exercise_id);
      } else {
        // Fallback for cached exercises without exercise_id
        const foundExerciseId = await findExerciseId(normalizedPassage);
        setExerciseId(foundExerciseId);
      }
    }

    setLoading(false);
  }, []);

  // Load specific exercise by ID (for review mode)
  const loadSpecificExercise = useCallback(async (targetExerciseId: string) => {
    setLoading(true);
    setPassage(null);
    setUserAnswers({});
    setShowResults(false);
    setError(null);
    setIsReviewMode(true);
    setHistoryTimeSpent(null);
    inputRefs.current.clear();
    blankOrderRef.current = [];
    startTimeRef.current = null; // Set when countdown completes via startTiming()

    const result = await loadExerciseById(targetExerciseId);

    if (result.error) {
      setError('Failed to load exercise. It may have been deleted.');
      setIsReviewMode(false);
    } else if (result.data) {
      const normalizedPassage = normalizeSpacing(result.data);
      const newBlanks = normalizedPassage.content_parts.filter(isBlankPart) as TextCompletionBlank[];
      blankOrderRef.current = newBlanks.map((b) => b.id);
      setPassage(normalizedPassage);
      // startTimeRef set when timer starts (startTiming) in index
      setExerciseId(targetExerciseId);
    }

    setLoading(false);
  }, []);

  // Load specific history record (to see "Check Answer" results)
  const loadHistoryReview = useCallback(async (historyId: string) => {
    setLoading(true);
    setPassage(null);
    setUserAnswers({});
    setShowResults(false);
    setError(null);
    setIsReviewMode(true);
    inputRefs.current.clear();
    blankOrderRef.current = [];
    startTimeRef.current = null;

    // 1. Fetch history record
    const historyResult = await loadHistoryRecordById(historyId);
    if (historyResult.error || !historyResult.data) {
      setError('Failed to load history record.');
      setLoading(false);
      return;
    }

    const { exercise_id, answers } = historyResult.data;

    // 2. Fetch exercise content
    const exerciseResult = await loadExerciseById(exercise_id);
    if (exerciseResult.error || !exerciseResult.data) {
      setError('Failed to load exercise content.');
      setLoading(false);
      return;
    }

    // Normalize answers: DB/JSON stores keys as strings; we use number keys for userAnswers
    const normalizedAnswers: UserAnswers = {};
    const raw = answers || {};
    Object.keys(raw).forEach((k) => {
      const numKey = Number(k);
      if (!Number.isNaN(numKey) && typeof raw[k] === 'string') {
        normalizedAnswers[numKey] = raw[k];
      }
    });

    // 3. Set state
    const normalizedPassage = normalizeSpacing(exerciseResult.data);
    const newBlanks = normalizedPassage.content_parts.filter(isBlankPart) as TextCompletionBlank[];
    blankOrderRef.current = newBlanks.map((b) => b.id);
    setPassage(normalizedPassage);
    setUserAnswers(normalizedAnswers);
    setShowResults(true);
    setHistoryTimeSpent(historyResult.data.time_spent_seconds || null); // Load historic time
    setExerciseId(exercise_id);

    setLoading(false);
  }, []);

  // Retry current exercise (clear results and answers)
  const retryCurrentExercise = useCallback(() => {
    setUserAnswers({});
    setShowResults(false);
    setHistoryTimeSpent(null);
    // startTimeRef set when timer starts (startTiming) in index
  }, []);

  // Update answer
  const updateAnswer = useCallback((wordId: number, answer: string) => {
    setUserAnswers((prev) => ({ ...prev, [wordId]: answer }));
  }, []);

  // Check answers and save history
  const checkAnswers = useCallback(async () => {
    if (!passage || showResults) return;
    
    setShowResults(true);
    
    // Calculate time spent
    const timeSpentSeconds = startTimeRef.current 
      ? Math.floor((Date.now() - startTimeRef.current) / 1000)
      : 0;
    
    // Calculate score directly in this function to avoid stale closure issues
    let correctCount = 0;
    const mistakes: Array<{
      blank_id: number;
      user_answer: string;
      correct_answer: string;
    }> = [];
    
    blanks.forEach((blank) => {
      const suffix = blank.full_word.slice(blank.prefix.length);
      const userAnswer = userAnswers[blank.id] || '';
      const isCorrect = userAnswer.toLowerCase() === suffix.toLowerCase();
      
      if (isCorrect) {
        correctCount++;
      } else {
        mistakes.push({
          blank_id: blank.id,
          user_answer: userAnswer,
          correct_answer: suffix,
        });
      }
    });
    
    // Calculate score percent (avoid division by zero)
    const totalQuestions = blanks.length;
    const scorePercent = totalQuestions > 0 
      ? Math.round((correctCount / totalQuestions) * 100) 
      : 0;
    
    console.log(`[checkAnswers] Score: ${correctCount}/${totalQuestions} = ${scorePercent}%`);
    
    const targetTimeSeconds = passage.difficulty
      ? TIMER_TARGET_BY_DIFFICULTY[passage.difficulty]
      : TIMER_TARGET_BY_DIFFICULTY.intermediate;

    try {
      const result = await saveExerciseHistory(passage, {
        score: correctCount,
        maxScore: totalQuestions,
        scorePercent,
        timeSpentSeconds,
        targetTimeSeconds,
        answers: userAnswers,
        mistakes,
        difficulty: passage.difficulty,
        topicCategory: passage.topic_category,
      });

      if (result.error) {
        console.error('Failed to save exercise history:', result.error);
        toast.error('Progress could not be saved. Please try again.');
      } else       if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        queryClient.invalidateQueries({ queryKey: ['exercise-history'] });
      }
    } catch (err) {
      console.error('Unexpected error saving exercise history:', err);
      toast.error('Progress could not be saved.');
    }
  }, [passage, showResults, blanks, userAnswers, queryClient]);

  // Focus management
  const setInputRef = useCallback((key: string, el: HTMLInputElement | null) => {
    if (el) {
      inputRefs.current.set(key, el);
    } else {
      inputRefs.current.delete(key);
    }
  }, []);

  const scheduleFocus = useCallback((wordId: number, charIndex: number) => {
    focusTarget.current = `${wordId}-${charIndex}`;
  }, []);

  const getBlankLength = useCallback(
    (wordId: number) => {
      const blank = blanks.find((b) => b.id === wordId);
      if (!blank) return 0;
      return blank.full_word.length - blank.prefix.length;
    },
    [blanks]
  );

  const getPrevBlank = useCallback(
    (wordId: number) => {
      const idx = blankOrder.indexOf(wordId);
      if (idx <= 0) return null;
      const prevWordId = blankOrder[idx - 1];
      return { wordId: prevWordId, length: getBlankLength(prevWordId) };
    },
    [blankOrder, getBlankLength]
  );

  const getNextBlank = useCallback(
    (wordId: number) => {
      const idx = blankOrder.indexOf(wordId);
      if (idx < 0 || idx >= blankOrder.length - 1) return null;
      const nextWordId = blankOrder[idx + 1];
      return { wordId: nextWordId, length: getBlankLength(nextWordId) };
    },
    [blankOrder, getBlankLength]
  );

  // Apply scheduled focus after each render
  useEffect(() => {
    if (focusTarget.current) {
      const input = inputRefs.current.get(focusTarget.current);
      if (input) {
        focusLocked.current = true;
        input.focus();
        lastFocusedKey.current = focusTarget.current;
        requestAnimationFrame(() => {
          input.focus();
          const len = input.value.length;
          input.setSelectionRange(len, len);
          setTimeout(() => {
            focusLocked.current = false;
          }, UI_CONFIG.FOCUS_LOCK_DURATION);
        });
      }
      focusTarget.current = null;
    }
  });

  // Maintain focus - prevent focus loss
  useEffect(() => {
    if (showResults || !passage) return;

    const checkFocus = () => {
      if (focusLocked.current) return;

      const activeEl = document.activeElement;
      const isOurInput =
        activeEl &&
        activeEl.tagName === 'INPUT' &&
        activeEl.getAttribute('type') === 'text' &&
        Array.from(inputRefs.current.values()).includes(activeEl as HTMLInputElement);

      if (isOurInput) {
        const key = Array.from(inputRefs.current.entries()).find(
          ([, el]) => el === activeEl
        )?.[0];
        if (key) lastFocusedKey.current = key;
      } else {
        const keyToFocus = lastFocusedKey.current || `${blankOrderRef.current[0]}-0`;
        const input = inputRefs.current.get(keyToFocus);
        if (input) {
          focusLocked.current = true;
          input.focus();
          setTimeout(() => {
            focusLocked.current = false;
          }, UI_CONFIG.FOCUS_LOCK_DURATION);
        }
      }
    };

    const interval = setInterval(checkFocus, UI_CONFIG.FOCUS_CHECK_INTERVAL);

    // Initial focus
    setTimeout(() => {
      if (blankOrderRef.current.length > 0) {
        const firstKey = `${blankOrderRef.current[0]}-0`;
        const input = inputRefs.current.get(firstKey);
        if (input) {
          focusLocked.current = true;
          input.focus();
          lastFocusedKey.current = firstKey;
          setTimeout(() => {
            focusLocked.current = false;
          }, UI_CONFIG.FOCUS_LOCK_DURATION);
        }
      }
    }, UI_CONFIG.INITIAL_FOCUS_DELAY);

    return () => clearInterval(interval);
  }, [showResults, passage]);

  return {
    loading,
    passage,
    userAnswers,
    showResults,
    error,
    isReviewMode,
    historyTimeSpent,
    blanks,
    blankOrder,
    score,
    exerciseId,
    loadNewPassage,
    loadSpecificExercise,
    loadHistoryReview,
    retryCurrentExercise,
    updateAnswer,
    checkAnswers,
    inputRefs,
    focusTarget,
    lastFocusedKey,
    focusLocked,
    setInputRef,
    scheduleFocus,
    getBlankLength,
    getPrevBlank,
    getNextBlank,
    startTiming,
  };
}






