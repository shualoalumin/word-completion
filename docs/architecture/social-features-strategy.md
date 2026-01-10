# 👥 친구 및 소셜 기능 전략

> **목적**: 학습자 간 상호작용을 통한 동기부여 및 Retention 향상  
> **핵심 가치**: 현재 학습 중 표시 + 스터디 그룹 연계  
> **Last Updated**: 2026-01-11

---

## 🎯 핵심 비전

### 사용자 요구사항

1. **친구 기능**: 사용자 간 친구 맺기
2. **현재 학습 중 표시**: 인스타/페이스북 스타일의 실시간 상태 표시
3. **스터디 그룹 연계**: 그룹 내 활동 공유

### 비즈니스 가치

- **동기부여**: 친구들과의 비교 → 경쟁 의식 → 학습량 증가
- **Retention**: 소셜 연결 → 앱 이탈 감소 → 리텐션 향상
- **바이럴 성장**: 친구 초대 → 자연스러운 성장

---

## 📊 스키마 설계

### 1. 현재 학습 상태 추적 (신규)

```sql
-- 사용자 현재 활동 상태 추적
CREATE TABLE user_active_sessions (
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

CREATE INDEX idx_active_sessions_last_active ON user_active_sessions (last_active_at DESC);
CREATE INDEX idx_active_sessions_active ON user_active_sessions (is_active, last_active_at DESC) 
  WHERE is_active = true;
```

### 2. 친구 활동 피드 (View)

```sql
-- 친구들의 현재 활동을 보기 위한 뷰
CREATE OR REPLACE VIEW friend_activity_feed AS
SELECT 
  f.follower_id as user_id,              -- 내 ID
  f.following_id as friend_id,            -- 친구 ID
  up.display_name as friend_name,         -- 친구 이름
  up.avatar_url as friend_avatar,         -- 친구 아바타
  ua.is_active,                           -- 친구가 현재 활동 중인지
  ua.current_activity,                    -- 친구의 현재 활동
  ua.current_exercise_id,                 -- 친구가 풀고 있는 문제 ID
  ua.last_active_at,                      -- 친구의 마지막 활동 시각
  ua.status_message,                      -- 친구의 상태 메시지
  CASE 
    WHEN ua.is_active = true THEN 'online'
    WHEN ua.last_active_at > NOW() - INTERVAL '5 minutes' THEN 'recently_active'
    WHEN ua.last_active_at > NOW() - INTERVAL '1 hour' THEN 'active_today'
    ELSE 'offline'
  END as activity_status
FROM user_follows f
JOIN user_profiles up ON f.following_id = up.id
LEFT JOIN user_active_sessions ua ON f.following_id = ua.user_id
WHERE ua.show_active_status = true
  AND ua.visible_to_friends_only = true
ORDER BY 
  CASE activity_status
    WHEN 'online' THEN 1
    WHEN 'recently_active' THEN 2
    WHEN 'active_today' THEN 3
    ELSE 4
  END,
  ua.last_active_at DESC;

-- 인덱스 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_follows_follower ON user_follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON user_follows (following_id);
```

### 3. 스터디 그룹 활동 피드 (신규)

```sql
-- study_groups 테이블 확장 (이미 존재하지만 추가 필드 필요)
ALTER TABLE study_groups
  ADD COLUMN IF NOT EXISTS show_member_status BOOLEAN DEFAULT true,  -- 멤버 상태 표시
  ADD COLUMN IF NOT EXISTS group_goal TEXT,                          -- 그룹 목표 설명
  ADD COLUMN IF NOT EXISTS weekly_target INT DEFAULT 10,            -- 주간 목표 문제 수
  ADD COLUMN IF NOT EXISTS current_week_start DATE DEFAULT CURRENT_DATE,  -- 현재 주 시작일
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,          -- 공개 그룹 여부
  ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE,                 -- 초대 코드
  ADD COLUMN IF NOT EXISTS description TEXT;                        -- 그룹 설명

-- 그룹 멤버 활동 기록
CREATE TABLE study_group_activities (
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

CREATE INDEX idx_group_activities_group ON study_group_activities (group_id, created_at DESC);
CREATE INDEX idx_group_activities_user ON study_group_activities (user_id, created_at DESC);
CREATE INDEX idx_group_activities_type ON study_group_activities (activity_type);

-- 그룹 주간 통계 (집계용)
CREATE TABLE study_group_weekly_stats (
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

CREATE INDEX idx_group_weekly_stats ON study_group_weekly_stats (group_id, week_start, rank_in_group);
```

### 4. 실시간 업데이트 (Supabase Realtime)

```typescript
// 친구 활동 실시간 업데이트를 위한 채널 구독
const subscribeToFriendActivity = (userId: string) => {
  const channel = supabase
    .channel(`friend-activity:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_active_sessions',
        filter: `user_id=in.(${friendIds.join(',')})`  // 친구 ID들만
      },
      (payload) => {
        // 친구 상태 변경 시 실시간 업데이트
        updateFriendStatus(payload.new);
      }
    )
    .subscribe();
  
  return channel;
};
```

---

## 🎨 UI/UX 설계

### 1. 사이드바 친구 목록 (프리미엄 기능)

**위치**: Dashboard 우측 사이드바

```
┌─────────────────────────────┐
│  Friends Online (3/5)       │
├─────────────────────────────┤
│                             │
│  👤 Sarah                   │
│     🟢 Learning Reading     │
│     "Practice session"      │
│     Active 2 min ago        │
│                             │
│  👤 John                    │
│     🟢 Reviewing Words      │
│     Active 5 min ago        │
│                             │
│  👤 Emma                    │
│     ⚫ Idle                 │
│     Last seen 1h ago        │
│                             │
│  👤 Mike                    │
│     ⚫ Offline              │
│     Last seen yesterday     │
│                             │
│  ─────────────────────────  │
│  [+ Add Friends]            │
│  [Manage Friends]           │
└─────────────────────────────┘
```

**기능**:
- 친구 목록 표시 (온라인/오프라인 구분)
- 현재 활동 중인 친구 상단 표시
- 친구 클릭 → 프로필/성적 확인 가능
- 친구에게 메시지 보내기 (향후 기능)

### 2. 현재 학습 중 표시 아이콘

**위치**: 사용자 프로필 옆, Dashboard 상단

```
┌─────────────────────────────┐
│  GlobalPrep    [👤 Josh 🟢] │
│               "Learning..." │
└─────────────────────────────┘
```

**기능**:
- 현재 활동 중일 때 🟢 표시
- 마우스 오버 시 상세 정보:
  - "Learning Reading"
  - "Practice session"
  - "Active 2 min ago"

### 3. 스터디 그룹 대시보드

```
┌─────────────────────────────────────────┐
│  Study Group: TOEFL Masters             │
├─────────────────────────────────────────┤
│                                         │
│  Group Goal: 100 TOEFL Score            │
│  Weekly Target: 50 exercises            │
│                                         │
│  ──────────────────────────────────────│
│                                         │
│  This Week's Leaderboard                │
│                                         │
│  1. 👤 Sarah    45 exercises  🏆        │
│  2. 👤 John     38 exercises            │
│  3. 👤 You      32 exercises            │
│  4. 👤 Emma     28 exercises            │
│                                         │
│  ──────────────────────────────────────│
│                                         │
│  Recent Activities                      │
│                                         │
│  👤 Sarah completed "Science Passage"   │
│     Score: 90% • 2 min ago              │
│                                         │
│  👤 John achieved 7-day streak 🔥       │
│     5 min ago                           │
│                                         │
│  👤 You mastered 10 new words           │
│     10 min ago                          │
│                                         │
└─────────────────────────────────────────┘
```

### 4. 친구 추가 모달

```
┌─────────────────────────────────────────┐
│  Add Friends                            │
├─────────────────────────────────────────┤
│                                         │
│  Search by username or email:           │
│  [                    ] [Search]        │
│                                         │
│  Suggested Friends                      │
│                                         │
│  👤 @john_doe                          │
│     John Doe                            │
│     Similar level: B2                  │
│     [Follow]                            │
│                                         │
│  👤 @emma_smith                        │
│     Emma Smith                          │
│     Similar level: B2                  │
│     [Follow]                            │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔧 구현 단계

### Phase 1: 기본 친구 기능 (2주 내)

**목표**: 친구 맺기 + 기본 상태 표시

1. ✅ `user_active_sessions` 테이블 생성
2. ✅ 친구 추가/삭제 기능
3. ✅ 기본 현재 활동 상태 추적
4. ✅ 친구 목록 UI (간단한 버전)

**예상 소요 시간**: 1-2주

---

### Phase 2: 실시간 상태 표시 (3주 내)

**목표**: 인스타/페이스북 스타일 실시간 상태

1. ✅ Supabase Realtime 연동
2. ✅ 실시간 상태 업데이트
3. ✅ 사이드바 친구 목록 (온라인/오프라인)
4. ✅ 프라이버시 설정 UI

**예상 소요 시간**: 1주

---

### Phase 3: 스터디 그룹 연계 (1개월 내)

**목표**: 그룹 내 활동 공유

1. ✅ `study_group_activities` 테이블 생성
2. ✅ 그룹 주간 통계 (`study_group_weekly_stats`)
3. ✅ 그룹 리더보드 UI
4. ✅ 그룹 활동 피드
5. ✅ 그룹 챌린지 기능

**예상 소요 시간**: 2주

---

### Phase 4: 고급 소셜 기능 (향후)

**목표**: 소셜 네트워크 기능 강화

1. ✅ 친구 간 메시지 기능
2. ✅ 그룹 채팅
3. ✅ 1:1 챌린지
4. ✅ 성공 사례 공유

**예상 소요 시간**: 1개월

---

## 🔒 프라이버시 및 보안

### 프라이버시 설정 레벨

1. **Public**: 모든 사용자에게 상태 표시
2. **Friends Only**: 친구에게만 표시 (기본값)
3. **Private**: 상태 표시 안 함

### 보안 고려사항

- **RLS (Row Level Security)**: 사용자 자신의 데이터만 수정 가능
- **익명화**: 친구에게는 이름/아바타만 표시, 개인 정보 보호
- **선택적 공유**: 현재 풀고 있는 문제는 기본적으로 비공개

---

## 📈 성공 지표 (KPI)

### 사용자 행동 지표

- **친구 추가율**: 사용자 중 친구를 추가한 비율 (목표: 30%+)
- **활동 공유율**: 활동을 공유하는 비율 (목표: 40%+)
- **그룹 참여율**: 스터디 그룹 참여 비율 (목표: 20%+)

### Engagement 지표

- **친구 기능 사용자 DAU**: 친구 기능을 사용하는 일일 활성 사용자 (목표: 50%+)
- **소셜 상호작용**: 친구 프로필 조회, 활동 확인 등 (목표: 증가)
- **그룹 활동 증가**: 그룹 내 활동 증가율 (목표: 30%+)

### Retention 지표

- **소셜 기능 사용자 Retention**: 친구 기능 사용자의 리텐션 (목표: 25%+ 향상)
- **그룹 멤버 Retention**: 그룹 멤버의 리텐션 (목표: 40%+ 향상)

---

## 🎯 스터디 그룹 기능 상세

### 그룹 생성 및 관리

**기능**:
- 그룹 생성 (이름, 설명, 목표, 초대 코드)
- 그룹 설정 (공개/비공개, 최대 멤버 수)
- 그룹 관리 (멤버 초대, 추방, 역할 설정)

### 그룹 내 기능

**기능**:
- 주간 리더보드 (문제 풀이 수, 점수 등)
- 그룹 활동 피드 (멤버 활동 실시간 표시)
- 그룹 목표 달성 추적
- 그룹 챌린지 (1:1 또는 그룹 vs 그룹)

### 그룹과 친구 기능 연계

**시나리오**:
1. 그룹 멤버를 친구로 추가
2. 그룹 활동에서 친구 활동 확인
3. 친구 프로필에서 그룹 멤버십 표시
4. 그룹 내 친구와 챌린지

---

## 📝 다음 단계

1. **마이그레이션 파일 생성**: `user_active_sessions`, `study_group_activities` 테이블
2. **API 함수 설계**: 친구 관련 API 함수들
3. **UI 컴포넌트 설계**: 사이드바 친구 목록, 그룹 대시보드
4. **Realtime 연동**: Supabase Realtime으로 실시간 상태 업데이트
5. **프라이버시 설정**: 사용자 프라이버시 설정 UI

---

> **핵심 메시지**: 소셜 기능은 단순히 친구를 추가하는 것이 아니라, 학습 동기를 부여하고 지속적인 참여를 유도하는 핵심 기능입니다. 현재 학습 중 표시를 통해 "친구도 공부하고 있구나"라는 사회적 증거를 제공하고, 스터디 그룹을 통해 목표 지향적 학습을 지원합니다.
