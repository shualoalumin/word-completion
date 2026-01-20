-- ============================================================================
-- user_learning_patterns 테이블 생성
-- 생성일: 2026-01-18
-- 목적: 시간대별 학습 패턴 분석
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_learning_patterns (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hour_of_day INT NOT NULL CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),  -- 0=월요일
  avg_score_percent DECIMAL(5,2) DEFAULT 0.00,
  avg_time_spent_seconds INT DEFAULT 0,
  exercises_count INT DEFAULT 0,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, hour_of_day, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_patterns_user ON user_learning_patterns (user_id);
CREATE INDEX IF NOT EXISTS idx_patterns_hour_day ON user_learning_patterns (hour_of_day, day_of_week);

-- RLS 정책
ALTER TABLE user_learning_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own learning patterns"
  ON user_learning_patterns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learning patterns"
  ON user_learning_patterns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning patterns"
  ON user_learning_patterns FOR UPDATE
  USING (auth.uid() = user_id);

-- 학습 패턴 업데이트 함수
CREATE OR REPLACE FUNCTION update_learning_pattern()
RETURNS TRIGGER AS $$
DECLARE
  v_hour INT;
  v_day_of_week INT;
BEGIN
  -- 현재 시간대와 요일 추출
  v_hour := EXTRACT(HOUR FROM NEW.completed_at);
  v_day_of_week := EXTRACT(DOW FROM NEW.completed_at);
  
  -- 학습 패턴 업데이트
  INSERT INTO user_learning_patterns (
    user_id, 
    hour_of_day, 
    day_of_week, 
    avg_score_percent, 
    avg_time_spent_seconds, 
    exercises_count, 
    last_updated_at
  )
  VALUES (
    NEW.user_id,
    v_hour,
    v_day_of_week,
    NEW.score_percent,
    NEW.time_spent_seconds,
    1,
    NOW()
  )
  ON CONFLICT (user_id, hour_of_day, day_of_week) DO UPDATE SET
    avg_score_percent = (
      (user_learning_patterns.avg_score_percent * user_learning_patterns.exercises_count + NEW.score_percent) / 
      (user_learning_patterns.exercises_count + 1)
    ),
    avg_time_spent_seconds = (
      (user_learning_patterns.avg_time_spent_seconds * user_learning_patterns.exercises_count + NEW.time_spent_seconds) / 
      (user_learning_patterns.exercises_count + 1)
    ),
    exercises_count = user_learning_patterns.exercises_count + 1,
    last_updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거: user_exercise_history에 기록이 추가될 때 학습 패턴 업데이트
CREATE TRIGGER trigger_update_learning_pattern
  AFTER INSERT ON user_exercise_history
  FOR EACH ROW
  EXECUTE FUNCTION update_learning_pattern();
