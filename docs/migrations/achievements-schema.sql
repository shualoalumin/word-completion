-- Achievements System Schema
-- 업적 시스템: 사용자 동기부여 및 게이미피케이션

-- achievements: 업적 정의 테이블
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- 'first_exercise', 'streak_7', 'vocab_100', etc.
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT, -- 이모지 또는 아이콘 URL
  category TEXT NOT NULL, -- 'streak', 'vocabulary', 'exercises', 'score', 'social'
  points INT DEFAULT 0, -- 업적 포인트
  rarity TEXT DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- user_achievements: 사용자 업적 달성 기록
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);

-- RLS Policies
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- achievements: 모든 사용자가 읽기 가능
CREATE POLICY "Anyone can view achievements"
  ON achievements FOR SELECT
  USING (true);

-- user_achievements: 사용자는 자신의 업적만 조회 가능
CREATE POLICY "Users can view their own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

-- user_achievements: 서비스 역할만 삽입 가능 (트리거 함수에서 사용)
CREATE POLICY "Service role can insert user achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (true);

-- Initial achievements data
INSERT INTO achievements (code, name, description, icon, category, points, rarity) VALUES
  ('first_exercise', 'First Steps', 'Complete your first exercise', '🎯', 'exercises', 10, 'common'),
  ('streak_3', 'Getting Started', 'Maintain a 3-day streak', '🔥', 'streak', 20, 'common'),
  ('streak_7', 'Week Warrior', 'Maintain a 7-day streak', '🔥', 'streak', 50, 'rare'),
  ('streak_30', 'Month Master', 'Maintain a 30-day streak', '🔥', 'streak', 200, 'epic'),
  ('exercises_10', 'Dedicated Learner', 'Complete 10 exercises', '📚', 'exercises', 30, 'common'),
  ('exercises_50', 'Scholar', 'Complete 50 exercises', '📚', 'exercises', 100, 'rare'),
  ('exercises_100', 'Master', 'Complete 100 exercises', '📚', 'exercises', 300, 'epic'),
  ('vocab_10', 'Word Collector', 'Add 10 words to vocabulary', '📖', 'vocabulary', 25, 'common'),
  ('vocab_50', 'Lexicon Lover', 'Add 50 words to vocabulary', '📖', 'vocabulary', 80, 'rare'),
  ('vocab_100', 'Vocabulary Virtuoso', 'Add 100 words to vocabulary', '📖', 'vocabulary', 250, 'epic'),
  ('score_100', 'Perfect Score', 'Get 100% on an exercise', '💯', 'score', 50, 'rare'),
  ('score_90_plus', 'Excellence', 'Get 90% or higher on 10 exercises', '⭐', 'score', 100, 'rare'),
  ('daily_goal', 'Goal Getter', 'Complete your daily goal', '🎯', 'exercises', 15, 'common')
ON CONFLICT (code) DO NOTHING;
