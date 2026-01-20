-- ============================================================================
-- user_skills 테이블 생성
-- 생성일: 2026-01-18
-- 목적: 스킬별 숙련도 추적 (vocabulary, grammar, inference)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_skills (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_type TEXT NOT NULL,                    -- 'vocabulary', 'grammar', 'inference'
  proficiency_score DECIMAL(3,2) DEFAULT 0.00, -- 0.00 ~ 1.00
  exercises_completed INT DEFAULT 0,
  correct_rate DECIMAL(5,2) DEFAULT 0.00,      -- 0.00 ~ 100.00
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, skill_type)
);

CREATE INDEX IF NOT EXISTS idx_user_skills_user ON user_skills (user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_type ON user_skills (skill_type);

-- RLS 정책
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own skills"
  ON user_skills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own skills"
  ON user_skills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skills"
  ON user_skills FOR UPDATE
  USING (auth.uid() = user_id);

-- 스킬 점수 업데이트 함수
CREATE OR REPLACE FUNCTION update_user_skill_proficiency()
RETURNS TRIGGER AS $$
BEGIN
  -- 문제 풀이 완료 시 스킬 점수 자동 업데이트
  INSERT INTO user_skills (user_id, skill_type, proficiency_score, exercises_completed, correct_rate, last_updated_at)
  VALUES (
    NEW.user_id,
    'vocabulary', -- 기본적으로 vocabulary 스킬로 추적
    LEAST(1.00, (NEW.score_percent / 100.0)),
    1,
    NEW.score_percent,
    NOW()
  )
  ON CONFLICT (user_id, skill_type) DO UPDATE SET
    proficiency_score = LEAST(1.00, (
      (user_skills.proficiency_score * user_skills.exercises_completed + (NEW.score_percent / 100.0)) / 
      (user_skills.exercises_completed + 1)
    )),
    exercises_completed = user_skills.exercises_completed + 1,
    correct_rate = (
      (user_skills.correct_rate * user_skills.exercises_completed + NEW.score_percent) / 
      (user_skills.exercises_completed + 1)
    ),
    last_updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거: user_exercise_history에 기록이 추가될 때 스킬 점수 업데이트
CREATE TRIGGER trigger_update_user_skills
  AFTER INSERT ON user_exercise_history
  FOR EACH ROW
  EXECUTE FUNCTION update_user_skill_proficiency();
