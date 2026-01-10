# 📊 비교 통계 전략 (지속 업데이트)

> **목적**: 사용자 증가에 따른 비교 우위 제공 및 AI 학습 방향성 제시  
> **핵심 가치**: 사회적 증거 + 개인화된 학습 경로 추천  
> **상태**: 🚧 지속적 논의 및 개선 필요  
> **Last Updated**: 2026-01-11

---

## 🎯 핵심 비전

### 비교 통계의 목적

1. **동기부여**: "다른 사람들도 열심히 한다" → 사회적 증거
2. **목표 설정**: "비슷한 수준 사용자들의 평균" → 구체적 목표
3. **학습 방향성**: "약점 영역 식별" → AI 기반 추천

### 비즈니스 가치

- **Retention**: 비교를 통한 동기부여 → 지속적 학습
- **프리미엄 전환**: 고급 분석 기능 → 자연스러운 업그레이드
- **신뢰도**: 객관적 통계 → 앱 가치 인식

---

## 📊 비교 통계 종류

### 1. 익명화된 집계 통계 (Phase 1, 기본)

**목적**: 개인 식별 불가능한 안전한 비교

**예시**:
- "비슷한 수준 사용자 평균 75점"
- "이 레벨 사용자들은 평균 50개 단어를 학습합니다"
- "B2 레벨 사용자의 평균 정답률은 78%입니다"

**특징**:
- ✅ 개인 정보 보호 (GDPR 준수)
- ✅ 안전하고 규정 준수
- ✅ 기본적인 비교 가능

**구현**:
```sql
-- 익명화된 코호트 통계
CREATE TABLE cohort_statistics (
  cohort_type TEXT NOT NULL,              -- 'similar_skill', 'same_target_score', 'same_level'
  cohort_key TEXT,                        -- 'B2', 'target_100', 'vocabulary_200'
  metric_name TEXT NOT NULL,              -- 'avg_score', 'avg_exercises', 'avg_words'
  metric_value DECIMAL NOT NULL,
  sample_size INT NOT NULL,               -- 표본 크기
  period_start DATE NOT NULL,
  period_end DATE,                        -- NULL이면 현재까지
  
  PRIMARY KEY (cohort_type, cohort_key, metric_name, period_start)
);

CREATE INDEX idx_cohort_stats ON cohort_statistics (cohort_type, cohort_key, period_start DESC);
```

---

### 2. 코호트 비교 (Phase 2, 동의 기반)

**목적**: 사용자가 선택적으로 참여하는 비교

**예시**:
- "나와 비슷한 목표 점수를 가진 사용자들과 비교"
- "같은 그룹 사용자들의 평균 성과"
- "비슷한 시작 시점의 사용자들과 비교"

**특징**:
- ✅ 사용자 동의 기반
- ✅ 더 정확한 비교
- ✅ 개인화된 인사이트

**구현**:
```sql
-- 사용자 코호트 배정 (동의 기반)
CREATE TABLE user_cohorts (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cohort_id TEXT NOT NULL,                 -- 'target_100_2024_q1', 'level_b2_2024'
  cohort_type TEXT NOT NULL,               -- 'target_score', 'starting_level', 'similar_skill'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  consent_given BOOLEAN DEFAULT true,      -- 비교 참여 동의
  
  PRIMARY KEY (user_id, cohort_id)
);

CREATE INDEX idx_user_cohorts ON user_cohorts (cohort_id, user_id);

-- 코호트별 집계 (주기적 업데이트)
CREATE TABLE cohort_aggregates (
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
  top_quartile_score DECIMAL,             -- 상위 25% 점수
  bottom_quartile_score DECIMAL,          -- 하위 25% 점수
  
  -- 표본 크기
  active_users_count INT,                  -- 활성 사용자 수
  total_users_count INT,                   -- 총 사용자 수
  
  PRIMARY KEY (cohort_id, metric_date)
);

CREATE INDEX idx_cohort_aggregates ON cohort_aggregates (cohort_id, metric_date DESC);
```

---

### 3. 소셜 비교 (Phase 3, 친구/그룹)

**목적**: 친구 및 그룹 멤버와의 비교

**예시**:
- "친구 Sarah는 이번 주에 45개 문제를 풀었습니다"
- "그룹 내 순위: 3/10"
- "당신의 점수는 친구 평균보다 10점 높습니다"

**특징**:
- ✅ 직접적인 비교 (동기부여 강함)
- ✅ 프라이버시 설정 존중
- ✅ 선택적 공유

**구현**:
- `user_follows` 테이블 활용 (친구)
- `study_group_members` 테이블 활용 (그룹)
- 프라이버시 설정 기반 비교 데이터 제공

---

### 4. AI 기반 학습 방향성 (Phase 4, 프리미엄)

**목적**: AI가 약점을 분석하고 맞춤형 학습 경로 추천

**예시**:
- "당신은 History 주제에서 약합니다 (60% 정답률)"
- "Vocabulary 영역 개선 시 예상 점수 향상: +5점"
- "이번 주 학습 계획: History 3문제, Vocabulary 복습 10개"

**특징**:
- ✅ 개인화된 분석
- ✅ 구체적인 개선 제안
- ✅ 프리미엄 전환 유도

**구현**:
```sql
-- AI 학습 추천 (이미 vocabulary-learning-system.md에 제안됨)
CREATE TABLE user_learning_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 추천 타입
  recommendation_type TEXT NOT NULL,        -- 'weak_topic', 'vocabulary_gap', 'skill_improvement', 'time_optimization'
  priority INT NOT NULL,                    -- 1~5 (높을수록 우선)
  
  -- 추천 내용
  target_skill TEXT,                        -- 'vocabulary', 'grammar', 'reading_comprehension'
  target_topic TEXT,                        -- 'Science', 'History'
  recommended_difficulty TEXT,             -- 'easy', 'intermediate', 'hard'
  recommended_exercises UUID[],            -- 추천 문제 ID 배열
  
  -- 근거 (AI 분석 결과)
  reasoning JSONB,                          -- {
                                            --   "weakness": "History 주제에서 60% 정답률",
                                            --   "comparison": "비슷한 수준 사용자 평균 75%",
                                            --   "impact": "개선 시 예상 점수 +5점"
                                            -- }
  
  -- 예상 효과
  expected_improvement DECIMAL,            -- 예상 점수 향상 (%)
  estimated_time_hours DECIMAL,             -- 예상 소요 시간
  confidence_score DECIMAL,                 -- AI 신뢰도 (0~1)
  
  -- 상태
  status TEXT DEFAULT 'pending',            -- 'pending', 'in_progress', 'completed', 'dismissed'
  user_feedback TEXT,                       -- 사용자 피드백
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recommendations_user ON user_learning_recommendations (user_id, priority DESC, status);
CREATE INDEX idx_recommendations_type ON user_learning_recommendations (recommendation_type);
```

---

## 🤖 AI 학습 방향성 제공 로직

### 1. 약점 분석 (Weakness Analysis)

```typescript
interface WeaknessAnalysis {
  weakArea: string;                        // 'History', 'vocabulary', 'grammar'
  currentPerformance: number;              // 현재 정답률 (0~1)
  cohortAverage: number;                   // 코호트 평균 (0~1)
  gap: number;                             // 차이 (0~1)
  impact: number;                          // 개선 시 예상 영향 (점수 향상)
}

async function analyzeWeaknesses(userId: string): Promise<WeaknessAnalysis[]> {
  // 1. 사용자 성과 데이터 수집
  const userPerformance = await getUserPerformance(userId);
  
  // 2. 코호트 평균 계산
  const cohortAvg = await getCohortAverage(userId);
  
  // 3. 약점 식별 (현재 < 평균 - 임계값)
  const weaknesses = identifyWeaknesses(userPerformance, cohortAvg, {
    threshold: 0.1  // 10% 이상 차이
  });
  
  // 4. 영향도 계산 (개선 시 예상 점수 향상)
  const impactAnalysis = calculateImpact(weaknesses);
  
  return impactAnalysis.sort((a, b) => b.impact - a.impact);  // 영향도 높은 순
}
```

### 2. 맞춤형 학습 경로 추천 (Personalized Learning Path)

```typescript
interface LearningPath {
  week: number;                            // 주차
  goals: {
    topic: string;                         // 'History'
    difficulty: string;                    // 'intermediate'
    exercisesCount: number;                // 5
    expectedImprovement: number;           // 예상 향상 (%)
  }[];
  estimatedTotalTime: number;              // 예상 총 시간 (시간)
  targetScoreImprovement: number;          // 목표 점수 향상
}

async function generateLearningPath(
  userId: string,
  targetScore: number,
  weeksAvailable: number
): Promise<LearningPath[]> {
  // 1. 현재 상태 분석
  const currentState = await analyzeCurrentState(userId);
  const weaknesses = await analyzeWeaknesses(userId);
  
  // 2. 목표 점수까지 갭 계산
  const currentScore = currentState.predictedScore;
  const scoreGap = targetScore - currentScore;
  
  // 3. 주차별 학습 계획 생성
  const weeklyPlans: LearningPath[] = [];
  
  for (let week = 1; week <= weeksAvailable; week++) {
    // 약점 우선순위 기반 문제 추천
    const weekGoals = prioritizeWeaknesses(weaknesses, {
      maxExercisesPerWeek: 20,
      focusArea: getFocusAreaForWeek(week, weaknesses)
    });
    
    weeklyPlans.push({
      week,
      goals: weekGoals,
      estimatedTotalTime: calculateTotalTime(weekGoals),
      targetScoreImprovement: (scoreGap / weeksAvailable) * week
    });
  }
  
  return weeklyPlans;
}
```

### 3. 실시간 비교 업데이트 (Real-time Comparison)

```typescript
// 사용자 성과가 업데이트될 때마다 비교 통계 재계산
async function updateComparisonMetrics(userId: string) {
  // 1. 사용자 현재 상태
  const userState = await getCurrentUserState(userId);
  
  // 2. 코호트 찾기
  const cohorts = await getUserCohorts(userId);
  
  // 3. 각 코호트와 비교
  const comparisons = await Promise.all(
    cohorts.map(async (cohort) => {
      const cohortStats = await getCohortStats(cohort.cohortId);
      
      return {
        cohortType: cohort.type,
        cohortName: cohort.name,
        userMetric: userState.score,
        cohortAverage: cohortStats.avgScore,
        userPercentile: calculatePercentile(
          userState.score,
          cohortStats.scoreDistribution
        ),
        message: generateComparisonMessage(userState, cohortStats)
      };
    })
  );
  
  // 4. 비교 결과 저장
  await saveComparisonResults(userId, comparisons);
  
  // 5. AI 추천 업데이트 (필요 시)
  if (shouldUpdateRecommendations(comparisons)) {
    await generateNewRecommendations(userId, comparisons);
  }
}
```

---

## 📈 Dashboard UI 예시

### 비교 통계 섹션

```
┌─────────────────────────────────────────┐
│      You vs Similar Learners            │
├─────────────────────────────────────────┤
│                                         │
│  Your Score: 85%                        │
│  Cohort Avg: 78%  (+7% above average)  │
│  ████████████░░░░░░░░  85/100          │
│                                         │
│  Percentile: 75th (Top 25%)            │
│  ████████████░░░░░░░░                   │
│                                         │
│  ──────────────────────────────────────│
│                                         │
│  Your Words: 245                        │
│  Cohort Avg: 230  (+15 words ahead)    │
│                                         │
│  Your Growth: +12/month                 │
│  Cohort Avg: +8/month  (50% faster)    │
│                                         │
└─────────────────────────────────────────┘
```

### AI 학습 방향성 섹션 (프리미엄)

```
┌─────────────────────────────────────────┐
│      AI Learning Recommendations        │
├─────────────────────────────────────────┤
│                                         │
│  🎯 Priority 1: Improve History        │
│     Current: 60% | Cohort Avg: 75%     │
│     Expected improvement: +5 points     │
│     [Start Practice]                    │
│                                         │
│  📚 Priority 2: Vocabulary Review      │
│     10 words due for review             │
│     Estimated time: 15 min              │
│     [Review Now]                        │
│                                         │
│  ⏰ Priority 3: Optimize Study Time    │
│     Your best time: 9-11 AM            │
│     Schedule: 3 exercises this week    │
│     [Set Reminder]                      │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔄 구현 단계별 계획

### Phase 1: 기본 비교 통계 (flow-6 후, 2주 내)

**목표**: 안전한 익명화된 집계 통계

1. ✅ `cohort_statistics` 테이블 생성
2. ✅ 기본 집계 로직 (주기적 배치 작업)
3. ✅ Dashboard에 비교 통계 섹션 추가

**예상 소요 시간**: 1주

---

### Phase 2: 코호트 비교 (1개월 내)

**목표**: 동의 기반 정확한 비교

1. ✅ `user_cohorts` 테이블 생성
2. ✅ `cohort_aggregates` 테이블 생성
3. ✅ 코호트 배정 로직
4. ✅ 코호트 비교 UI

**예상 소요 시간**: 1주

---

### Phase 3: AI 학습 방향성 (2개월 내, 프리미엄)

**목표**: 개인화된 학습 경로 추천

1. ✅ `user_learning_recommendations` 테이블 생성
2. ✅ 약점 분석 알고리즘
3. ✅ 맞춤형 학습 경로 생성
4. ✅ AI 추천 UI

**예상 소요 시간**: 2주

---

### Phase 4: 고급 비교 분석 (3개월 내, 프리미엄)

**목표**: 심화 분석 및 예측

1. ✅ 예측 모델 (점수 향상 예측)
2. ✅ 최적 학습 시간 분석
3. ✅ 성공 사례 기반 추천
4. ✅ 실시간 비교 업데이트

**예상 소요 시간**: 2주

---

## 🎯 사용자 증가에 따른 비교 우위 전략

### 초기 (사용자 < 100명)

**전략**: 글로벌 평균과 비교
- ETS 공식 통계 활용
- 일반적인 TOEFL 점수 분포와 비교
- "평균 TOEFL 점수는 X점입니다" 형식

### 성장기 (사용자 100-1,000명)

**전략**: 내부 코호트 비교 시작
- 레벨별/목표별 코호트 생성
- "B2 레벨 사용자 평균" 형식
- 익명화된 집계 데이터

### 성숙기 (사용자 1,000-10,000명)

**전략**: 정교한 코호트 분석
- 세분화된 코호트 (시작 시점, 목표, 레벨 등)
- AI 기반 개인화 추천
- 성공 사례 분석

### 확장기 (사용자 10,000명+)

**전략**: 고급 분석 및 예측
- 머신러닝 기반 예측 모델
- 실시간 비교 업데이트
- 개인화된 학습 계획

---

## 💡 지속적 개선 필요 사항

### 논의 필요 항목

1. **프라이버시 균형**: 비교 통계 vs 개인 정보 보호
2. **동기부여 vs 압박**: 긍정적 비교 vs 부정적 영향
3. **신뢰도**: AI 추천의 정확도 및 신뢰도 임계값
4. **규모 확장**: 사용자 증가에 따른 성능 최적화
5. **A/B 테스트**: 비교 통계 UI/메시지 최적화

---

## 📝 다음 단계

1. **사용자 피드백 수집**: 비교 통계에 대한 사용자 반응
2. **A/B 테스트 설계**: 다양한 비교 방식 테스트
3. **AI 모델 개발**: 약점 분석 및 추천 알고리즘
4. **성능 최적화**: 대규모 사용자 환경 대비
5. **규정 준수**: GDPR, CCPA 등 개인정보 보호 규정 확인

---

> **핵심 메시지**: 비교 통계는 단순히 "다른 사람과 비교"하는 것이 아니라, "나의 현재 위치를 파악하고, 목표까지 가는 최적의 경로를 찾는 도구"입니다. 사용자가 늘어남에 따라 더 정교한 분석과 개인화된 추천이 가능해지며, AI를 활용하여 학습 방향성을 제시할 수 있습니다.
