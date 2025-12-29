import { useState, useCallback, useRef, useEffect } from 'react';
import { TextCompletionPassage, TextCompletionBlank, UserAnswers, isBlankPart } from '../types';
import { generatePassage } from '../api';
import { UI_CONFIG } from '@/core/constants';

export interface UseTextCompletionReturn {
  // State
  loading: boolean;
  passage: TextCompletionPassage | null;
  userAnswers: UserAnswers;
  showResults: boolean;
  error: string | null;
  
  // Computed
  blanks: TextCompletionBlank[];
  blankOrder: number[];
  score: number;
  
  // Actions
  loadNewPassage: () => Promise<void>;
  updateAnswer: (wordId: number, answer: string) => void;
  checkAnswers: () => void;
  
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
  const [loading, setLoading] = useState(false);
  const [passage, setPassage] = useState<TextCompletionPassage | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Focus management refs
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const blankOrderRef = useRef<number[]>([]);
  const focusTarget = useRef<string | null>(null);
  const lastFocusedKey = useRef<string | null>(null);
  const focusLocked = useRef(false);

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

  // Load new passage
  const loadNewPassage = useCallback(async () => {
    setLoading(true);
    setPassage(null);
    setUserAnswers({});
    setShowResults(false);
    setError(null);
    inputRefs.current.clear();
    blankOrderRef.current = [];

    const result = await generatePassage();

    if (result.error) {
      setError('Failed to generate passage. Please try again.');
    } else if (result.data) {
      const newBlanks = result.data.content_parts.filter(isBlankPart) as TextCompletionBlank[];
      blankOrderRef.current = newBlanks.map((b) => b.id);
      setPassage(result.data);
    }

    setLoading(false);
  }, []);

  // Update answer
  const updateAnswer = useCallback((wordId: number, answer: string) => {
    setUserAnswers((prev) => ({ ...prev, [wordId]: answer }));
  }, []);

  // Check answers
  const checkAnswers = useCallback(() => {
    setShowResults(true);
  }, []);

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
    blanks,
    blankOrder,
    score,
    loadNewPassage,
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



