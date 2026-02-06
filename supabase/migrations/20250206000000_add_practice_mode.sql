-- Add practice_mode to user_exercise_history for Build Sentence (untimed / timed / test)
ALTER TABLE public.user_exercise_history
ADD COLUMN IF NOT EXISTS practice_mode text NULL;

COMMENT ON COLUMN public.user_exercise_history.practice_mode IS 'Build Sentence only: untimed | timed | test. NULL for text-completion or legacy.';
