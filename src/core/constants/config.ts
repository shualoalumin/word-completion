// App configuration constants

export const TIMER_CONFIG = {
  TEXT_COMPLETION: 150,      // 2 minutes 30 seconds
  BUILD_SENTENCE: 120,       // 2 minutes
  DEFAULT: 180,
} as const;

export const EXERCISE_CONFIG = {
  TEXT_COMPLETION: {
    QUESTIONS_PER_PASSAGE: 10,
    WORD_COUNT_MIN: 70,
    WORD_COUNT_MAX: 90,
  },
  BUILD_SENTENCE: {
    QUESTIONS_PER_SET: 5,
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







