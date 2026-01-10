-- ============================================================================
-- 학습 패턴 및 소셜 기능 스키마 마이그레이션
-- 생성일: 2026-01-11
-- 목적: 학습 패턴 분석, 소셜 기능, 비교 통계 테이블 생성
-- ============================================================================

-- ============================================================================
-- 1. 학습 패턴 및 통계 테이블
-- ============================================================================

-- 1.1 시간대별 학습 패턴
CREATE TABLE IF NOT EXISTS user_learning_patterns (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  hour_of_day INT CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
  day_of_week INT CHECK (day_of_week >= 0 AND day_of_week <= 6),  -- 0=월요일, 6=일요일
  avg_score_percent DECIMAL,
  avg_time_spent_seconds INT,
  exercises_count INT DEFAULT 0,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, hour_of_day, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_patterns_user ON user_learning_patterns (user_id);

-- 1.2 주제별 성과 추적
CREATE TABLE IF NOT EXISTS user_topic_performance (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_category TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  exercises_completed INT DEFAULT 0,
  avg_score_percent DECIMAL,
  total_time_spent_seconds INT DEFAULT 0,
  last_practiced_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, topic_category, difficulty)
);

CREATE INDEX IF NOT EXISTS idx_topic_user ON user_topic_performance (user_id);

-- 1.3 성장 메트릭 (주간/월간 집계)
CREATE TABLE IF NOT EXISTS user_growth_metrics (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly')),
  period_start DATE NOT NULL,
  avg_score_percent DECIMAL,
  exercises_completed INT DEFAULT 0,
  vocabulary_words_learned INT DEFAULT 0,
  streak_days INT DEFAULT 0,
  improvement_rate DECIMAL,                  -- 점수 상승률 (%)
  PRIMARY KEY (user_id, period_type, period_start)
);

CREATE INDEX IF NOT EXISTS idx_growth_user ON user_growth_metrics (user_id, period_start DESC);

-- ============================================================================
-- 2. 소셜 기능 테이블
-- ============================================================================

-- 2.1 현재 학습 상태 추적 (친구/소셜 기능)
CREATE TABLE IF NOT EXISTS user_active_sessions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 현재 활동
  is_active BOOLEAN DEFAULT false,          -- 현재 학습 중인지
  current_activity TEXT,                    -- 'reading', 'vocabulary_review', 'idle', 'writing', 'listening'
  current_exercise_id UUID REFERENCES exercises(id),  -- 현재 풀고 있는 문제 ID
  
  -- 세션 정보
  session_started_at TIMESTAMPTZ,           -- 현재 세션 시작 시각
  last_active_at TIMESTAMPTZ,               -- 마지막 활동 시각
  total_session_time_seconds INT DEFAULT 0, -- 총 세션 시간 (초)
  
  -- 상태 메시지 (선택적)
  status_message TEXT,                      -- 사용자 설정 상태 메시지 ("열심히 공부 중!" 등)
  
  -- 프라이버시 설정
  show_active_status BOOLEAN DEFAULT true,  -- 친구들에게 상태 표시 여부
  visible_to_friends_only BOOLEAN DEFAULT true,  -- 친구에게만 표시 (기본값)
  show_current_exercise BOOLEAN DEFAULT false,    -- 현재 풀고 있는 문제 표시 여부
  
  -- 업데이트 추적
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_active_sessions_last_active ON user_active_sessions (last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_active_sessions_active ON user_active_sessions (is_active, last_active_at DESC) 
  WHERE is_active = true;

-- 2.2 study_groups 테이블 확장
ALTER TABLE study_groups
  ADD COLUMN IF NOT EXISTS show_member_status BOOLEAN DEFAULT true,  -- 멤버 상태 표시
  ADD COLUMN IF NOT EXISTS group_goal TEXT,                          -- 그룹 목표 설명
  ADD COLUMN IF NOT EXISTS weekly_target INT DEFAULT 10,             -- 주간 목표 문제 수
  ADD COLUMN IF NOT EXISTS current_week_start DATE DEFAULT CURRENT_DATE,  -- 현재 주 시작일
  ADD COLUMN IF NOT EXISTS description TEXT;                         -- 그룹 설명

-- 2.3 스터디 그룹 활동 기록
CREATE TABLE IF NOT EXISTS study_group_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 활동 타입
  activity_type TEXT NOT NULL,              -- 'completed_exercise', 'achieved_streak', 'mastered_words', 'joined_group', 'challenge_completed'
  
  -- 활동 데이터 (JSONB로 유연하게 저장)
  activity_data JSONB,                      -- {
                                            --   "exercise_id": "...",
                                            --   "score": 85,
                                            --   "streak_days": 7,
                                            --   "words_mastered": 10,
                                            --   "challenge_id": "..."
                                            -- }
  
  -- 표시 설정
  is_public BOOLEAN DEFAULT true,           -- 그룹 멤버에게만 표시
  is_highlighted BOOLEAN DEFAULT false,     -- 하이라이트 표시 (업적 등)
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_activities_group ON study_group_activities (group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_activities_user ON study_group_activities (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_activities_type ON study_group_activities (activity_type);

-- 2.4 그룹 주간 통계 (집계용)
CREATE TABLE IF NOT EXISTS study_group_weekly_stats (
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 주간 활동 통계
  exercises_completed INT DEFAULT 0,        -- 완료한 문제 수
  total_score INT DEFAULT 0,                -- 총 점수
  streak_days INT DEFAULT 0,                -- 연속 학습 일수
  words_mastered INT DEFAULT 0,             -- 마스터한 단어 수
  time_spent_seconds INT DEFAULT 0,         -- 총 학습 시간 (초)
  
  -- 순위
  rank_in_group INT,                        -- 그룹 내 순위
  
  PRIMARY KEY (group_id, week_start, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_weekly_stats ON study_group_weekly_stats (group_id, week_start, rank_in_group);

-- ============================================================================
-- 3. 비교 통계 테이블
-- ============================================================================

-- 3.1 익명화된 코호트 통계 (비교용)
CREATE TABLE IF NOT EXISTS cohort_statistics (
  cohort_type TEXT NOT NULL,                -- 'similar_skill', 'same_target_score', 'same_level'
  cohort_key TEXT,                          -- 'B2', 'target_100', 'vocabulary_200'
  metric_name TEXT NOT NULL,                -- 'avg_score', 'avg_exercises', 'avg_words'
  metric_value DECIMAL NOT NULL,
  sample_size INT NOT NULL,                 -- 표본 크기
  period_start DATE NOT NULL,
  period_end DATE,                          -- NULL이면 현재까지
  
  PRIMARY KEY (cohort_type, cohort_key, metric_name, period_start)
);

CREATE INDEX IF NOT EXISTS idx_cohort_stats ON cohort_statistics (cohort_type, cohort_key, period_start DESC);

-- 3.2 사용자 코호트 배정 (동의 기반 비교)
CREATE TABLE IF NOT EXISTS user_cohorts (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cohort_id TEXT NOT NULL,                  -- 'target_100_2024_q1', 'level_b2_2024'
  cohort_type TEXT NOT NULL,                -- 'target_score', 'starting_level', 'similar_skill'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  consent_given BOOLEAN DEFAULT true,       -- 비교 참여 동의
  
  PRIMARY KEY (user_id, cohort_id)
);

CREATE INDEX IF NOT EXISTS idx_user_cohorts ON user_cohorts (cohort_id, user_id);

-- 3.3 코호트별 집계 통계
CREATE TABLE IF NOT EXISTS cohort_aggregates (
  cohort_id TEXT NOT NULL,
  metric_date DATE NOT NULL,
  
  -- 통계 지표
  avg_score_percent DECIMAL,
  avg_exercises_completed INT,
  avg_words_learned INT,
  avg_streak_days INT,
  median_score_percent DECIMAL,
  
  -- 성장 지표
  avg_growth_rate DECIMAL,
  top_quartile_score DECIMAL,               -- 상위 25% 점수
  bottom_quartile_score DECIMAL,            -- 하위 25% 점수
  
  -- 표본 크기
  active_users_count INT,                   -- 활성 사용자 수
  total_users_count INT,                    -- 총 사용자 수
  
  PRIMARY KEY (cohort_id, metric_date)
);

CREATE INDEX IF NOT EXISTS idx_cohort_aggregates ON cohort_aggregates (cohort_id, metric_date DESC);

-- ============================================================================
-- 4. AI 학습 방향성 추천 (프리미엄 기능)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_learning_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 추천 타입
  recommendation_type TEXT NOT NULL,        -- 'weak_topic', 'vocabulary_gap', 'skill_improvement', 'time_optimization'
  priority INT NOT NULL,                    -- 1~5 (높을수록 우선)
  
  -- 추천 내용
  target_skill TEXT,                        -- 'vocabulary', 'grammar', 'reading_comprehension'
  target_topic TEXT,                        -- 'Science', 'History'
  recommended_difficulty TEXT,              -- 'easy', 'intermediate', 'hard'
  recommended_exercises UUID[],             -- 추천 문제 ID 배열
  
  -- 근거 (AI 분석 결과)
  reasoning JSONB,                          -- {
                                            --   "weakness": "History 주제에서 60% 정답률",
                                            --   "comparison": "비슷한 수준 사용자 평균 75%",
                                            --   "impact": "개선 시 예상 점수 +5점"
                                            -- }
  
  -- 예상 효과
  expected_improvement DECIMAL,             -- 예상 점수 향상 (%)
  estimated_time_hours DECIMAL,             -- 예상 소요 시간
  confidence_score DECIMAL,                 -- AI 신뢰도 (0~1)
  
  -- 상태
  status TEXT DEFAULT 'pending',            -- 'pending', 'in_progress', 'completed', 'dismissed'
  user_feedback TEXT,                       -- 사용자 피드백
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recommendations_user ON user_learning_recommendations (user_id, priority DESC, status);
CREATE INDEX IF NOT EXISTS idx_recommendations_type ON user_learning_recommendations (recommendation_type);

-- ============================================================================
-- 5. RLS (Row Level Security) 정책 설정
-- ============================================================================

-- 학습 패턴 테이블
ALTER TABLE user_learning_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_topic_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_growth_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own learning patterns"
  ON user_learning_patterns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own topic performance"
  ON user_topic_performance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own growth metrics"
  ON user_growth_metrics FOR SELECT
  USING (auth.uid() = user_id);

-- 소셜 기능 테이블
ALTER TABLE user_active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_weekly_stats ENABLE ROW LEVEL SECURITY;

-- user_active_sessions: 본인은 수정 가능, 친구는 조회만 (visible_to_friends_only 조건)
CREATE POLICY "Users can view own active session"
  ON user_active_sessions FOR SELECT
  USING (auth.uid() = user_id OR (
    visible_to_friends_only = true 
    AND show_active_status = true
    AND EXISTS (
      SELECT 1 FROM user_follows 
      WHERE follower_id = auth.uid() 
      AND following_id = user_id
    )
  ));

CREATE POLICY "Users can update own active session"
  ON user_active_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own active session"
  ON user_active_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- study_group_activities: 그룹 멤버는 조회 가능
CREATE POLICY "Group members can view group activities"
  ON study_group_activities FOR SELECT
  USING (
    is_public = true
    AND EXISTS (
      SELECT 1 FROM study_group_members
      WHERE group_id = study_group_activities.group_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own group activities"
  ON study_group_activities FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM study_group_members
      WHERE group_id = study_group_activities.group_id
      AND user_id = auth.uid()
    )
  );

-- study_group_weekly_stats: 그룹 멤버는 조회 가능, 본인은 수정 가능
CREATE POLICY "Group members can view group stats"
  ON study_group_weekly_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM study_group_members
      WHERE group_id = study_group_weekly_stats.group_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own group stats"
  ON study_group_weekly_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- 비교 통계 테이블 (읽기 전용, 관리자만 수정)
ALTER TABLE cohort_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_aggregates ENABLE ROW LEVEL SECURITY;

-- cohort_statistics: 모든 인증된 사용자 조회 가능 (익명화된 데이터)
CREATE POLICY "Authenticated users can view cohort statistics"
  ON cohort_statistics FOR SELECT
  TO authenticated
  USING (true);

-- user_cohorts: 본인 코호트 정보만 조회/수정
CREATE POLICY "Users can view own cohorts"
  ON user_cohorts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own cohorts"
  ON user_cohorts FOR UPDATE
  USING (auth.uid() = user_id);

-- cohort_aggregates: 모든 인증된 사용자 조회 가능 (익명화된 집계 데이터)
CREATE POLICY "Authenticated users can view cohort aggregates"
  ON cohort_aggregates FOR SELECT
  TO authenticated
  USING (true);

-- AI 학습 추천 테이블
ALTER TABLE user_learning_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recommendations"
  ON user_learning_recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendations"
  ON user_learning_recommendations FOR UPDATE
  USING (auth.uid() = user_id);
