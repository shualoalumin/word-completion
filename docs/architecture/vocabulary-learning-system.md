# 📚 어휘력 향상 능동적 학습 시스템 설계

> **목적**: 문제 풀이 후 능동적 어휘 학습 과정을 체계화하여 장기기억 강화  
> **핵심 가치**: 어휘력 향상은 덤으로 가져가는 자연스러운 학습 효과  
> **Last Updated**: 2026-01-11

---

## 🎯 핵심 비전

### 현재 문제점

1. **수동적 학습**: 사용자가 별도로 단어를 찾아 수동으로 추가해야 함
2. **맥락 분리**: 단어를 문맥 없이 외워야 함 (학습 효과 저하)
3. **복습 부재**: 단어 추가 후 자동 복습 시스템이 약함
4. **성장 측정 부재**: 어휘력 향상을 정량적으로 확인하기 어려움
5. **풀이 후 과정 기피**: 문제 풀이 후 해석/어휘 학습 과정에 많은 시간 소요

### 해결 방안: 능동적 학습 플로우

```
문제 풀이 완료
    ↓
[ResultsPanel에 해석 + 어휘 섹션 자동 표시]
    ↓
1. 전체 지문 해석 제공 (모국어별, 즉시)
2. 주요 어휘 자동 추출 및 표시 (원문 문맥 포함)
3. 클릭 한 번으로 단어장 추가 (직관적 UI)
    ↓
단어장에 저장 (source_context 포함)
    ↓
Spaced Repetition 스케줄링 (user_review_queue 연동)
    ↓
복습 테스트 (다양한 문제 유형)
    ↓
중장기 재확인 (장기기억 강화)
    ↓
어휘력 향상 지표 시각화 (성장 체감)
```

---

## 📊 스키마 설계

### 1. user_vocabulary 테이블 확장

```sql
-- 기존 테이블 확장 (마이그레이션)
ALTER TABLE user_vocabulary
  ADD COLUMN IF NOT EXISTS source_context TEXT,       -- 원문 문장 (맥락 보존)
  ADD COLUMN IF NOT EXISTS source_passage_id UUID REFERENCES exercises(id),  -- 출처 지문 ID
  ADD COLUMN IF NOT EXISTS added_from TEXT DEFAULT 'manual',  -- 'manual', 'auto_extract', 'mistake_priority'
  ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0,       -- 복습 횟수
  ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMPTZ,     -- 마지막 복습 시각
  ADD COLUMN IF NOT EXISTS retention_score DECIMAL,          -- 기억 유지 점수 (0~1)
  ADD COLUMN IF NOT EXISTS difficulty_score DECIMAL,         -- 난이도 점수 (0~1)
  ADD COLUMN IF NOT EXISTS first_encountered_at TIMESTAMPTZ, -- 최초 학습 시각
  ADD COLUMN IF NOT EXISTS synonyms TEXT[],                  -- 동의어 배열
  ADD COLUMN IF NOT EXISTS antonyms TEXT[];                  -- 반의어 배열 (프리미엄)

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_vocab_source ON user_vocabulary (source_passage_id);
CREATE INDEX IF NOT EXISTS idx_vocab_review ON user_vocabulary (user_id, next_review_at) 
  WHERE next_review_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vocab_mastery ON user_vocabulary (user_id, mastery_level);
```

### 2. 어휘력 향상 메트릭 테이블 (신규)

```sql
CREATE TABLE user_vocabulary_metrics (
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

CREATE INDEX idx_vocab_metrics_user ON user_vocabulary_metrics (user_id, period_start DESC);
```

### 3. 단어 복습 테스트 기록 (신규)

```sql
CREATE TABLE user_vocabulary_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vocabulary_id UUID REFERENCES user_vocabulary(id) ON DELETE CASCADE,
  
  -- 복습 테스트 유형
  review_type TEXT NOT NULL,                 -- 'flashcard', 'fill_blank', 'multiple_choice', 'context_matching', 'sentence_completion'
  
  -- 결과
  is_correct BOOLEAN NOT NULL,
  response_time_seconds INT,                 -- 응답 시간 (초)
  confidence_level INT,                      -- 자신감 레벨 (1~5, 사용자 입력)
  user_answer TEXT,                          -- 사용자가 입력한 답
  correct_answer TEXT,                       -- 정답
  
  -- SM-2 알고리즘 업데이트 (복습 전후 비교)
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

CREATE INDEX idx_vocab_reviews_user ON user_vocabulary_reviews (user_id, reviewed_at DESC);
CREATE INDEX idx_vocab_reviews_vocab ON user_vocabulary_reviews (vocabulary_id);
CREATE INDEX idx_vocab_reviews_type ON user_vocabulary_reviews (review_type);
```

### 4. 어휘력 향상 비교 지표 (신규)

```sql
CREATE TABLE user_vocabulary_growth (
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

CREATE INDEX idx_vocab_growth_user ON user_vocabulary_growth (user_id, measurement_date DESC);
CREATE INDEX idx_vocab_growth_level ON user_vocabulary_growth (estimated_vocab_level);
```

---

## 🎨 UI/UX 설계

### ResultsPanel 확장

**위치**: `src/features/reading/text-completion/components/ResultsPanel.tsx`

**추가할 섹션**:

#### 1. 해석 섹션 (Translation Section)

```typescript
// 무료: 기본 해석
// 프리미엄: 문장 구조 분석 + 상세 해석

<TranslationSection
  passage={passage}
  locale={user.locale}
  tier={subscription.tier}
/>
```

**기능**:
- 전체 지문 해석 제공 (모국어별)
- 무료: 문단별 해석
- 프리미엄: 문장별 해석 + 문장 구조 분석 + 문법 설명

#### 2. 주요 어휘 섹션 (Key Vocabulary Section)

```typescript
<VocabularySection
  passage={passage}
  mistakes={mistakes}
  userAnswers={userAnswers}
  userLocale={user.locale}
  onAddToVocabulary={(word) => addWordToVocabulary(word)}
/>
```

**기능**:
- **자동 어휘 추출**: 문제 지문에서 주요 어휘 자동 추출
  - 틀린 답에서 나온 단어 우선순위 높음
  - 학술 어휘 (academic vocabulary) 우선
  - 빈도 기반 중요도 계산

- **각 단어 카드 표시**:
  ```
  ┌─────────────────────────────┐
  │ photosynthesis              │
  │ [원문 문맥]                 │
  │ "Plants use photosynthesis │
  │  to convert light energy..."│
  ├─────────────────────────────┤
  │ [한국어] 광합성             │
  │ [English] The process by... │
  ├─────────────────────────────┤
  │ Example: "Photosynthesis is │
  │ essential for plant growth."│
  ├─────────────────────────────┤
  │ [➕ 단어장에 추가]         │
  │ (클릭 한 번으로 추가)      │
  └─────────────────────────────┘
  ```

- **우선순위 표시**:
  - 틀린 답에서 나온 단어: 🔴 "이 단어를 먼저 학습하세요"
  - 주요 학술 어휘: 🟡 "중요한 학술 어휘입니다"
  - 일반 어휘: ⚪ "참고용 어휘"

#### 3. 틀린 단어 우선순위 섹션 (Mistake Priority Section)

```typescript
// mistakes 기반으로 틀린 단어 자동 표시
<MistakePrioritySection
  mistakes={mistakes}
  passage={passage}
  onQuickAdd={(word) => quickAddToVocabulary(word)}
/>
```

**기능**:
- 틀린 답에서 나온 단어를 상단에 강조 표시
- "이 단어들을 먼저 학습하면 점수가 올라갑니다!" 메시지
- 일괄 추가 옵션: "모두 단어장에 추가"

#### 4. 단어장 미리보기 (Vocabulary Preview)

```typescript
<VocabularyPreview
  addedWords={addedWordsCount}
  onNavigateToVocabulary={() => navigate('/vocabulary')}
/>
```

**기능**:
- "이 문제에서 X개 단어가 단어장에 추가되었습니다"
- "단어장 바로가기" 버튼
- 최근 추가된 단어 미리보기 (최대 3개)

---

## 🔄 복습 시스템 설계

### 복습 문제 유형

#### 1. 플래시카드 (Flashcard)
- **방식**: 단어 → 뜻 맞추기
- **난이도**: 쉬움
- **목적**: 기본 암기 확인

#### 2. Fill in the Blank (문장 완성)
- **방식**: 원문 문장에서 단어 채우기
- **난이도**: 보통
- **목적**: 맥락에서 단어 사용 확인

#### 3. Multiple Choice (4지선다)
- **방식**: 4개 선택지에서 정답 선택
- **난이도**: 쉬움
- **목적**: 빠른 복습

#### 4. Context Matching (문맥 매칭)
- **방식**: 문맥에 맞는 단어 찾기
- **난이도**: 어려움
- **목적**: 실제 사용 능력 확인

#### 5. Sentence Completion (문장 완성)
- **방식**: 단어를 사용한 문장 직접 완성
- **난이도**: 매우 어려움
- **목적**: 적극적 사용 능력 확인

### Spaced Repetition 알고리즘 (SM-2)

```typescript
// user_review_queue 테이블과 연동
interface SM2Algorithm {
  // 복습 정답 여부에 따라 업데이트
  updateAfterReview(
    vocabulary: UserVocabulary,
    isCorrect: boolean,
    responseTime: number,
    confidenceLevel: number
  ): {
    newMasteryLevel: number;      // 0~5
    newEaseFactor: number;        // 1.3~2.5
    newIntervalDays: number;      // 다음 복습까지 일수
    nextReviewAt: Date;
  };
}

// 마스터리 레벨 정의
const MASTERY_LEVELS = {
  0: { name: 'New', description: '새로 학습한 단어', reviewInterval: 1 },
  1: { name: 'Learning', description: '학습 중', reviewInterval: 2 },
  2: { name: 'Familiar', description: '익숙함', reviewInterval: 4 },
  3: { name: 'Comfortable', description: '편안함', reviewInterval: 7 },
  4: { name: 'Mastered', description: '마스터', reviewInterval: 14 },
  5: { name: 'Fluid', description: '유창함', reviewInterval: 30 }
};
```

### 복습 스케줄 로직

```typescript
// 매일 자정에 실행되는 배치 작업
async function scheduleDailyReviews(userId: string) {
  // 1. 복습 대기 중인 단어 조회 (next_review_at <= 오늘)
  const dueWords = await getDueVocabularyReviews(userId);
  
  // 2. 우선순위 정렬
  const prioritized = prioritizeWords(dueWords, {
    mistakePriority: true,        // 틀린 단어 우선
    lowRetentionScore: true,      // 기억 유지율 낮은 단어 우선
    longTimeSinceReview: true     // 오래 복습 안 한 단어 우선
  });
  
  // 3. 사용자 일일 목표에 맞춰 선택
  const dailyGoal = await getUserDailyGoal(userId); // 예: 10개
  const selectedWords = prioritized.slice(0, dailyGoal.vocabularyReviewLimit);
  
  // 4. 복습 테스트 생성 (다양한 유형 혼합)
  return generateReviewTests(selectedWords, {
    flashcard: 0.3,           // 30% 플래시카드
    fillBlank: 0.3,           // 30% 문장 완성
    multipleChoice: 0.2,      // 20% 4지선다
    contextMatching: 0.15,    // 15% 문맥 매칭
    sentenceCompletion: 0.05  // 5% 문장 완성
  });
}
```

---

## 📈 어휘력 향상 지표 시각화

### Dashboard에 추가할 지표

#### 1. 어휘력 대시보드 섹션 (신규)

```
┌─────────────────────────────────────────┐
│        Vocabulary Progress              │
├─────────────────────────────────────────┤
│                                         │
│  Total Words: 245  (+12 this month)    │
│  ████████████░░░░░░░░  245/500         │
│                                         │
│  Mastered: 156  (64%)                   │
│  ████████████░░░░░░░░  156/245         │
│                                         │
│  Estimated Level: B2                    │
│  TOEFL Vocab Score: 22/30               │
│                                         │
└─────────────────────────────────────────┘
```

#### 2. 성장 곡선 (Growth Chart)

```
┌─────────────────────────────────────────┐
│     Vocabulary Growth (Last 3 Months)   │
│                                         │
│  300 ┤                                 │
│  250 ┤            ╭───╮                │
│  200 ┤       ╭───╯   ╰───╮             │
│  150 ┤  ╭───╯            ╰───╮         │
│  100 ┼──╯                     ╰───╮    │
│   50 ┤                            ╰─── │
│    0 └─────────────────────────────────│
│      Month 1  Month 2  Month 3  Now   │
└─────────────────────────────────────────┘
```

#### 3. 복습 효율성 (Review Efficiency)

```
┌─────────────────────────────────────────┐
│        Review Performance               │
├─────────────────────────────────────────┤
│                                         │
│  Accuracy: 78%  ████████░░░░           │
│                                         │
│  Avg Response Time: 3.2s               │
│                                         │
│  Retention Rate: 85%                   │
│  ████████████░░░░░░░░                   │
│                                         │
│  Most Productive: Morning (9-11 AM)    │
│                                         │
└─────────────────────────────────────────┘
```

#### 4. 비교 지표 (Comparison Metrics)

```
┌─────────────────────────────────────────┐
│      You vs Similar Learners            │
├─────────────────────────────────────────┤
│                                         │
│  Your Words: 245                        │
│  Cohort Avg: 230  (+15 words ahead)    │
│                                         │
│  Your Growth: +12/month                 │
│  Cohort Avg: +8/month  (50% faster)    │
│                                         │
│  Percentile: 75th (Top 25%)            │
│  ████████████░░░░░░░░                   │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔧 구현 단계

### Phase 1: 기본 어휘 학습 (flow-6 후, 즉시)

**목표**: 능동적 학습 플로우 기본 구현

1. ✅ `user_vocabulary` 테이블 확장 (마이그레이션)
2. ✅ ResultsPanel에 해석 섹션 추가
3. ✅ ResultsPanel에 주요 어휘 섹션 추가
4. ✅ 클릭 한 번 단어장 추가 기능
5. ✅ 틀린 단어 우선순위 표시

**예상 소요 시간**: 1주

---

### Phase 2: 복습 시스템 (2주 내)

**목표**: Spaced Repetition 기반 복습 시스템

1. ✅ `user_vocabulary_reviews` 테이블 생성
2. ✅ 복습 테스트 문제 유형 구현 (플래시카드, Fill Blank, Multiple Choice)
3. ✅ SM-2 알고리즘 구현
4. ✅ 복습 스케줄 자동 생성
5. ✅ 복습 결과 기록 및 마스터리 업데이트

**예상 소요 시간**: 2주

---

### Phase 3: 지표 시각화 (3주 내)

**목표**: 어휘력 향상 지표 대시보드

1. ✅ `user_vocabulary_metrics` 테이블 생성
2. ✅ `user_vocabulary_growth` 테이블 생성
3. ✅ 주간/월간 메트릭 집계 로직
4. ✅ Dashboard에 어휘력 섹션 추가
5. ✅ 성장 곡선 차트
6. ✅ 비교 지표 (기본 버전)

**예상 소요 시간**: 1주

---

### Phase 4: 고급 복습 & AI 분석 (1개월 내, 프리미엄)

**목표**: 고급 복습 문제 유형 및 AI 기반 분석

1. ✅ Context Matching 문제 유형
2. ✅ Sentence Completion 문제 유형
3. ✅ AI 기반 어휘 난이도 분석
4. ✅ 맞춤형 복습 추천
5. ✅ 어휘력 향상 예측 모델

**예상 소요 시간**: 2주

---

## 🎯 성공 지표 (KPI)

### 사용자 행동 지표

- **어휘 추가율**: 문제 풀이 후 단어장 추가 비율 (목표: 60%+)
- **복습 참여율**: 복습 테스트 완료 비율 (목표: 70%+)
- **마스터리 달성율**: mastery_level >= 4 달성 비율 (목표: 50%+)

### 학습 효과 지표

- **기억 유지율**: 복습 후 1주일 후 기억 유지율 (목표: 80%+)
- **어휘력 성장률**: 월간 단어 수 증가율 (목표: 10%+)
- **문제 정답률 향상**: 어휘 학습 후 문제 정답률 개선 (목표: 5%+)

### 비즈니스 지표

- **Engagement 증가**: 단어장 기능 사용으로 앱 체류 시간 증가 (목표: 30%+)
- **Retention 향상**: 어휘 학습 기능 사용자 리텐션 (목표: 15%+)
- **프리미엄 전환율**: 고급 복습 기능으로 인한 전환율 (목표: 5%+)

---

## 📝 다음 단계

1. **마이그레이션 파일 생성**: 스키마 확장 마이그레이션
2. **API 함수 설계**: 어휘 학습 관련 API 함수들
3. **UI 컴포넌트 설계**: ResultsPanel 확장 컴포넌트
4. **복습 시스템 구현**: SM-2 알고리즘 및 복습 테스트
5. **대시보드 통합**: 어휘력 지표 대시보드 섹션

---

> **핵심 메시지**: 어휘력 향상은 문제 풀이의 자연스러운 부산물입니다. 사용자가 별도로 노력하지 않아도, 문제를 풀고 결과를 확인하는 과정에서 자동으로 어휘가 학습되고, 체계적인 복습 시스템으로 장기기억에 저장됩니다.
