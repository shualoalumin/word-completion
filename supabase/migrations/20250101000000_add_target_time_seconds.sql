-- Add target_time_seconds to user_exercise_history for analytics (target time by difficulty)
ALTER TABLE public.user_exercise_history
ADD COLUMN IF NOT EXISTS target_time_seconds integer NULL;

COMMENT ON COLUMN public.user_exercise_history.target_time_seconds IS 'Target completion time in seconds for this difficulty (e.g. 60/90/120).';
