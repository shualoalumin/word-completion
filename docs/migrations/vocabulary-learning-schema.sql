-- ============================================================================
-- 어휘력 향상 능동적 학습 시스템 스키마 마이그레이션
-- 생성일: 2026-01-11
-- 목적: user_vocabulary 테이블 확장 및 관련 테이블 생성
-- ============================================================================

-- 1. user_vocabulary 테이블 확장
ALTER TABLE user_vocabulary
  ADD COLUMN IF NOT EXISTS source_context TEXT,                  -- 원문 문장 (맥락 보존)
  ADD COLUMN IF NOT EXISTS source_passage_id UUID REFERENCES exercises(id),  -- 출처 지문 ID
  ADD COLUMN IF NOT EXISTS added_from TEXT DEFAULT 'manual',     -- 'manual', 'auto_extract', 'mistake_priority'
  ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0,           -- 복습 횟수
  ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMPTZ,         -- 마지막 복습 시각
  ADD COLUMN IF NOT EXISTS retention_score DECIMAL,              -- 기억 유지 점수 (0~1)
  ADD COLUMN IF NOT EXISTS difficulty_score DECIMAL,             -- 난이도 점수 (0~1)
  ADD COLUMN IF NOT EXISTS first_encountered_at TIMESTAMPTZ,     -- 최초 학습 시각
  ADD COLUMN IF NOT EXISTS synonyms TEXT[],                      -- 동의어 배열
  ADD COLUMN IF NOT EXISTS antonyms TEXT[];                      -- 반의어 배열 (프리미엄)

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_vocab_source ON user_vocabulary (source_passage_id);
CREATE INDEX IF NOT EXISTS idx_vocab_review ON user_vocabulary (user_id, next_review_at) 
  WHERE next_review_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vocab_mastery ON user_vocabulary (user_id, mastery_level);

-- 2. 단어 복습 테스트 기록 테이블
CREATE TABLE IF NOT EXISTS user_vocabulary_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vocabulary_id UUID REFERENCES user_vocabulary(id) ON DELETE CASCADE,
  
  -- 복습 테스트 유형
  review_type TEXT NOT NULL,                 -- 'flashcard', 'fill_blank', 'multiple_choice', 'context_matching', 'sentence_completion'
  
  -- 결과
  is_correct BOOLEAN NOT NULL,
  response_time_seconds INT,                 -- 응답 시간 (초)
  confidence_level INT,                      -- 자신감 레벨 (1~5)
  user_answer TEXT,                          -- 사용자가 입력한 답
  correct_answer TEXT,                       -- 정답
  
  -- SM-2 알고리즘 업데이트
  ease_factor_before DECIMAL,
  ease_factor_after DECIMAL,
  interval_days_before INT,
  interval_days_after INT,
  mastery_level_before INT,
  mastery_level_after INT,
  
  -- 맥락 정보
  review_context JSONB,                      -- 복습 시 사용된 문맥 정보
  
  reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vocab_reviews_user ON user_vocabulary_reviews (user_id, reviewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_vocab_reviews_vocab ON user_vocabulary_reviews (vocabulary_id);
CREATE INDEX IF NOT EXISTS idx_vocab_reviews_type ON user_vocabulary_reviews (review_type);

-- 3. 어휘력 향상 메트릭 테이블 (주간/월간 집계)
CREATE TABLE IF NOT EXISTS user_vocabulary_metrics (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  
  -- 단어 학습 지표
  new_words_learned INT DEFAULT 0,           -- 새로 학습한 단어 수
  words_mastered INT DEFAULT 0,              -- mastery_level >= 4 (마스터한 단어)
  total_vocabulary_size INT DEFAULT 0,       -- 현재 단어장 크기 (누적)
  
  -- 복습 효율성
  reviews_completed INT DEFAULT 0,           -- 완료한 복습 수
  review_accuracy DECIMAL,                   -- 복습 정답률 (0~1)
  avg_retention_score DECIMAL,               -- 평균 기억 유지 점수 (0~1)
  avg_response_time_seconds DECIMAL,         -- 평균 응답 시간
  
  -- 맥락 기반 학습 효과
  context_based_words INT DEFAULT 0,         -- 맥락에서 학습한 단어 수
  context_retention_rate DECIMAL,            -- 맥락 기반 단어 기억률 (0~1)
  context_vs_isolated_ratio DECIMAL,         -- 맥락 학습 비율
  
  -- 성장 추이
  vocabulary_growth_rate DECIMAL,            -- 단어 수 증가율 (%)
  mastery_improvement_rate DECIMAL,          -- 마스터리 상승률 (%)
  retention_improvement_rate DECIMAL,        -- 기억 유지율 개선률 (%)
  
  -- 학습 패턴
  avg_study_sessions_per_week DECIMAL,       -- 주간 평균 학습 세션 수
  most_productive_time_of_day INT,           -- 가장 효율적인 시간대 (0~23)
  
  PRIMARY KEY (user_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_vocab_metrics_user ON user_vocabulary_metrics (user_id, period_start DESC);

-- 4. 어휘력 향상 비교 지표 테이블
CREATE TABLE IF NOT EXISTS user_vocabulary_growth (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  measurement_date DATE NOT NULL,
  
  -- 절대 지표
  total_words INT NOT NULL,                  -- 총 학습 단어 수
  mastered_words INT DEFAULT 0,              -- 마스터한 단어 수 (mastery_level >= 4)
  active_review_words INT DEFAULT 0,         -- 복습 대기 중인 단어 수
  forgotten_words INT DEFAULT 0,             -- 잊어버린 단어 수 (retention_score < 0.3)
  
  -- 성장 지표
  words_learned_this_month INT DEFAULT 0,    -- 이번 달 학습한 단어
  words_mastered_this_month INT DEFAULT 0,   -- 이번 달 마스터한 단어
  growth_rate DECIMAL,                       -- 성장률 (%)
  
  -- 상대 지표 (비교용, 익명화)
  percentile_rank DECIMAL,                   -- 동급 사용자 대비 백분위 (0~100)
  cohort_avg_words DECIMAL,                  -- 비슷한 수준 사용자 평균 단어 수
  growth_rate_vs_avg DECIMAL,                -- 평균 대비 성장 속도 (%)
  
  -- CEFR 레벨 추정
  estimated_vocab_level TEXT,                -- 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'
  estimated_toefl_vocab_score INT,           -- TOEFL 어휘 점수 추정 (0-30)
  estimated_toefl_total_score INT,           -- TOEFL 총점 추정 (0-120, Reading 기준)
  
  -- 학습 효율성
  avg_time_to_mastery_days DECIMAL,          -- 마스터리까지 평균 소요 일수
  retention_rate DECIMAL,                    -- 기억 유지율 (0~1)
  
  PRIMARY KEY (user_id, measurement_date)
);

CREATE INDEX IF NOT EXISTS idx_vocab_growth_user ON user_vocabulary_growth (user_id, measurement_date DESC);
CREATE INDEX IF NOT EXISTS idx_vocab_growth_level ON user_vocabulary_growth (estimated_vocab_level);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE user_vocabulary_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_vocabulary_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_vocabulary_growth ENABLE ROW LEVEL SECURITY;

-- user_vocabulary_reviews: 본인 기록만 조회/수정 가능
CREATE POLICY "Users can view own vocabulary reviews"
  ON user_vocabulary_reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vocabulary reviews"
  ON user_vocabulary_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- user_vocabulary_metrics: 본인 통계만 조회 가능
CREATE POLICY "Users can view own vocabulary metrics"
  ON user_vocabulary_metrics FOR SELECT
  USING (auth.uid() = user_id);

-- user_vocabulary_growth: 본인 성장 지표만 조회 가능
CREATE POLICY "Users can view own vocabulary growth"
  ON user_vocabulary_growth FOR SELECT
  USING (auth.uid() = user_id);

-- 기존 user_vocabulary 테이블 RLS 정책 업데이트 (이미 있을 수 있음)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_vocabulary' 
    AND policyname = 'Users can view own vocabulary'
  ) THEN
    ALTER TABLE user_vocabulary ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view own vocabulary"
      ON user_vocabulary FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert own vocabulary"
      ON user_vocabulary FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update own vocabulary"
      ON user_vocabulary FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;
