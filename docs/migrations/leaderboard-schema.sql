-- Leaderboard Schema
-- 주간 리더보드: 경쟁 요소를 통한 동기부여

CREATE TABLE IF NOT EXISTS leaderboard_weekly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL, -- Monday of the week
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercises_completed INT DEFAULT 0,
  total_score INT DEFAULT 0,
  avg_score_percent DECIMAL(5,2) DEFAULT 0,
  streak_days INT DEFAULT 0,
  words_mastered INT DEFAULT 0,
  rank INT, -- Calculated rank for the week
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(week_start, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leaderboard_week_start ON leaderboard_weekly(week_start DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard_weekly(week_start, rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id ON leaderboard_weekly(user_id);

-- RLS Policies
ALTER TABLE leaderboard_weekly ENABLE ROW LEVEL SECURITY;

-- Anyone can view leaderboard (for competition)
CREATE POLICY "Anyone can view leaderboard"
  ON leaderboard_weekly FOR SELECT
  USING (true);

-- Service role can insert/update (for aggregation)
CREATE POLICY "Service role can manage leaderboard"
  ON leaderboard_weekly FOR ALL
  WITH CHECK (true);

-- Function to get current week start (Monday)
CREATE OR REPLACE FUNCTION get_week_start(date_val DATE DEFAULT CURRENT_DATE)
RETURNS DATE AS $$
BEGIN
  -- Get Monday of the week (0 = Monday, 6 = Sunday)
  RETURN date_val - (EXTRACT(DOW FROM date_val)::INT - 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update user's leaderboard entry
CREATE OR REPLACE FUNCTION update_leaderboard_entry(
  user_uuid UUID,
  week_start_date DATE DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  current_week_start DATE;
  exercises_count INT;
  total_score_val INT;
  avg_score DECIMAL;
  streak_days_val INT;
  words_mastered_val INT;
BEGIN
  -- Use provided week_start or calculate current week
  IF week_start_date IS NULL THEN
    current_week_start := get_week_start();
  ELSE
    current_week_start := week_start_date;
  END IF;

  -- Get aggregated stats from user_exercise_history
  SELECT 
    COUNT(*)::INT,
    COALESCE(SUM(score), 0)::INT,
    COALESCE(AVG(score_percent), 0),
    MAX(EXTRACT(DAY FROM (CURRENT_DATE - completed_at)))::INT
  INTO exercises_count, total_score_val, avg_score, streak_days_val
  FROM user_exercise_history
  WHERE user_id = user_uuid
    AND completed_at >= current_week_start
    AND completed_at < current_week_start + INTERVAL '7 days';

  -- Get words mastered count (from user_vocabulary where mastery_level >= 3)
  SELECT COUNT(*)::INT
  INTO words_mastered_val
  FROM user_vocabulary
  WHERE user_id = user_uuid
    AND mastery_level >= 3
    AND updated_at >= current_week_start;

  -- Insert or update leaderboard entry
  INSERT INTO leaderboard_weekly (
    week_start,
    user_id,
    exercises_completed,
    total_score,
    avg_score_percent,
    streak_days,
    words_mastered,
    updated_at
  )
  VALUES (
    current_week_start,
    user_uuid,
    exercises_count,
    total_score_val,
    avg_score,
    streak_days_val,
    words_mastered_val,
    NOW()
  )
  ON CONFLICT (week_start, user_id) DO UPDATE
  SET
    exercises_completed = EXCLUDED.exercises_completed,
    total_score = EXCLUDED.total_score,
    avg_score_percent = EXCLUDED.avg_score_percent,
    streak_days = EXCLUDED.streak_days,
    words_mastered = EXCLUDED.words_mastered,
    updated_at = NOW();

  -- Recalculate ranks for the week
  UPDATE leaderboard_weekly
  SET rank = subquery.rank
  FROM (
    SELECT 
      user_id,
      ROW_NUMBER() OVER (
        ORDER BY 
          exercises_completed DESC,
          avg_score_percent DESC,
          total_score DESC
      ) as rank
    FROM leaderboard_weekly
    WHERE week_start = current_week_start
  ) AS subquery
  WHERE leaderboard_weekly.user_id = subquery.user_id
    AND leaderboard_weekly.week_start = current_week_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
