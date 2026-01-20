-- User Usage Limits Schema
-- 사용량 제한: 프리미엄 모델 준비 및 리소스 관리

CREATE TABLE IF NOT EXISTS user_usage_limits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_exercises_used INT DEFAULT 0,
  daily_exercises_limit INT DEFAULT 10,   -- 무료=10, 프리미엄=무제한 (NULL)
  daily_ai_generations_used INT DEFAULT 0,
  monthly_ai_generations_used INT DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_usage_limits_reset_date ON user_usage_limits(last_reset_date);

-- RLS Policies
ALTER TABLE user_usage_limits ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage limits
CREATE POLICY "Users can view their own usage limits"
  ON user_usage_limits FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own usage limits (for incrementing counters)
CREATE POLICY "Users can update their own usage limits"
  ON user_usage_limits FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can insert (for initialization)
CREATE POLICY "Service role can insert usage limits"
  ON user_usage_limits FOR INSERT
  WITH CHECK (true);

-- Function to reset daily limits (called by cron job or trigger)
CREATE OR REPLACE FUNCTION reset_daily_usage_limits()
RETURNS void AS $$
BEGIN
  UPDATE user_usage_limits
  SET 
    daily_exercises_used = 0,
    daily_ai_generations_used = 0,
    last_reset_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE last_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and increment exercise usage
CREATE OR REPLACE FUNCTION check_and_increment_exercise_usage(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_usage INT;
  usage_limit INT;
  last_reset DATE;
BEGIN
  -- Get or create usage limit record
  INSERT INTO user_usage_limits (user_id, daily_exercises_used, daily_exercises_limit, last_reset_date)
  VALUES (user_uuid, 0, 10, CURRENT_DATE)
  ON CONFLICT (user_id) DO NOTHING;

  -- Get current usage
  SELECT daily_exercises_used, daily_exercises_limit, last_reset_date
  INTO current_usage, usage_limit, last_reset
  FROM user_usage_limits
  WHERE user_id = user_uuid;

  -- Reset if it's a new day
  IF last_reset < CURRENT_DATE THEN
    UPDATE user_usage_limits
    SET 
      daily_exercises_used = 0,
      last_reset_date = CURRENT_DATE,
      updated_at = NOW()
    WHERE user_id = user_uuid;
    current_usage := 0;
  END IF;

  -- Check if limit is reached (NULL limit means unlimited)
  IF usage_limit IS NOT NULL AND current_usage >= usage_limit THEN
    RETURN FALSE;
  END IF;

  -- Increment usage
  UPDATE user_usage_limits
  SET 
    daily_exercises_used = daily_exercises_used + 1,
    updated_at = NOW()
  WHERE user_id = user_uuid;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
