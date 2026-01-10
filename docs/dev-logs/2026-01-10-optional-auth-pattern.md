# 🔐 Optional Authentication Pattern for Edge Functions

> **Date**: 2026-01-10  
> **Topic**: Authentication Strategy & Edge Function Design  
> **Participants**: User & AI Assistant

---

## 1. The Context (배경)

Google OAuth 구현 완료 후, 인증된 사용자가 Dashboard에서 "Complete the Words" 카드를 클릭했을 때 문제 생성이 실패하는 현상 발견. 에러 조사 결과 Edge Function `generate-passage`가 401 Unauthorized 에러를 반환함.

**문제 상황**:
- 비인증 사용자(Demo 모드)로는 정상 작동
- 인증된 사용자로는 401 에러 발생
- Edge Function이 인증 토큰을 받지 못하고 있음

---

## 2. The Problem (문제 심층 분석)

### 왜 401 에러가 발생했나?

1. **Frontend**: `generatePassage()` 함수가 인증 토큰을 Edge Function에 전달하지 않음
2. **Edge Function**: 인증 토큰을 기대하지만, 전달받지 못함
3. **설정**: `supabase/config.toml`에 `verify_jwt = false`로 설정되어 있음
   - 하지만 Supabase의 기본 동작은 인증 토큰이 없으면 에러를 반환할 수 있음

### 설계 고려사항

**질문**: Edge Function은 인증이 필수여야 하는가?

**고려사항**:
- ✅ **Demo 모드 지원**: 비인증 사용자도 문제를 풀어볼 수 있어야 함 (온보딩)
- ✅ **개인화**: 인증된 사용자는 기록 저장, 통계 추적 필요
- ✅ **확장성**: 미래에는 프리미엄/무료 기능 차별화 필요
- ✅ **유연성**: 같은 Edge Function이 다양한 시나리오에서 작동해야 함

---

## 3. The Decision (의사결정)

**"Optional Authentication Pattern" 채택**

Edge Function을 **선택적으로 인증을 받도록** 설계:

| 구분 | 기존 접근 (고려했던 것) | 새로운 접근 (선택) |
|------|---------------------|------------------|
| **인증 요구** | 필수 (required) | 선택적 (optional) |
| **비인증 사용자** | ❌ 접근 불가 | ✅ 접근 가능 (Demo 모드) |
| **인증 사용자** | ✅ 접근 가능 | ✅ 접근 가능 + 추가 기능 (로깅, 개인화) |
| **설계 철학** | "인증 필수" | "인증은 옵션, 있으면 더 나은 기능 제공" |

---

## 4. Implementation (구현 내용)

### Frontend 수정

**파일**: `src/features/reading/text-completion/api.ts`

```typescript
export async function generatePassage(
  retryCount = 0
): Promise<GeneratePassageResult> {
  try {
    // Get current session to include auth token
    const { data: { session } } = await supabase.auth.getSession();
    
    // Invoke Edge Function with explicit headers
    const { data, error } = await supabase.functions.invoke('generate-passage', {
      headers: session ? {
        Authorization: `Bearer ${session.access_token}`,
      } : undefined,
    });
    // ... rest of the function
  }
}
```

**변경점**:
- 인증 세션이 있으면 `Authorization` 헤더에 토큰 포함
- 인증 세션이 없으면 헤더 전달 안 함 (비인증 모드)

### Backend 수정

**파일**: `supabase/functions/generate-passage/index.ts`

```typescript
serve(async (req) => {
  try {
    // Get auth header if present (optional - allows both authenticated and anonymous users)
    const authHeader = req.headers.get('Authorization');
    
    // Use service role for DB operations (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    // Optional: Log user info if authenticated (for analytics)
    if (authHeader) {
      try {
        const userSupabase = createClient(
          supabaseUrl,
          authHeader.replace('Bearer ', ''),
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          }
        );
        const { data: { user } } = await userSupabase.auth.getUser();
        if (user) {
          console.log(`Request from authenticated user: ${user.email || user.id}`);
        }
      } catch (authError) {
        // Ignore auth errors - function works for both authenticated and anonymous users
        console.log('Anonymous or invalid auth token - proceeding anyway');
      }
    }

    // Core logic continues regardless of authentication status
    // ... (캐시 조회, AI 생성 등)
  }
});
```

**핵심 설계 원칙**:

1. **Service Role 사용**: DB 작업은 Service Role Key로 수행 (RLS 우회)
   - 이유: 인증 여부와 관계없이 동일한 로직 실행 필요

2. **선택적 사용자 식별**: 인증 토큰이 있으면 사용자 정보 추출
   - 목적: 로깅, 분석, 향후 개인화 기능 준비
   - 에러 처리: 인증 토큰이 유효하지 않아도 무시하고 계속 진행

3. **Graceful Degradation**: 인증이 없어도 핵심 기능은 동작
   - **비인증 (Demo 모드)**:
     - ✅ 문제 생성 및 풀이 가능
     - ✅ 기본 정답 확인
     - ✅ Clue (힌트) 제공
     - ❌ 해석 없음
     - ❌ 어휘 뜻 풀이 없음
     - ❌ 기록 저장 없음
     - ❌ 통계 추적 없음
   
   - **인증 (무료 사용자) - 테스트 기간**:
     - ✅ 문제 생성 + 풀이
     - ✅ **지문 전체 해석** (모국어별 제공)
     - ✅ **주요 어휘 뜻 풀이** (모국어별 제공, 상위 10개 빈출 단어)
     - ✅ 기록 저장 (`user_exercise_history`)
     - ✅ 통계 추적 (스트릭, 정오율, 토픽별 분석)
     - ✅ 오답 노트 (`user_bookmarks`)
     - ✅ 복습 스케줄 (`user_review_queue` - Spaced Repetition)
     - ✅ 개인 단어장 (`user_vocabulary`)
     - ✅ 적응형 난이도 (사용자 스킬 기반)
     - ✅ 게이미피케이션 (스트릭, 업적, 리더보드)
     - ✅ 제한 없음 (테스트 기간)
   
   - **인증 (프리미엄 사용자) - 테스트 기간**:
     - ✅ 무료 사용자 기능 모두 포함
     - ✅ AI 기반 고급 설명
     - ✅ 맞춤형 학습 경로 추천
     - ✅ 오디오 발음 제공 (주요 어휘)
     - ✅ 문장 구조 분석 (고급 문법)
     - ✅ 무제한 문제 생성
   
   - **인증 (Basic 구독자) - 수익화 모델**:
     - ✅ 무료 사용자 기능 모두 포함 (해석, 통계, 기록)
     - ⚠️ 일일 20개 문제 제한
     - ❌ AI 기반 고급 분석 없음
   
   - **인증 (Premium 구독자) - 수익화 모델**:
     - ✅ Basic 구독자 기능 모두 포함
     - ✅ 무제한 문제 생성
     - ✅ AI 기반 약점 진단
     - ✅ 맞춤형 학습 경로 추천
     - ✅ 고급 통계 분석
     - ✅ 우선 고객 지원

---

## 5. Configuration (설정)

### `supabase/config.toml`

```toml
[functions.generate-passage]
verify_jwt = false
```

**설명**:
- `verify_jwt = false`: Supabase가 자동으로 JWT 검증하지 않음
- 우리가 수동으로 인증 토큰을 처리하므로 자동 검증 비활성화
- 이렇게 하면 인증 토큰이 없어도 Edge Function이 실행됨

---

## 6. Benefits (장점)

### 1. **유연성 (Flexibility)**
- 같은 Edge Function이 다양한 시나리오에서 작동
- Demo 모드와 개인화 모드 모두 지원

### 2. **점진적 개선 (Progressive Enhancement)**
- 핵심 기능은 비인증으로도 접근 가능
- 인증 시 추가 기능 제공 (기록, 통계, 개인화)

### 3. **온보딩 개선**
- 사용자는 회원가입 없이도 앱을 체험할 수 있음
- 체험 후 회원가입 유도 가능

### 4. **확장성**
- 미래에 프리미엄/무료 기능 차별화 시 유연하게 대응 가능
- 같은 함수에서 권한에 따라 다른 로직 실행 가능

---

## 7. Trade-offs (트레이드오프)

### 장점 ✅
- 유연성과 확장성 확보
- 온보딩 개선 (비인증 사용자 경험)
- 점진적 개선 패턴

### 단점 ⚠️
- 인증 로직이 코드에 명시적으로 포함되어 복잡도 증가
- 수동 인증 검증 필요 (자동 검증 비활성화)
- 에러 처리 로직 필요 (인증 토큰 유효성 검사)

### 대안 (고려했던 것들)

1. **별도 Edge Function 분리**
   - `generate-passage-auth` (인증 필수)
   - `generate-passage-demo` (비인증)
   - **결정**: 코드 중복, 유지보수 어려움 → 기각

2. **인증 필수로 전환**
   - 모든 사용자가 회원가입 필요
   - **결정**: 온보딩 저해, 사용자 경험 저하 → 기각

3. **Optional Authentication (채택)**
   - 한 함수에서 선택적으로 인증 처리
   - **결정**: 유연성과 확장성 확보 → 채택

---

## 7.5. Business Differentiation Strategy (비즈니스 차별화 전략) 🎯

### 핵심 가치 제안 (Core Value Proposition)

**"Demo로 맛보고, 로그인하면 진짜 학습이 시작된다"**

인증 여부에 따라 학습 경험을 완전히 차별화하여 **전환율(Conversion Rate)**과 **리텐션(Retention)**을 극대화.

---

### 비즈니스 관점 차별화 전략

#### 1. 🌍 글로벌 최적화 (Global-First Differentiation)

**문제**: TOEFL 학습자는 다양한 모국어를 가진 글로벌 사용자

**해결**: 모국어 기반 콘텐츠 제공으로 학습 효과 극대화

| 기능 | 비인증 | 인증 (무료) | 비즈니스 가치 |
|------|--------|-----------|-------------|
| **지문 해석** | ❌ 없음 | ✅ **모국어별 제공** (user_profiles.locale 기반) | **전환율 향상**: 해석을 보려면 로그인 필요 |
| **어휘 뜻 풀이** | ❌ 없음 | ✅ **모국어별 제공** (상위 10개 빈출 단어) | **학습 효과**: 이해도 ↑ → 만족도 ↑ → 리텐션 ↑ |
| **문맥 설명** | ❌ Clue만 | ✅ **상세 문맥 분석** (AI 생성) | **프리미엄 유도**: 고급 기능 체험 → 구독 전환 |

**구현 예시**:
```typescript
// Edge Function에서 인증된 사용자일 때 추가 콘텐츠 생성
if (user && user.locale) {
  const enhancedContent = await generateTranslation({
    passage: generatedPassage,
    targetLocale: user.locale, // 'ko', 'zh', 'ja', 'es' 등
    includeVocabulary: true,
    vocabularyCount: 10
  });
  
  return {
    ...generatedPassage,
    translation: enhancedContent.translation,
    vocabulary: enhancedContent.vocabulary // [{word, definition, example}]
  };
}
```

**DB 구조 준비**:
```sql
-- exercises 테이블 확장 (이미 JSONB로 설계됨)
-- content 필드에 추가:
{
  "content_parts": [...],
  "translations": {  -- 모국어별 해석 (캐싱)
    "ko": "지문 전체 해석...",
    "zh": "...",
    "ja": "..."
  },
  "vocabulary": [  -- 주요 어휘 (AI 분석)
    {
      "word": "photosynthesis",
      "definitions": {
        "en": "the process by which plants...",
        "ko": "식물이 빛과 이산화탄소를 이용하여...",
        "zh": "光合作用是植物..."
      },
      "example": "Photosynthesis is essential for plant growth."
    }
  ]
}
```

---

#### 2. 📈 학습 효과 극대화 (Learning Efficacy)

**비즈니스 임팩트**: 학습 효과 = 사용자 만족도 = 리텐션 = 구독 전환

| 기능 | 비즈니스 가치 | 구현 우선순위 |
|------|--------------|-------------|
| **적응형 난이도** | 사용자 스킬에 맞춘 문제 제공 → 학습 효율 ↑ | P0 (flow-5 이후) |
| **약점 분석** | AI 기반 약점 진단 → 개인화 학습 경로 | P1 (프리미엄) |
| **복습 스케줄** | Spaced Repetition (SM-2) → 장기 기억 강화 | P0 (flow-5) |
| **오답 노트** | 틀린 문제 자동 저장 → 집중 복습 | P0 (flow-5) |
| **개인 단어장** | 어휘 학습 효율화 → 영어 실력 향상 | P1 |

**데이터 활용**:
- `user_skills`: 스킬별 숙련도 → 적응형 난이도 조절
- `user_exercise_history`: 정답률 패턴 → 약점 분석
- `user_vocabulary`: 자주 틀리는 단어 → 복습 우선순위

---

#### 3. 🎮 동기부여 시스템 (Gamification & Engagement)

**비즈니스 목표**: 일일 활성 사용자(DAU) 증가, 이탈률 감소

| 기능 | 비즈니스 임팩트 | 전환율 효과 |
|------|---------------|------------|
| **스트릭 시스템** | 매일 돌아오게 만드는 핵심 기능 | 로그인 필수 → 전환율 ↑ |
| **업적/뱃지** | 성취감 제공 → 지속적 참여 | 리텐션 ↑ → 구독 전환 ↑ |
| **리더보드** | 경쟁 의식 → 더 많은 문제 풀이 | 사용량 ↑ → 가치 인식 ↑ |
| **소셜 챌린지** | 친구와 경쟁 → 바이럴 성장 | 유료 추천 → 신규 유입 |

**구현 예시**:
```typescript
// 문제 완료 시 스트릭 자동 업데이트
await updateStreak(userId, {
  completedExercise: true,
  date: new Date()
});

// 업적 달성 확인
await checkAchievements(userId, {
  streak: currentStreak,
  totalExercises: totalCount,
  perfectScores: perfectCount
});
```

---

#### 4. 💡 학습 인사이트 (Data-Driven Insights)

**비즈니스 가치**: 사용자가 자신의 성장을 보면 → 앱 가치 인식 ↑ → 구독 전환

| 기능 | 제공 데이터 | 비즈니스 효과 |
|------|-----------|-------------|
| **대시보드 통계** | 일일 문제 수, 스트릭, 평균 점수 | 현재 상태 인식 → 목표 설정 |
| **성장 곡선** | 주/월별 점수 추이 | 성장 가시화 → 만족도 ↑ |
| **토픽별 정오율** | Science 85%, History 60% | 약점 인식 → 집중 학습 |
| **스킬 분석** | Vocabulary 90%, Grammar 70% | 개인화 경로 → 프리미엄 유도 |

**프리미엄 차별화**:
- 무료: 기본 통계 (일일, 주간)
- 프리미엄: 상세 분석 (AI 기반 약점 진단, 맞춤형 추천)

---

#### 5. 🔄 학습 효율성 (Learning Efficiency)

**비즈니스 임팩트**: 효율적인 학습 = 빠른 실력 향상 = 만족도 ↑

| 기능 | 학습 효율 향상 | 구독 전환 효과 |
|------|--------------|--------------|
| **복습 스케줄** | SM-2 알고리즘 → 최적 타이밍 복습 | 장기 학습 → 리텐션 ↑ |
| **오답 노트** | 틀린 문제 자동 저장 → 집중 복습 | 학습 효율 ↑ → 만족도 ↑ |
| **북마크** | 중요한 문제 저장 → 재학습 | 커스터마이징 → 가치 인식 |
| **개인 단어장** | 자주 틀리는 단어 집중 학습 | 어휘력 향상 → 성과 인식 |

---

### 🎯 핵심 차별화 포인트 (Top 5 Business Differentiators)

#### 1. **모국어별 해석 & 어휘 풀이** (글로벌 확장 핵심)
- **가치**: 학습 효과 2-3배 향상 (이해도 ↑)
- **구현**: AI 기반 번역 + 모국어별 어휘 정의
- **타겟**: 한국, 중국, 일본, 스페인어권 사용자
- **비즈니스 효과**: 글로벌 시장 진출, 경쟁 우위

#### 2. **적응형 난이도** (개인화 학습)
- **가치**: 사용자 수준에 맞춘 문제 → 학습 효율 극대화
- **구현**: `user_skills` 기반 난이도 자동 조절
- **비즈니스 효과**: 만족도 ↑ → 리텐션 ↑ → 구독 전환

#### 3. **복습 스케줄** (Spaced Repetition)
- **가치**: 과학적 학습 방법 → 장기 기억 강화
- **구현**: SM-2 알고리즘, `user_review_queue` 테이블
- **비즈니스 효과**: 일일 활성 사용자(DAU) 증가

#### 4. **학습 인사이트** (데이터 기반)
- **가치**: 성장 가시화 → 동기부여
- **구현**: Dashboard 통계, 성장 곡선, 토픽별 분석
- **비즈니스 효과**: 앱 가치 인식 ↑ → 구독 전환

#### 5. **게이미피케이션** (동기부여)
- **가치**: 재미 + 성취감 → 지속적 참여
- **구현**: 스트릭, 업적, 리더보드
- **비즈니스 효과**: 리텐션 ↑, 바이럴 성장

---

### 📊 전환율 최적화 전략 (Conversion Funnel)

```
비인증 사용자 (Demo)
  ↓
[체험: 기본 문제 풀이]
  ↓
[유도: "Sign in to unlock 해석, 어휘 풀이, 통계"]
  ↓
인증 (무료 회원)
  ↓
[가치 인식: 해석, 통계, 스트릭 체험]
  ↓
[한계 경험: 일일 10개 제한, 기본 통계만]
  ↓
[프리미엄 CTA: "Unlock unlimited + AI 분석"]
  ↓
프리미엄 구독
```

**핵심 전략**:
1. **Freemium 모델**: 무료로 충분한 가치 제공 (해석, 기본 통계)
2. **점진적 한계 노출**: 일일 제한, 고급 기능 제한으로 자연스러운 업그레이드 유도
3. **가치 인식 강화**: 해석과 통계로 앱의 가치를 먼저 경험하게 함
4. **소셜 증거**: 스트릭, 리더보드로 경쟁 의식 자극

---

### 🌍 글로벌 확장 전략 (Global Expansion)

**모국어별 콘텐츠 제공**은 경쟁 우위의 핵심:

1. **한국어권** (타겟 #1)
   - 지문 해석 (한국어)
   - 어휘 뜻 (한국어)
   - 문법 설명 (한국어)

2. **중국어권** (타겟 #2)
   - 지문 해석 (중국어 간체/번체)
   - 어휘 뜻 (중국어)

3. **일본어권** (타겟 #3)
   - 지문 해석 (일본어)
   - 어휘 뜻 (일본어)

4. **스페인어권** (타겟 #4)
   - 지문 해석 (스페인어)
   - 어휘 뜻 (스페인어)

**구현 우선순위**:
- Phase 1: 한국어 (Korea, 대부분의 TOEFL 학습자)
- Phase 2: 중국어 (China, 급성장 시장)
- Phase 3: 일본어, 스페인어

**AI 활용**:
- Gemini 2.5 Flash의 다국어 번역 능력 활용
- 각 문제 생성 시 주요 언어별 해석 자동 생성
- `exercises.content.translations` JSONB 필드에 캐싱

---

### 💰 수익화 모델 (Monetization Strategy)

#### Freemium Model (무료 + 프리미엄)

**무료 (Free Tier)**:
- ✅ 일일 10개 문제 제한
- ✅ 기본 해석 및 어휘 풀이 (모국어별)
- ✅ 기본 통계 (일일, 주간)
- ✅ 스트릭 시스템
- ✅ 오답 노트 (최근 20개)

**프리미엄 (Premium Tier - $9.99/월)**:
- ✅ 무제한 문제 생성
- ✅ 고급 해석 (문장 구조 분석 포함)
- ✅ 상세 어휘 풀이 (예문, 동의어, 반의어)
- ✅ AI 기반 약점 진단
- ✅ 맞춤형 학습 경로 추천
- ✅ 고급 통계 (성장 곡선, 토픽별 심층 분석)
- ✅ 오디오 발음 제공
- ✅ 우선 고객 지원
- ✅ 광고 제거

**Enterprise Tier** (향후):
- 기관/학교용 대량 라이선스
- 학습 관리자 대시보드
- 커스텀 콘텐츠

---

### 🚀 구현 로드맵 (Implementation Roadmap)

#### Phase 1: 핵심 차별화 (flow-5, 6)
- [ ] `user_exercise_history` 저장
- [ ] 기본 통계 (스트릭, 정오율)
- [ ] 모국어별 해석 제공 (한국어 우선)
- [ ] 주요 어휘 뜻 풀이 (한국어)

#### Phase 2: 학습 효율화
- [ ] 복습 스케줄 (`user_review_queue`)
- [ ] 오답 노트 (`user_bookmarks`)
- [ ] 개인 단어장 (`user_vocabulary`)

#### Phase 3: 게이미피케이션
- [ ] 스트릭 시스템 (`user_streaks`)
- [ ] 업적 시스템 (`achievements`)
- [ ] 리더보드 (`leaderboard_weekly`)

#### Phase 4: 프리미엄 기능
- [ ] 사용량 제한 (`user_usage_limits`)
- [ ] AI 약점 진단
- [ ] 맞춤형 학습 경로

---

## 7.6. Deep Business Differentiation (심화 비즈니스 차별점) 💎

### 추가 제안: 탁월한 비즈니스 차별점

#### 🎯 1. **AI 기반 적응형 학습 경로** (Adaptive Learning Path)

**핵심 가치**: 사용자가 목표 점수까지 가는 최단 경로 제공

**차별점**:
- **비인증**: 고정 난이도 문제만 풀 수 있음
- **인증 (무료)**: 사용자 스킬 분석 후 적응형 난이도 제공
- **프리미엄**: AI 기반 맞춤형 학습 경로 (주 7일 플랜 생성)

**구현**:
```typescript
// 사용자 스킬 분석 후 다음 문제 난이도 자동 조절
const userSkill = await getUserSkill(userId, 'vocabulary');
const nextDifficulty = calculateAdaptiveDifficulty({
  currentSkill: userSkill.proficiency_score,
  recentPerformance: last5Exercises,
  targetScore: userProfile.targetScore
});
```

**비즈니스 효과**:
- 학습 효율 극대화 → 빠른 성과 → 만족도 ↑
- "이 앱 덕분에 2주 만에 점수가 올랐어요!" → 바이럴 성장
- 프리미엄 전환율: 고급 분석 기능으로 자연스러운 업그레이드 유도

---

#### 🧠 2. **맥락 기반 어휘 학습** (Context-Aware Vocabulary)

**핵심 가치**: 문제에서 나온 단어를 맥락과 함께 학습 → 장기 기억 강화

**차별점**:
- **비인증**: 단어 뜻만 제공 (기본)
- **인증**: 문제 문맥에서 나온 단어를 개인 단어장에 자동 저장 + 원문 예문 포함
- **프리미엄**: AI가 생성한 추가 예문 (다양한 맥락), 동의어/반의어, 어원 정보

**구현 예시**:
```typescript
// 문제 완료 시 주요 어휘 자동 추출 및 저장
const vocabularyExtraction = await extractVocabulary({
  passage: exercise.content,
  userMistakes: mistakes, // 틀린 단어 우선순위
  userLocale: user.locale
});

// user_vocabulary 테이블에 저장
await saveVocabulary({
  userId: user.id,
  words: vocabularyExtraction.map(word => ({
    word: word.text,
    sourceContext: word.sentence, // 원문에서 나온 문장
    definition: word.definitions[user.locale],
    example: word.example,
    masteryLevel: 0
  }))
});
```

**비즈니스 효과**:
- 학습 효과 3배 향상 (맥락 기반 기억)
- 단어장 기능으로 앱 내 머무는 시간 증가 (Engagement ↑)
- 프리미엄 전환: 고급 어휘 분석 기능

---

#### 📊 3. **예측 성적 분석** (Predicted Score Analytics)

**핵심 가치**: "이 정도 실력이면 실제 TOEFL에서 몇 점일까?" → 동기부여

**차별점**:
- **비인증**: 점수만 표시
- **인증 (무료)**: 예측 TOEFL 점수 (Rough estimate)
- **프리미엄**: 상세 분석 (섹션별 예측 점수, 취약 영역, 개선 추천)

**구현**:
```typescript
// 사용자 성과 기반 TOEFL 점수 예측
const predictedScore = calculatePredictedScore({
  readingScore: userSkills.reading.proficiency_score,
  avgAccuracy: userHistory.avg_accuracy,
  timeSpent: userHistory.avg_time_spent,
  difficultyDistribution: userHistory.difficulty_stats
});

// 예: "예상 TOEFL 점수: 85-90점 (Reading 기준)"
```

**비즈니스 효과**:
- 구체적 목표 설정 → 동기부여 강화
- "TOEFL 100점 목표인데 지금 85점이면..." → 학습 의욕 ↑
- 프리미엄: 상세 분석으로 자연스러운 업그레이드

---

#### 🎓 4. **학습 패턴 인사이트** (Learning Pattern Insights)

**핵심 가치**: "나는 언제 가장 효율적으로 학습하는가?" → 최적 학습 시간 발견

**차별점**:
- **비인증**: 데이터 수집 불가
- **인증 (무료)**: 기본 패턴 (평균 학습 시간, 선호 요일)
- **프리미엄**: AI 기반 최적 학습 시간 추천, 생체리듬 분석

**구현**:
```typescript
// 학습 패턴 분석
const learningPattern = await analyzeLearningPattern({
  userId: user.id,
  history: userHistory,
  sessions: userSessions
});

// 예: "당신은 오전 9-11시에 가장 높은 점수를 받습니다"
// "금요일보다 월요일에 더 집중력이 높습니다"
```

**비즈니스 효과**:
- 개인화된 인사이트 → 앱 가치 인식 ↑
- "이 앱이 내 학습 패턴을 알고 있다!" → 경쟁 우위
- 프리미엄: 고급 분석 기능으로 자연스러운 전환

---

#### 🌐 5. **다국어 UI + 콘텐츠 하이브리드** (Hybrid i18n)

**핵심 가치**: UI는 영어, 해석/어휘는 모국어 → 자연스러운 영어 학습 환경

**차별점**:
- **비인증**: 영어 UI만
- **인증**: UI 언어 선택 가능 (en, ko, zh, ja) + 해석은 모국어
- **프리미엄**: UI 언어별 맞춤형 설명 (문화적 맥락 포함)

**전략적 이유**:
- 영어 UI 유지: TOEFL 학습 환경 적응 (실전 대비)
- 모국어 해석 제공: 이해도 향상 (학습 효과)
- 하이브리드 접근: 최적의 학습 환경

**비즈니스 효과**:
- 글로벌 시장 진출 용이
- 학습 효과 극대화 → 만족도 ↑
- 경쟁 앱 대비 차별화 (대부분 영어만 제공)

---

#### 🔔 6. **지능형 리마인더 시스템** (Smart Reminder System)

**핵심 가치**: 사용자가 놓치지 않도록, 하지만 스팸은 아닌 스마트 알림

**차별점**:
- **비인증**: 알림 없음
- **인증 (무료)**: 기본 리마인더 (스트릭 유지, 일일 목표)
- **프리미엄**: AI 기반 최적 알림 타이밍, 복습 시점 알림

**구현**:
```typescript
// 복습 필요 단어가 있으면 알림
const reviewDue = await getReviewDueWords(userId);
if (reviewDue.length > 0) {
  await sendNotification({
    userId: user.id,
    type: 'review_reminder',
    message: `${reviewDue.length}개의 단어 복습이 필요합니다`,
    optimalTime: calculateOptimalTime(userId) // 사용자 활동 패턴 기반
  });
}
```

**비즈니스 효과**:
- 일일 활성 사용자(DAU) 증가
- 스트릭 유지율 증가
- 리텐션 ↑ → 구독 전환 ↑

---

#### 🤝 7. **사회적 증거 강화** (Social Proof Enhancement)

**핵심 가치**: "다른 사람들도 이 앱으로 성공했다" → 신뢰도 ↑

**차별점**:
- **비인증**: 통계 없음
- **인증**: 개인 통계만
- **프리미엄**: 익명화된 성공 사례, "당신과 비슷한 수준의 사용자들은..."

**구현**:
```typescript
// 성공 사례 추천 (익명화)
const similarUsers = await findSimilarUsers({
  currentSkill: user.skillLevel,
  targetScore: user.targetScore
});

// "평균 87점에서 시작한 사용자들이 평균 42일 만에 95점에 도달했습니다"
```

**비즈니스 효과**:
- 신뢰도 향상 → 전환율 ↑
- 동기부여 → 리텐션 ↑
- 프리미엄: 고급 인사이트로 자연스러운 전환

---

#### 🎯 8. **목표 기반 학습 추천** (Goal-Based Recommendations)

**핵심 가치**: "TOEFL 100점 목표" → 그 목표까지의 최적 경로 제시

**차별점**:
- **비인증**: 목표 설정 불가
- **인증 (무료)**: 기본 목표 설정 + 진행 상황 추적
- **프리미엄**: AI 기반 맞춤형 학습 계획, 주간 목표 자동 조정

**구현**:
```typescript
// 목표 기반 학습 경로 생성
const learningPath = await generateLearningPath({
  userId: user.id,
  targetScore: 100,
  currentScore: 85,
  timeAvailable: user.dailyGoal,
  deadline: user.targetDate
});

// 예: "100점 달성을 위해 주 5일, 일일 8문제, 6주 학습 필요"
```

**비즈니스 효과**:
- 구체적 목표 설정 → 동기부여 강화
- 학습 계획 제공 → 가치 인식 ↑
- 프리미엄: 고급 맞춤형 계획으로 자연스러운 전환

---

### 💎 최종 추천: Top 3 핵심 차별화 (Priority Order)

#### 1️⃣ **모국어별 해석 & 어휘 풀이** (글로벌 확장 핵심)
- **우선순위**: P0 (즉시 구현)
- **이유**: 학습 효과 2-3배 향상 → 만족도 ↑ → 리텐션 ↑
- **구현 난이도**: 중간 (AI 번역 활용)
- **비즈니스 효과**: 글로벌 시장 진출, 경쟁 우위

#### 2️⃣ **적응형 난이도 + 스킬 기반 분석** (개인화 핵심)
- **우선순위**: P0 (flow-5 이후)
- **이유**: 사용자 수준에 맞춘 문제 → 학습 효율 극대화
- **구현 난이도**: 높음 (데이터 수집 후 분석 필요)
- **비즈니스 효과**: 만족도 ↑ → 구독 전환

#### 3️⃣ **복습 스케줄 + 오답 노트** (학습 효율성 핵심)
- **우선순위**: P0 (flow-5)
- **이유**: 과학적 학습 방법 → 장기 기억 강화 → 일일 활성 사용자 ↑
- **구현 난이도**: 중간 (SM-2 알고리즘)
- **비즈니스 효과**: 리텐션 ↑, DAU ↑

---

### 📈 예상 비즈니스 임팩트

| 기능 | 전환율 향상 | 리텐션 향상 | 프리미엄 전환율 |
|------|-----------|-----------|---------------|
| 모국어 해석/어휘 | +15-20% | +25-30% | +10-15% |
| 적응형 난이도 | +10-15% | +20-25% | +15-20% |
| 복습 스케줄 | +5-10% | +30-40% | +5-10% |
| 학습 인사이트 | +10-15% | +15-20% | +20-25% |
| 게이미피케이션 | +5-10% | +25-30% | +5-10% |

**합계 예상 효과**:
- 전환율: **+45-70%** (비인증 → 인증)
- 리텐션: **+115-145%** (일일 활성 사용자)
- 프리미엄 전환율: **+55-85%** (무료 → 프리미엄)

---

## 8. Lessons Learned (회고)

### 핵심 인사이트

> **"Authentication is a feature, not a gatekeeper."**

인증은 **사용자 경험을 향상시키는 기능**이지, **접근을 막는 장벽**이 아니어야 함.

> **"Demo는 맛보기, 인증은 진짜 학습의 시작"**

비즈니스 관점에서, 인증/비인증 차별화는 **전환율과 리텐션을 극대화하는 핵심 전략**이다.
- 비인증: 충분한 가치 제공으로 체험 유도 (온보딩)
- 인증: 해석, 어휘 풀이, 통계로 가치 인식 강화 (전환율)
- 프리미엄: 고급 기능으로 자연스러운 업그레이드 유도 (수익화)

### 설계 원칙

1. **Graceful Degradation**: 핵심 기능은 항상 동작
2. **Progressive Enhancement**: 인증 시 추가 기능 제공
3. **Flexibility First**: 확장 가능한 구조 우선 고려

### 향후 적용

이 패턴은 다른 Edge Function에도 적용:
- 문제 생성: ✅ 적용 완료 (Optional Auth)
- 기록 저장: 인증 필수 (flow-5에서 구현 예정)
- 통계 조회: 인증 필수 (flow-6에서 구현 예정)
- 문제 검토/복습: 인증 필수 (향후 구현)
- 해석 & 어휘 제공: 인증 필수 (모국어별 콘텐츠, Phase 2에서 구현 예정)

### 비즈니스 차별화 적용 예정
- 모국어별 해석 & 어휘 풀이: 인증 사용자만 (글로벌 확장 핵심)
- 적응형 난이도 조절: 인증 사용자만 (개인화 학습)
- 복습 스케줄 추천: 인증 사용자만 (학습 효율성)
- 학습 인사이트: 인증 사용자만 (데이터 기반)

---

## 9. Related Decisions (관련 결정사항)

- **2025-12-31**: Clean In, Clean Out 아키텍처 전환
  - 이번 결정도 동일한 철학: "처음부터 확장 가능하게 설계"

---

## 10. Technical Notes (기술적 참고사항)

### MCP vs CLI 배포 이슈

**발견**: Supabase MCP 도구로 Edge Function 배포 시 `_shared` 폴더의 상대 경로 import 처리 실패

**해결**: Supabase CLI (`npx supabase`) 사용으로 전환
- CLI는 `_shared` 폴더를 자동으로 감지하여 올바르게 번들링
- 향후 배포는 CLI 사용 권장

**관찰**: MCP 도구는 단순 파일 업로드 방식이라 디렉토리 구조를 제대로 유지하지 못함

---

*이 문서는 프로젝트의 인증 전략 결정을 기록합니다. 향후 유사한 기능 추가 시 참고하세요.*
