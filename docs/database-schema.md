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
> 개인 단어장

```sql
CREATE TABLE user_vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  definition TEXT,
  example_sentence TEXT,
  source_exercise_id UUID REFERENCES exercises(id),
  mastery_level INT DEFAULT 0,        -- 0~5 (복습할수록 증가)
  next_review_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vocabulary_user ON user_vocabulary (user_id);
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
  recommended_level TEXT,
  taken_at TIMESTAMPTZ DEFAULT NOW()
);
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
| **게이미피케이션** | 4 | streaks, achievements, user_achievements, leaderboard |
| **소셜** | 4 | follows, study_groups, members, challenges |
| **결제** | 3 | subscriptions, payment_history, promo_codes |
| **추천** | 2 | referral_codes, referral_uses |
| **분석** | 5 | events, daily_metrics, experiments, user_experiments, feature_flags |
| **규정** | 3 | audit_logs, deletion_requests, export_requests |
| **알림** | 2 | notifications, notification_preferences |
| **지원** | 3 | tickets, ticket_messages, feedback |
| **Total** | **41** | |

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

