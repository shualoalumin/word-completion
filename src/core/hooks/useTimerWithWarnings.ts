import { useEffect, useRef } from 'react';
import { useTimer, UseTimerOptions, UseTimerReturn } from './useTimer';

export interface WarningCallbacks {
  /** Called once when 67% of target time is reached */
  onWarningThreshold?: () => void;
  /** Called once when 100% of target time is reached */
  onTargetReached?: () => void;
  /** Called once when overtime begins */
  onOvertimeStart?: () => void;
}

export interface UseTimerWithWarningsOptions extends UseTimerOptions {
  /** Target completion time for this difficulty level (in seconds) */
  targetTime: number;
  /** Warning callbacks */
  callbacks?: WarningCallbacks;
}

export interface UseTimerWithWarningsReturn extends UseTimerReturn {
  /** Target completion time */
  targetTime: number;
  /** Progress percentage (0-100+) */
  progressPercent: number;
  /** Current color zone: 'green' | 'yellow' | 'red' */
  colorZone: 'green' | 'yellow' | 'red';
}

/**
 * Extended timer hook with warning thresholds for optimal pacing
 *
 * Fires callbacks at key milestones:
 * - 67% of target: Warning zone (yellow)
 * - 100% of target: Target reached
 * - Overtime: Exceeded target (red)
 *
 * Each callback fires only once per timer session.
 */
export function useTimerWithWarnings({
  duration,
  targetTime,
  autoStart = false,
  onComplete,
  callbacks,
}: UseTimerWithWarningsOptions): UseTimerWithWarningsReturn {
  const timer = useTimer({ duration, autoStart, onComplete });

  // Track which callbacks have been fired
  const warningFiredRef = useRef(false);
  const targetFiredRef = useRef(false);
  const overtimeFiredRef = useRef(false);

  // Calculate progress percentage
  const progressPercent = targetTime > 0 ? Math.min((timer.elapsed / targetTime) * 100, 100) : 0;

  // Determine color zone
  const colorZone: 'green' | 'yellow' | 'red' =
    timer.isOvertime || progressPercent >= 100
      ? 'red'
      : progressPercent >= 67
      ? 'yellow'
      : 'green';

  // Fire warning callback at 67% threshold
  useEffect(() => {
    if (
      timer.isActive &&
      !warningFiredRef.current &&
      progressPercent >= 67 &&
      progressPercent < 100 &&
      callbacks?.onWarningThreshold
    ) {
      warningFiredRef.current = true;
      callbacks.onWarningThreshold();
    }
  }, [timer.isActive, progressPercent, callbacks]);

  // Fire target reached callback at 100%
  useEffect(() => {
    if (
      timer.isActive &&
      !targetFiredRef.current &&
      timer.elapsed >= targetTime &&
      !timer.isOvertime &&
      callbacks?.onTargetReached
    ) {
      targetFiredRef.current = true;
      callbacks.onTargetReached();
    }
  }, [timer.isActive, timer.elapsed, targetTime, timer.isOvertime, callbacks]);

  // Fire overtime callback when overtime begins
  useEffect(() => {
    if (
      timer.isActive &&
      !overtimeFiredRef.current &&
      timer.isOvertime &&
      callbacks?.onOvertimeStart
    ) {
      overtimeFiredRef.current = true;
      callbacks.onOvertimeStart();
    }
  }, [timer.isActive, timer.isOvertime, callbacks]);

  // Reset fired flags when timer is reset
  useEffect(() => {
    if (!timer.isActive && timer.elapsed === 0) {
      warningFiredRef.current = false;
      targetFiredRef.current = false;
      overtimeFiredRef.current = false;
    }
  }, [timer.isActive, timer.elapsed]);

  return {
    ...timer,
    targetTime,
    progressPercent,
    colorZone,
  };
}
