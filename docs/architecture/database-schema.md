# 📊 Global-Ready Database Schema Blueprint

> **원칙**: 처음부터 확장성 있게 설계. 나중에 마이그레이션은 고통이다.
> 
> **Last Updated**: 2025-12-30

---

## 📋 Table of Contents

1. [콘텐츠 (Content)](#1-콘텐츠-content)
2. [유저 (Users)](#2-유저-users)
3. [학습 기록 (Learning)](#3-학습-기록-learning)
4. [게이미피케이션 (Gamification)](#4-게이미피케이션-gamification)
5. [소셜 (Social)](#5-소셜-social)
6. [결제/구독 (Payments)](#6-결제구독-payments)
7. [추천/프로모션 (Referrals)](#7-추천프로모션-referrals)
8. [분석/실험 (Analytics)](#8-분석실험-analytics)
9. [규정 준수 (Compliance)](#9-규정-준수-compliance)
10. [알림 (Notifications)](#10-알림-notifications)
11. [지원 (Support)](#11-지원-support)

---

## 1. 콘텐츠 (Content)

### exercises
> 모든 섹션(Reading/Writing/Listening/Speaking)의 문제를 통합 저장

```sql
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL,              -- 'reading', 'writing', 'listening', 'speaking'
  exercise_type TEXT NOT NULL,        -- 'text-completion', 'build-sentence', 'dictation'
  topic TEXT NOT NULL,
  topic_category TEXT,                -- 'Science', 'Arts', 'Social Science'
  difficulty TEXT DEFAULT 'intermediate', -- 'easy', 'intermediate', 'hard'
  content JSONB NOT NULL,             -- 유형별로 다른 구조 저장
  metadata JSONB,                     -- word_count, duration 등 추가 정보
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exercises_active ON exercises (section, exercise_type, is_active);
CREATE INDEX idx_exercises_difficulty ON exercises (difficulty);
CREATE INDEX idx_exercises_topic ON exercises (topic_category);
```

### media_files
> Listening/Speaking 섹션용 오디오/이미지 파일

```sql
CREATE TABLE media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  file_type TEXT,                     -- 'audio', 'image'
  storage_path TEXT NOT NULL,         -- Supabase Storage 경로
  duration_seconds INT,               -- 오디오 길이
  transcript TEXT,                    -- 자막/스크립트
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### topic_taxonomy
> 토픽 분류 체계 (계층 구조)

```sql
CREATE TABLE topic_taxonomy (
  id TEXT PRIMARY KEY,                -- 'science.biology.ecology'
  parent_id TEXT REFERENCES topic_taxonomy(id),
  name TEXT NOT NULL,
  name_ko TEXT,                       -- 다국어 지원
  name_zh TEXT,
  name_ja TEXT,
  level INT,                          -- 1=대분류, 2=중분류, 3=소분류
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### skill_taxonomy
> 스킬 분류 체계

```sql
CREATE TABLE skill_taxonomy (
  id TEXT PRIMARY KEY,                -- 'reading.vocabulary.context_clues'
  parent_id TEXT REFERENCES skill_taxonomy(id),
  name TEXT NOT NULL,
  section TEXT,                       -- 'reading', 'writing'...
  description TEXT
);
```

### content_reviews
> AI 생성 콘텐츠 품질 검증

```sql
CREATE TABLE content_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  reviewer_type TEXT,                 -- 'auto', 'admin', 'user_report'
  status TEXT DEFAULT 'pending',      -- 'pending', 'approved', 'rejected'
  issues JSONB,                       -- [{type: 'inappropriate', detail: '...'}]
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ
);
```

### user_reports
> 유저 신고 시스템

```sql
CREATE TABLE user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  exercise_id UUID REFERENCES exercises(id),
  reason TEXT,                        -- 'inappropriate', 'incorrect', 'offensive'
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 2. 유저 (Users)

### user_profiles
> 유저 프로필 및 설정

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  locale TEXT DEFAULT 'en',           -- 🌍 UI 언어 (en, ko, zh, ja)
  timezone TEXT DEFAULT 'UTC',        -- 🌍 시간대
  subscription_tier TEXT DEFAULT 'free', -- 'free', 'premium', 'enterprise'
  subscription_expires_at TIMESTAMPTZ,
  daily_goal INT DEFAULT 5,           -- 하루 목표 문제 수
  preferred_difficulty TEXT,          -- 선호 난이도
  preferred_topics TEXT[],            -- 선호 토픽
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### user_sessions
> 세션 및 디바이스 관리

```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT,
  device_name TEXT,                   -- "iPhone 15 Pro"
  platform TEXT,                      -- 'ios', 'android', 'web'
  app_version TEXT,
  ip_address TEXT,
  country_code TEXT,                  -- 'KR', 'US'
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON user_sessions (user_id);
```

### user_skills
> 스킬별 숙련도 추적

```sql
CREATE TABLE user_skills (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_type TEXT,                    -- 'vocabulary', 'grammar', 'inference'
  proficiency_score DECIMAL,          -- 0.0 ~ 1.0
  exercises_completed INT DEFAULT 0,
  correct_rate DECIMAL,               -- 정답률
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, skill_type)
);
```

### user_usage_limits
> 사용량 제한 (Rate Limiting)

```sql
CREATE TABLE user_usage_limits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_exercises_used INT DEFAULT 0,
  daily_exercises_limit INT DEFAULT 10,   -- 무료=10, 프리미엄=무제한
  daily_ai_generations_used INT DEFAULT 0,
  monthly_ai_generations_used INT DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE
);
```

---

## 3. 학습 기록 (Learning)

### user_exercise_history
> 문제 풀이 기록

```sql
CREATE TABLE user_exercise_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  
  -- 결과
  score INT,                          -- 맞춘 개수
  max_score INT,                      -- 최대 점수
  score_percent DECIMAL,              -- 백분율
  time_spent_seconds INT,             -- 소요 시간
  
  -- 상세 데이터 (오답노트용)
  answers JSONB,                      -- 유저가 입력한 답
  mistakes JSONB,                     -- [{blank_id, user_answer, correct_answer}]
  
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, exercise_id)        -- 같은 문제 중복 방지
);

CREATE INDEX idx_history_user ON user_exercise_history (user_id);
CREATE INDEX idx_history_date ON user_exercise_history (completed_at);
```

### user_review_queue
> 복습 스케줄 (Spaced Repetition - SM-2 알고리즘)

```sql
CREATE TABLE user_review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  next_review_at TIMESTAMPTZ,         -- 다음 복습 시점
  interval_days INT DEFAULT 1,        -- 현재 간격
  ease_factor DECIMAL DEFAULT 2.5,    -- SM-2 알고리즘용
  review_count INT DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ
);

CREATE INDEX idx_review_next ON user_review_queue (user_id, next_review_at);
```

### user_bookmarks
> 북마크 (저장한 문제)

```sql
CREATE TABLE user_bookmarks (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  note TEXT,                          -- 개인 메모
  folder TEXT DEFAULT 'default',      -- 폴더 분류
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, exercise_id)
);
```

### user_vocabulary
> 개인 단어장 (능동적 학습 시스템)

```sql
CREATE TABLE user_vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  definition TEXT,
  example_sentence TEXT,
  source_exercise_id UUID REFERENCES exercises(id),
  source_context TEXT,                  -- 원문 문장 (맥락 보존)
  source_passage_id UUID REFERENCES exercises(id),  -- 출처 지문 ID
  added_from TEXT DEFAULT 'manual',     -- 'manual', 'auto_extract', 'mistake_priority'
  mastery_level INT DEFAULT 0,        -- 0~5 (복습할수록 증가)
  review_count INT DEFAULT 0,           -- 복습 횟수
  last_reviewed_at TIMESTAMPTZ,         -- 마지막 복습 시각
  next_review_at TIMESTAMPTZ,           -- 다음 복습 시각
  retention_score DECIMAL,              -- 기억 유지 점수 (0~1)
  difficulty_score DECIMAL,             -- 난이도 점수 (0~1)
  first_encountered_at TIMESTAMPTZ,     -- 최초 학습 시각
  synonyms TEXT[],                      -- 동의어 배열
  antonyms TEXT[],                      -- 반의어 배열 (프리미엄)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vocabulary_user ON user_vocabulary (user_id);
CREATE INDEX idx_vocab_source ON user_vocabulary (source_passage_id);
CREATE INDEX idx_vocab_review ON user_vocabulary (user_id, next_review_at) 
  WHERE next_review_at IS NOT NULL;
CREATE INDEX idx_vocab_mastery ON user_vocabulary (user_id, mastery_level);
```

### user_vocabulary_reviews
> 단어 복습 테스트 기록

```sql
CREATE TABLE user_vocabulary_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vocabulary_id UUID REFERENCES user_vocabulary(id) ON DELETE CASCADE,
  review_type TEXT NOT NULL,            -- 'flashcard', 'fill_blank', 'multiple_choice', 'context_matching', 'sentence_completion'
  is_correct BOOLEAN NOT NULL,
  response_time_seconds INT,
  confidence_level INT,                  -- 자신감 레벨 (1~5)
  user_answer TEXT,
  correct_answer TEXT,
  ease_factor_before DECIMAL,
  ease_factor_after DECIMAL,
  interval_days_before INT,
  interval_days_after INT,
  mastery_level_before INT,
  mastery_level_after INT,
  review_context JSONB,
  reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vocab_reviews_user ON user_vocabulary_reviews (user_id, reviewed_at DESC);
CREATE INDEX idx_vocab_reviews_vocab ON user_vocabulary_reviews (vocabulary_id);
CREATE INDEX idx_vocab_reviews_type ON user_vocabulary_reviews (review_type);
```

### user_vocabulary_metrics
> 어휘력 향상 메트릭 (주간/월간 집계)

```sql
CREATE TABLE user_vocabulary_metrics (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  new_words_learned INT DEFAULT 0,
  words_mastered INT DEFAULT 0,
  total_vocabulary_size INT DEFAULT 0,
  reviews_completed INT DEFAULT 0,
  review_accuracy DECIMAL,
  avg_retention_score DECIMAL,
  avg_response_time_seconds DECIMAL,
  context_based_words INT DEFAULT 0,
  context_retention_rate DECIMAL,
  context_vs_isolated_ratio DECIMAL,
  vocabulary_growth_rate DECIMAL,
  mastery_improvement_rate DECIMAL,
  retention_improvement_rate DECIMAL,
  avg_study_sessions_per_week DECIMAL,
  most_productive_time_of_day INT,
  PRIMARY KEY (user_id, period_start)
);

CREATE INDEX idx_vocab_metrics_user ON user_vocabulary_metrics (user_id, period_start DESC);
```

### user_vocabulary_growth
> 어휘력 향상 비교 지표

```sql
CREATE TABLE user_vocabulary_growth (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  measurement_date DATE NOT NULL,
  total_words INT NOT NULL,
  mastered_words INT DEFAULT 0,
  active_review_words INT DEFAULT 0,
  forgotten_words INT DEFAULT 0,
  words_learned_this_month INT DEFAULT 0,
  words_mastered_this_month INT DEFAULT 0,
  growth_rate DECIMAL,
  percentile_rank DECIMAL,
  cohort_avg_words DECIMAL,
  growth_rate_vs_avg DECIMAL,
  estimated_vocab_level TEXT,           -- 'A1' ~ 'C2'
  estimated_toefl_vocab_score INT,      -- 0-30
  estimated_toefl_total_score INT,      -- 0-120
  avg_time_to_mastery_days DECIMAL,
  retention_rate DECIMAL,
  PRIMARY KEY (user_id, measurement_date)
);

CREATE INDEX idx_vocab_growth_user ON user_vocabulary_growth (user_id, measurement_date DESC);
CREATE INDEX idx_vocab_growth_level ON user_vocabulary_growth (estimated_vocab_level);
```

### diagnostic_results
> 진단 테스트 결과

```sql
CREATE TABLE diagnostic_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  test_type TEXT,                     -- 'initial', 'periodic', 'section'
  overall_score INT,
  section_scores JSONB,               -- {reading: 85, writing: 72, ...}
  skill_scores JSONB,                 -- {vocabulary: 80, grammar: 75, ...}
  recommended_level TEXT,             -- CEFR 레벨 ('A1' ~ 'C2')
  estimated_toefl_score INT,          -- 예상 TOEFL 점수 (0-120)
  taken_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3.5. 학습 패턴 및 통계 (Learning Patterns & Analytics)

### user_learning_patterns
> 시간대별 학습 패턴 분석

```sql
CREATE TABLE user_learning_patterns (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  hour_of_day INT CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
  day_of_week INT CHECK (day_of_week >= 0 AND day_of_week <= 6),  -- 0=월요일
  avg_score_percent DECIMAL,
  avg_time_spent_seconds INT,
  exercises_count INT DEFAULT 0,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, hour_of_day, day_of_week)
);

CREATE INDEX idx_patterns_user ON user_learning_patterns (user_id);
```

### user_topic_performance
> 주제별 성과 추적

```sql
CREATE TABLE user_topic_performance (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_category TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  exercises_completed INT DEFAULT 0,
  avg_score_percent DECIMAL,
  total_time_spent_seconds INT DEFAULT 0,
  last_practiced_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, topic_category, difficulty)
);

CREATE INDEX idx_topic_user ON user_topic_performance (user_id);
```

### user_growth_metrics
> 성장 메트릭 (주간/월간 집계)

```sql
CREATE TABLE user_growth_metrics (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly')),
  period_start DATE NOT NULL,
  avg_score_percent DECIMAL,
  exercises_completed INT DEFAULT 0,
  vocabulary_words_learned INT DEFAULT 0,
  streak_days INT DEFAULT 0,
  improvement_rate DECIMAL,
  PRIMARY KEY (user_id, period_type, period_start)
);

CREATE INDEX idx_growth_user ON user_growth_metrics (user_id, period_start DESC);
```

---

## 3.6. 소셜 및 비교 통계 (Social & Comparative Analytics)

### user_active_sessions
> 현재 학습 상태 추적 (친구/소셜 기능)

```sql
CREATE TABLE user_active_sessions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT false,
  current_activity TEXT,                -- 'reading', 'vocabulary_review', 'idle'
  current_exercise_id UUID REFERENCES exercises(id),
  session_started_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  total_session_time_seconds INT DEFAULT 0,
  status_message TEXT,
  show_active_status BOOLEAN DEFAULT true,
  visible_to_friends_only BOOLEAN DEFAULT true,
  show_current_exercise BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_active_sessions_last_active ON user_active_sessions (last_active_at DESC);
CREATE INDEX idx_active_sessions_active ON user_active_sessions (is_active, last_active_at DESC) 
  WHERE is_active = true;
```

### study_group_activities
> 스터디 그룹 활동 기록

```sql
CREATE TABLE study_group_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,          -- 'completed_exercise', 'achieved_streak', 'mastered_words', 'joined_group'
  activity_data JSONB,
  is_public BOOLEAN DEFAULT true,
  is_highlighted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_group_activities_group ON study_group_activities (group_id, created_at DESC);
CREATE INDEX idx_group_activities_user ON study_group_activities (user_id, created_at DESC);
CREATE INDEX idx_group_activities_type ON study_group_activities (activity_type);
```

### study_group_weekly_stats
> 그룹 주간 통계

```sql
CREATE TABLE study_group_weekly_stats (
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exercises_completed INT DEFAULT 0,
  total_score INT DEFAULT 0,
  streak_days INT DEFAULT 0,
  words_mastered INT DEFAULT 0,
  time_spent_seconds INT DEFAULT 0,
  rank_in_group INT,
  PRIMARY KEY (group_id, week_start, user_id)
);

CREATE INDEX idx_group_weekly_stats ON study_group_weekly_stats (group_id, week_start, rank_in_group);
```

### cohort_statistics
> 익명화된 코호트 통계 (비교용)

```sql
CREATE TABLE cohort_statistics (
  cohort_type TEXT NOT NULL,            -- 'similar_skill', 'same_target_score', 'same_level'
  cohort_key TEXT,                      -- 'B2', 'target_100', 'vocabulary_200'
  metric_name TEXT NOT NULL,            -- 'avg_score', 'avg_exercises', 'avg_words'
  metric_value DECIMAL NOT NULL,
  sample_size INT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE,
  PRIMARY KEY (cohort_type, cohort_key, metric_name, period_start)
);

CREATE INDEX idx_cohort_stats ON cohort_statistics (cohort_type, cohort_key, period_start DESC);
```

### user_cohorts
> 사용자 코호트 배정 (동의 기반 비교)

```sql
CREATE TABLE user_cohorts (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cohort_id TEXT NOT NULL,
  cohort_type TEXT NOT NULL,            -- 'target_score', 'starting_level', 'similar_skill'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  consent_given BOOLEAN DEFAULT true,
  PRIMARY KEY (user_id, cohort_id)
);

CREATE INDEX idx_user_cohorts ON user_cohorts (cohort_id, user_id);
```

### cohort_aggregates
> 코호트별 집계 통계

```sql
CREATE TABLE cohort_aggregates (
  cohort_id TEXT NOT NULL,
  metric_date DATE NOT NULL,
  avg_score_percent DECIMAL,
  avg_exercises_completed INT,
  avg_words_learned INT,
  avg_streak_days INT,
  median_score_percent DECIMAL,
  avg_growth_rate DECIMAL,
  top_quartile_score DECIMAL,
  bottom_quartile_score DECIMAL,
  active_users_count INT,
  total_users_count INT,
  PRIMARY KEY (cohort_id, metric_date)
);

CREATE INDEX idx_cohort_aggregates ON cohort_aggregates (cohort_id, metric_date DESC);
```

### user_learning_recommendations
> AI 학습 방향성 추천 (프리미엄)

```sql
CREATE TABLE user_learning_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL,    -- 'weak_topic', 'vocabulary_gap', 'skill_improvement', 'time_optimization'
  priority INT NOT NULL,                -- 1~5
  target_skill TEXT,
  target_topic TEXT,
  recommended_difficulty TEXT,
  recommended_exercises UUID[],
  reasoning JSONB,
  expected_improvement DECIMAL,
  estimated_time_hours DECIMAL,
  confidence_score DECIMAL,
  status TEXT DEFAULT 'pending',        -- 'pending', 'in_progress', 'completed', 'dismissed'
  user_feedback TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recommendations_user ON user_learning_recommendations (user_id, priority DESC, status);
CREATE INDEX idx_recommendations_type ON user_learning_recommendations (recommendation_type);
```

---

## 4. 게이미피케이션 (Gamification)

### user_streaks
> 연속 학습 스트릭

```sql
CREATE TABLE user_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_activity_date DATE,
  streak_freeze_count INT DEFAULT 0,  -- 스트릭 보호권
  total_days_active INT DEFAULT 0
);
```

### achievements
> 업적 정의

```sql
CREATE TABLE achievements (
  id TEXT PRIMARY KEY,                -- 'first_perfect', 'streak_7', 'master_science'
  name TEXT NOT NULL,
  name_ko TEXT,
  description TEXT,
  description_ko TEXT,
  icon_url TEXT,
  category TEXT,                      -- 'streak', 'score', 'mastery', 'social'
  condition JSONB,                    -- 달성 조건 정의
  xp_reward INT DEFAULT 0,
  is_hidden BOOLEAN DEFAULT false,    -- 히든 업적
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### user_achievements
> 유저별 업적 달성

```sql
CREATE TABLE user_achievements (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT REFERENCES achievements(id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);
```

### leaderboard_weekly
> 주간 리더보드

```sql
CREATE TABLE leaderboard_weekly (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE,
  total_score INT DEFAULT 0,
  exercises_completed INT DEFAULT 0,
  perfect_scores INT DEFAULT 0,
  total_time_seconds INT DEFAULT 0,
  PRIMARY KEY (user_id, week_start)
);

CREATE INDEX idx_leaderboard_week ON leaderboard_weekly (week_start, total_score DESC);
```

### leaderboard_monthly
> 월간 리더보드

```sql
CREATE TABLE leaderboard_monthly (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month_start DATE,
  total_score INT DEFAULT 0,
  exercises_completed INT DEFAULT 0,
  PRIMARY KEY (user_id, month_start)
);
```

---

## 5. 소셜 (Social)

### user_follows
> 친구/팔로우

```sql
CREATE TABLE user_follows (
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

CREATE INDEX idx_follows_follower ON user_follows (follower_id);
CREATE INDEX idx_follows_following ON user_follows (following_id);
```

### study_groups
> 스터디 그룹

```sql
CREATE TABLE study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT true,
  max_members INT DEFAULT 50,
  invite_code TEXT UNIQUE,
  show_member_status BOOLEAN DEFAULT true,  -- 멤버 상태 표시
  group_goal TEXT,                          -- 그룹 목표 설명
  weekly_target INT DEFAULT 10,             -- 주간 목표 문제 수
  current_week_start DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### study_group_members
> 그룹 멤버

```sql
CREATE TABLE study_group_members (
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',         -- 'owner', 'admin', 'member'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);
```

### challenges
> 1:1 챌린지

```sql
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID REFERENCES auth.users(id),
  opponent_id UUID REFERENCES auth.users(id),
  exercise_id UUID REFERENCES exercises(id),
  challenger_score INT,
  challenger_time_seconds INT,
  opponent_score INT,
  opponent_time_seconds INT,
  status TEXT DEFAULT 'pending',      -- 'pending', 'active', 'completed', 'expired'
  winner_id UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. 결제/구독 (Payments)

### subscriptions
> 구독 정보

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL,                 -- 'monthly', 'yearly', 'lifetime'
  status TEXT NOT NULL,               -- 'active', 'canceled', 'expired', 'past_due'
  provider TEXT,                      -- 'stripe', 'paddle', 'apple', 'google'
  provider_subscription_id TEXT,      -- 외부 결제사 ID
  provider_customer_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions (user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions (status);
```

### payment_history
> 결제 내역

```sql
CREATE TABLE payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  subscription_id UUID REFERENCES subscriptions(id),
  amount_cents INT,
  currency TEXT DEFAULT 'USD',        -- 🌍 다중 통화 지원
  status TEXT,                        -- 'succeeded', 'failed', 'refunded', 'pending'
  provider TEXT,
  provider_payment_id TEXT,
  failure_reason TEXT,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### promo_codes
> 프로모션 코드

```sql
CREATE TABLE promo_codes (
  code TEXT PRIMARY KEY,
  description TEXT,
  discount_percent INT,
  discount_amount_cents INT,
  valid_for_tiers TEXT[],             -- ['monthly', 'yearly']
  max_uses INT,
  current_uses INT DEFAULT 0,
  min_amount_cents INT,
  first_time_only BOOLEAN DEFAULT false,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. 추천/프로모션 (Referrals)

### referral_codes
> 추천 코드

```sql
CREATE TABLE referral_codes (
  code TEXT PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id),
  reward_type TEXT,                   -- 'free_week', 'discount_10', 'xp_bonus'
  reward_value INT,
  uses_remaining INT,
  total_uses INT DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### referral_uses
> 추천 코드 사용 기록

```sql
CREATE TABLE referral_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT REFERENCES referral_codes(code),
  referrer_id UUID REFERENCES auth.users(id),
  referred_user_id UUID REFERENCES auth.users(id),
  referrer_reward_given BOOLEAN DEFAULT false,
  referred_reward_given BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 8. 분석/실험 (Analytics)

### analytics_events
> 이벤트 추적

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,                       -- 비로그인도 가능 (NULL)
  session_id TEXT,
  event_name TEXT NOT NULL,           -- 'exercise_started', 'purchase_completed'
  event_properties JSONB,
  device_info JSONB,                  -- {platform, os, app_version, screen_size}
  geo_info JSONB,                     -- {country, region, city}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 파티셔닝 권장 (대용량)
CREATE INDEX idx_events_user ON analytics_events (user_id);
CREATE INDEX idx_events_name ON analytics_events (event_name);
CREATE INDEX idx_events_date ON analytics_events (created_at);
```

### daily_metrics
> 일별 집계 (대시보드용)

```sql
CREATE TABLE daily_metrics (
  date DATE,
  metric_name TEXT,                   -- 'dau', 'exercises_completed', 'revenue'
  metric_value DECIMAL,
  dimensions JSONB,                   -- {country: 'KR', tier: 'premium', section: 'reading'}
  PRIMARY KEY (date, metric_name, dimensions)
);
```

### experiments
> A/B 테스트 정의

```sql
CREATE TABLE experiments (
  id TEXT PRIMARY KEY,                -- 'onboarding_v2', 'pricing_test'
  description TEXT,
  variants JSONB,                     -- ['control', 'variant_a', 'variant_b']
  traffic_percent INT DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### user_experiments
> 유저별 실험 배정

```sql
CREATE TABLE user_experiments (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  experiment_id TEXT REFERENCES experiments(id),
  variant TEXT,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, experiment_id)
);
```

### feature_flags
> 피처 플래그

```sql
CREATE TABLE feature_flags (
  id TEXT PRIMARY KEY,                -- 'enable_speaking_section'
  description TEXT,
  is_enabled BOOLEAN DEFAULT false,
  enabled_for_tiers TEXT[],           -- ['premium']
  enabled_for_users UUID[],           -- 특정 유저만
  rollout_percent INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 9. 규정 준수 (Compliance)

### audit_logs
> 감사 로그 (민감한 작업)

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,               -- 'login', 'export_data', 'delete_account', 'payment'
  resource_type TEXT,                 -- 'user', 'subscription', 'exercise'
  resource_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs (user_id);
CREATE INDEX idx_audit_action ON audit_logs (action);
```

### data_deletion_requests
> GDPR 데이터 삭제 요청

```sql
CREATE TABLE data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,                       -- 삭제 후에도 로그 유지 (익명화)
  user_email TEXT,                    -- 삭제 전 백업
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_at TIMESTAMPTZ,           -- 삭제 예정일 (30일 유예 등)
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending'       -- 'pending', 'processing', 'completed', 'canceled'
);
```

### data_export_requests
> GDPR 데이터 내보내기 요청

```sql
CREATE TABLE data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  download_url TEXT,
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending'
);
```

---

## 10. 알림 (Notifications)

### notification_preferences
> 알림 설정

```sql
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_daily_reminder BOOLEAN DEFAULT true,
  email_weekly_report BOOLEAN DEFAULT true,
  email_marketing BOOLEAN DEFAULT false,
  email_product_updates BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  push_streak_reminder BOOLEAN DEFAULT true,
  push_challenge_updates BOOLEAN DEFAULT true,
  push_achievement_unlocked BOOLEAN DEFAULT true,
  quiet_hours_start TIME,             -- 방해금지 시작
  quiet_hours_end TIME,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### notifications
> 알림 내역

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT,                          -- 'streak_warning', 'achievement', 'challenge', 'system'
  title TEXT,
  body TEXT,
  data JSONB,                         -- 딥링크 등 추가 데이터
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications (user_id, is_read);
```

---

## 11. 지원 (Support)

### support_tickets
> 고객 지원 티켓

```sql
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  category TEXT,                      -- 'bug', 'billing', 'content', 'feature', 'account'
  subject TEXT,
  description TEXT,
  status TEXT DEFAULT 'open',         -- 'open', 'in_progress', 'waiting', 'resolved', 'closed'
  priority TEXT DEFAULT 'normal',     -- 'low', 'normal', 'high', 'urgent'
  assigned_to TEXT,                   -- 담당자
  attachments JSONB,                  -- 첨부 파일 URLs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
```

### support_ticket_messages
> 티켓 대화 내역

```sql
CREATE TABLE support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_type TEXT,                   -- 'user', 'agent', 'system'
  sender_id UUID,
  message TEXT,
  attachments JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### user_feedback
> 일반 피드백

```sql
CREATE TABLE user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  exercise_id UUID REFERENCES exercises(id),
  feedback_type TEXT,                 -- 'exercise', 'feature', 'general'
  rating INT,                         -- 1~5
  feedback_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📊 스키마 요약

| 카테고리 | 테이블 수 | 핵심 테이블 |
| :--- | :---: | :--- |
| **콘텐츠** | 6 | exercises, media_files, topic_taxonomy |
| **유저** | 4 | user_profiles, user_sessions, user_skills, usage_limits |
| **학습** | 5 | exercise_history, review_queue, bookmarks, vocabulary, diagnostic |
| **학습 패턴** | 3 | learning_patterns, topic_performance, growth_metrics |
| **어휘력 향상** | 4 | vocabulary_reviews, vocabulary_metrics, vocabulary_growth, vocabulary (확장) |
| **소셜** | 4 | active_sessions, group_activities, group_weekly_stats, follows (확장) |
| **비교 통계** | 3 | cohort_statistics, user_cohorts, cohort_aggregates |
| **AI 추천** | 1 | learning_recommendations |
| **게이미피케이션** | 4 | streaks, achievements, user_achievements, leaderboard |
| **소셜** | 4 | follows, study_groups, members, challenges |
| **결제** | 3 | subscriptions, payment_history, promo_codes |
| **추천** | 2 | referral_codes, referral_uses |
| **분석** | 5 | events, daily_metrics, experiments, user_experiments, feature_flags |
| **규정** | 3 | audit_logs, deletion_requests, export_requests |
| **알림** | 2 | notifications, notification_preferences |
| **지원** | 3 | tickets, ticket_messages, feedback |
| **Total** | **46** | (+5: 어휘력 향상, 학습 패턴, 소셜, 비교 통계, AI 추천) |

---

## 🚀 구현 Phase

### Phase 1: MVP (Week 1)
- [ ] exercises
- [ ] user_profiles (basic)
- [ ] user_exercise_history

### Phase 2: Auth & Personalization (Week 2)
- [ ] user_skills
- [ ] user_usage_limits
- [ ] user_bookmarks
- [ ] user_vocabulary

### Phase 3: Gamification (Week 3)
- [ ] user_streaks
- [ ] achievements
- [ ] user_achievements
- [ ] leaderboard_weekly

### Phase 4: Monetization (Week 4)
- [ ] subscriptions
- [ ] payment_history
- [ ] promo_codes

### Phase 5: Growth (Week 5+)
- [ ] Social features
- [ ] Analytics
- [ ] Support system

---

## 🔧 Supabase RLS Policies (예시)

```sql
-- user_profiles: 본인만 조회/수정
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- exercises: 모든 인증된 유저가 조회 가능
CREATE POLICY "Authenticated users can view exercises"
  ON exercises FOR SELECT
  TO authenticated
  USING (is_active = true);

-- user_exercise_history: 본인 기록만
CREATE POLICY "Users can view own history"
  ON user_exercise_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history"
  ON user_exercise_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

> **Remember**: 처음부터 확장성 있게 설계. 나중에 마이그레이션은 고통이다. 🚀

