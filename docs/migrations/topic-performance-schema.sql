-- ============================================================================
-- user_topic_performance 테이블 생성
-- 생성일: 2026-01-18
-- 목적: 주제별 성과 추적
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_topic_performance (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_category TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  exercises_completed INT DEFAULT 0,
  avg_score_percent DECIMAL(5,2) DEFAULT 0.00,
  best_score_percent DECIMAL(5,2) DEFAULT 0.00,
  last_practiced_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, topic_category, difficulty)
);

CREATE INDEX IF NOT EXISTS idx_topic_performance_user ON user_topic_performance (user_id);
CREATE INDEX IF NOT EXISTS idx_topic_performance_category ON user_topic_performance (topic_category);

-- RLS 정책
ALTER TABLE user_topic_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own topic performance"
  ON user_topic_performance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own topic performance"
  ON user_topic_performance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own topic performance"
  ON user_topic_performance FOR UPDATE
  USING (auth.uid() = user_id);

-- 주제별 성과 업데이트 함수
CREATE OR REPLACE FUNCTION update_topic_performance()
RETURNS TRIGGER AS $$
BEGIN
  -- 주제별 성과 업데이트
  INSERT INTO user_topic_performance (
    user_id,
    topic_category,
    difficulty,
    exercises_completed,
    avg_score_percent,
    best_score_percent,
    last_practiced_at
  )
  VALUES (
    NEW.user_id,
    COALESCE(NEW.topic_category, 'General'),
    COALESCE(NEW.difficulty, 'intermediate'),
    1,
    NEW.score_percent,
    NEW.score_percent,
    NEW.completed_at
  )
  ON CONFLICT (user_id, topic_category, difficulty) DO UPDATE SET
    exercises_completed = user_topic_performance.exercises_completed + 1,
    avg_score_percent = (
      (user_topic_performance.avg_score_percent * user_topic_performance.exercises_completed + NEW.score_percent) / 
      (user_topic_performance.exercises_completed + 1)
    ),
    best_score_percent = GREATEST(user_topic_performance.best_score_percent, NEW.score_percent),
    last_practiced_at = NEW.completed_at;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거: user_exercise_history에 기록이 추가될 때 주제별 성과 업데이트
CREATE TRIGGER trigger_update_topic_performance
  AFTER INSERT ON user_exercise_history
  FOR EACH ROW
  EXECUTE FUNCTION update_topic_performance();
