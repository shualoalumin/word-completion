import { useState, useCallback, useRef, useEffect } from 'react';
import { TextCompletionPassage, TextCompletionBlank, TextCompletionPart, UserAnswers, isBlankPart } from '../types';
import { generatePassage, saveExerciseHistory, findExerciseId, loadExerciseById } from '../api';
import { UI_CONFIG } from '@/core/constants';

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
  
  // Computed
  blanks: TextCompletionBlank[];
  blankOrder: number[];
  score: number;
  exerciseId: string | null;
  
  // Actions
  loadNewPassage: () => Promise<void>;
  loadSpecificExercise: (exerciseId: string) => Promise<void>;
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

  // Load new passage (generate new)
  const loadNewPassage = useCallback(async () => {
    setLoading(true);
    setPassage(null);
    setUserAnswers({});
    setShowResults(false);
    setError(null);
    setIsReviewMode(false);
    inputRefs.current.clear();
    blankOrderRef.current = [];
    startTimeRef.current = null; // Reset start time

    const result = await generatePassage();

    if (result.error) {
      setError('Failed to generate passage. Please try again.');
    } else if (result.data) {
      // 공백 정규화 적용 (AI 생성 데이터의 공백 누락 수정)
      const normalizedPassage = normalizeSpacing(result.data);
      const newBlanks = normalizedPassage.content_parts.filter(isBlankPart) as TextCompletionBlank[];
      blankOrderRef.current = newBlanks.map((b) => b.id);
      setPassage(normalizedPassage);
      // Record start time when passage loads
      startTimeRef.current = Date.now();
      
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
    inputRefs.current.clear();
    blankOrderRef.current = [];
    startTimeRef.current = null;

    const result = await loadExerciseById(targetExerciseId);

    if (result.error) {
      setError('Failed to load exercise. It may have been deleted.');
      setIsReviewMode(false);
    } else if (result.data) {
      const normalizedPassage = normalizeSpacing(result.data);
      const newBlanks = normalizedPassage.content_parts.filter(isBlankPart) as TextCompletionBlank[];
      blankOrderRef.current = newBlanks.map((b) => b.id);
      setPassage(normalizedPassage);
      startTimeRef.current = Date.now();
      setExerciseId(targetExerciseId);
    }

    setLoading(false);
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
    
    // Save history (only if authenticated)
    try {
      const result = await saveExerciseHistory(passage, {
        score: correctCount,
        maxScore: totalQuestions,
        scorePercent,
        timeSpentSeconds,
        answers: userAnswers,
        mistakes,
        difficulty: passage.difficulty,
        topicCategory: passage.topic_category,
      });
      
      if (result.error) {
        // Silently log error - don't disrupt user experience
        console.error('Failed to save exercise history:', result.error);
      } else if (result.success) {
        console.log('Exercise history saved successfully:', result.historyId);
        // Invalidate queries to refresh Recent Activity and Dashboard stats
        queryClient.invalidateQueries({ queryKey: ['recent-activity'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      }
    } catch (err) {
      // Silently handle errors - optional auth pattern
      console.error('Unexpected error saving exercise history:', err);
    }
  }, [passage, showResults, blanks, userAnswers]);

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
    blanks,
    blankOrder,
    score,
    exerciseId,
    loadNewPassage,
    loadSpecificExercise,
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
  };
}






