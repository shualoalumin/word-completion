import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseTimerOptions {
  duration: number;          // in seconds
  autoStart?: boolean;
  onComplete?: () => void;   // called when timer reaches 0
}

export interface UseTimerReturn {
  // State
  remaining: number;
  overtime: number;
  isOvertime: boolean;
  isActive: boolean;
  
  // Actions
  start: () => void;
  stop: () => void;
  reset: () => void;
  
  // Computed
  elapsed: number;
  totalElapsed: number;      // including overtime
}

export function useTimer({
  duration,
  autoStart = false,
  onComplete,
}: UseTimerOptions): UseTimerReturn {
  const [remaining, setRemaining] = useState(duration);
  const [overtime, setOvertime] = useState(0);
  const [isActive, setIsActive] = useState(autoStart);
  
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  
  const hasCalledComplete = useRef(false);

  // Timer tick effect
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      if (remaining > 0) {
        setRemaining(prev => {
          const next = prev - 1;
          if (next === 0 && !hasCalledComplete.current) {
            hasCalledComplete.current = true;
            onCompleteRef.current?.();
          }
          return next;
        });
      } else {
        setOvertime(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, remaining]);

  const start = useCallback(() => {
    setIsActive(true);
  }, []);

  const stop = useCallback(() => {
    setIsActive(false);
  }, []);

  const reset = useCallback(() => {
    setRemaining(duration);
    setOvertime(0);
    setIsActive(false);
    hasCalledComplete.current = false;
  }, [duration]);

  const isOvertime = remaining <= 0;
  const elapsed = duration - remaining;
  const totalElapsed = isOvertime ? duration + overtime : elapsed;

  return {
    remaining,
    overtime,
    isOvertime,
    isActive,
    start,
    stop,
    reset,
    elapsed,
    totalElapsed,
  };
}





