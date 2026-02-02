// App configuration constants

export const TIMER_CONFIG = {
  TEXT_COMPLETION: 150,      // 2 minutes 30 seconds
  BUILD_SENTENCE: 330,       // 5 minutes 30 seconds
  DEFAULT: 180,
} as const;

// Target completion times by difficulty (in seconds)
export const TIMER_TARGET_BY_DIFFICULTY = {
  easy: 60,           // 1 minute
  intermediate: 90,   // 1.5 minutes
  hard: 120,          // 2 minutes
} as const;

export const EXERCISE_CONFIG = {
  TEXT_COMPLETION: {
    QUESTIONS_PER_PASSAGE: 10,
    WORD_COUNT_MIN: 70,
    WORD_COUNT_MAX: 90,
  },
  BUILD_SENTENCE: {
    QUESTIONS_PER_SET: 10,
  },
} as const;

export const API_CONFIG = {
  RETRY_COUNT: 3,
  RETRY_DELAY: 1000,  // ms
} as const;

export const UI_CONFIG = {
  FOCUS_CHECK_INTERVAL: 150,  // ms
  FOCUS_LOCK_DURATION: 100,   // ms
  INITIAL_FOCUS_DELAY: 200,   // ms
} as const;







