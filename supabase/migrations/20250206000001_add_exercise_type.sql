-- Add exercise_type to user_exercise_history to distinguish between Text Completion and Build a Sentence
ALTER TABLE public.user_exercise_history
ADD COLUMN IF NOT EXISTS exercise_type text NULL DEFAULT 'text-completion';

COMMENT ON COLUMN public.user_exercise_history.exercise_type IS 'Exercise type: text-completion | build-sentence. Defaults to text-completion for backward compatibility.';

-- Create index for faster filtering by exercise type
CREATE INDEX IF NOT EXISTS idx_user_exercise_history_exercise_type
ON public.user_exercise_history(user_id, exercise_type, completed_at DESC);
