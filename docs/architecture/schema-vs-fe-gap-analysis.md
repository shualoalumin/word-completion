# 📊 Schema vs FE 구현 갭 분석

> **Date**: 2026-01-16  
> **Purpose**: 46개 테이블 스키마 대비 FE 구현 현황 점검  
> **Status**: 🔴 심각한 갭 발견 - 대부분 미구현

---

## 📌 Executive Summary

| 카테고리 | 테이블 수 | 구현됨 | 미구현 | 구현율 |
|----------|-----------|--------|--------|--------|
| 콘텐츠 | 6 | 1 | 5 | 16.7% |
| 유저 | 4 | 1 | 3 | 25% |
| 학습 기록 | 5 | 2 | 3 | 40% |
| 학습 패턴 | 3 | 0 | 3 | 0% |
| 어휘력 향상 | 4 | 3 | 1 | 75% |
| 소셜/비교 | 7 | 0 | 7 | 0% |
| 게이미피케이션 | 4 | 1 | 3 | 25% |
| 결제/구독 | 3 | 0 | 3 | 0% |
| 분석/실험 | 5 | 0 | 5 | 0% |
| 규정 준수 | 3 | 0 | 3 | 0% |
| 알림 | 2 | 0 | 2 | 0% |
| 지원 | 3 | 0 | 3 | 0% |
| **Total** | **46** | **8** | **38** | **17.4%** |

---

## 🔴 Critical Gap #1: 난이도(Difficulty) 표시 누락

### 스키마 정의 (exercises 테이블)
```sql
difficulty TEXT DEFAULT 'intermediate', -- 'easy', 'intermediate', 'hard'
```

### Edge Function 구현 ✅
```typescript
// generate-passage/index.ts
const selectedDifficulty = getRandomDifficulty(requestedModule);
// ...
.insert({
  difficulty: selectedDifficulty,  // ✅ 저장됨
  // ...
});
```

### FE 구현 현황 ❌
```
- ExerciseLayout.tsx: difficulty prop 없음
- PassageDisplay.tsx: difficulty 표시 없음  
- ResultsPanel.tsx: difficulty 표시 없음
- user_exercise_history: difficulty 필드 누락 (history에 기록 안됨)
- Dashboard: 난이도별 통계 없음
```

### 필요한 작업
1. [ ] Edge Function에서 difficulty를 응답에 포함
2. [ ] ExerciseLayout에 난이도 배지 표시
3. [ ] user_exercise_history에 difficulty 필드 추가
4. [ ] Dashboard에 난이도별 통계 표시
5. [ ] 스키마 마이그레이션: `ALTER TABLE user_exercise_history ADD COLUMN difficulty TEXT;`

---

## 🔴 Critical Gap #2: UI 레이아웃 불일관

### 현재 상황
```
Dashboard:        max-w-6xl mx-auto px-6 py-8   (넓은 레이아웃)
ExerciseLayout:   max-w-4xl mx-auto px-6 py-10  (좁은 레이아웃)
Practice:         Back button fixed top-4 left-4 (위치 다름)
```

### 문제점
- 풀이 화면과 Dashboard의 오른쪽 위 구글 계정 아이콘 위치가 다름
- 화면 배열이 일관적이지 않음
- 사용자 경험 불일치

### 해결 방안
```tsx
// 공통 레이아웃 상수
const LAYOUT = {
  maxWidth: 'max-w-6xl',  // 통일
  padding: 'px-6',
  headerHeight: '60px',
};

// 공통 헤더 컴포넌트 필요
<GlobalHeader />  // Logo, UserMenu, Navigation 일관되게 배치
```

---

## 🟡 Category-by-Category Gap Analysis

### 1. 콘텐츠 (Content) - 16.7% 구현

| 테이블 | DB | FE 표시 | FE 입력 | 갭 |
|--------|-----|---------|---------|-----|
| exercises | ✅ | ⚠️ 부분 | N/A | difficulty 미표시, topic_category 미표시 |
| media_files | ❌ | ❌ | ❌ | Listening/Speaking 섹션 미구현 |
| topic_taxonomy | ❌ | ❌ | ❌ | 토픽 계층 UI 없음 |
| skill_taxonomy | ❌ | ❌ | ❌ | 스킬 분류 UI 없음 |
| content_reviews | ❌ | ❌ | ❌ | 콘텐츠 검증 UI 없음 |
| user_reports | ❌ | ❌ | ❌ | 신고 기능 없음 |

**누락된 FE 요소**:
- 문제 풀이 시 `difficulty` 배지 (Easy/Medium/Hard)
- 문제 풀이 시 `topic_category` 태그 표시
- 토픽 필터링 UI (선호 토픽 선택)

---

### 2. 유저 (Users) - 25% 구현

| 테이블 | DB | FE 표시 | FE 입력 | 갭 |
|--------|-----|---------|---------|-----|
| user_profiles | ✅ | ⚠️ 부분 | ❌ | display_name만, 설정 페이지 없음 |
| user_sessions | ❌ | ❌ | ❌ | 세션/디바이스 관리 UI 없음 |
| user_skills | ❌ | ❌ | ❌ | 스킬 레이더 차트 없음 |
| user_usage_limits | ❌ | ❌ | ❌ | 사용량 표시 없음 |

**누락된 FE 요소**:
- 프로필 설정 페이지 (/settings)
- 스킬 레이더 차트 (vocabulary, grammar, inference 등)
- 일일 사용량 표시 (무료: 10개, 프리미엄: 무제한)
- 활성 세션 관리

---

### 3. 학습 기록 (Learning) - 40% 구현

| 테이블 | DB | FE 표시 | FE 입력 | 갭 |
|--------|-----|---------|---------|-----|
| user_exercise_history | ✅ | ✅ | ✅ | difficulty 필드 누락 |
| user_review_queue | ❌ | ❌ | ❌ | 문제 복습 스케줄 없음 |
| user_bookmarks | ❌ | ❌ | ❌ | 문제 북마크 기능 없음 |
| user_vocabulary | ✅ | ✅ | ✅ | 완료 |
| diagnostic_results | ❌ | ❌ | ❌ | 진단 테스트 없음 |

**누락된 FE 요소**:
- 문제 북마크 버튼 (결과 화면에서)
- 복습 필요한 문제 목록
- 진단 테스트 화면 (/diagnostic)
- history에 difficulty 추가

---

### 4. 학습 패턴 (Learning Patterns) - 0% 구현

| 테이블 | DB | FE 표시 | 갭 |
|--------|-----|---------|-----|
| user_learning_patterns | ❌ | ❌ | 시간대별 학습 히트맵 없음 |
| user_topic_performance | ❌ | ❌ | 주제별 성과 차트 없음 |
| user_growth_metrics | ❌ | ❌ | 성장 그래프 없음 |

**누락된 FE 요소**:
- 시간대별 학습 히트맵 (GitHub 스타일)
- 주제별 성과 바 차트
- 주간/월간 성장 곡선

---

### 5. 어휘력 향상 (Vocabulary) - 75% 구현

| 테이블 | DB | FE 표시 | FE 입력 | 갭 |
|--------|-----|---------|---------|-----|
| user_vocabulary | ✅ | ✅ | ✅ | synonyms/antonyms UI 없음 |
| user_vocabulary_reviews | ✅ | ✅ | ✅ | 완료 |
| user_vocabulary_metrics | ✅ | ⚠️ 부분 | N/A | 주간/월간 메트릭 차트 없음 |
| user_vocabulary_growth | ✅ | ❌ | N/A | 성장 비교 UI 없음 |

**누락된 FE 요소**:
- 동의어/반의어 표시
- 어휘력 성장 그래프
- 코호트 대비 백분위 표시

---

### 6. 소셜/비교 통계 - 0% 구현 🔴

| 테이블 | DB | FE 표시 | 갭 |
|--------|-----|---------|-----|
| user_active_sessions | ❌ | ❌ | "현재 학습 중" 표시 없음 |
| study_group_activities | ❌ | ❌ | 그룹 활동 피드 없음 |
| study_group_weekly_stats | ❌ | ❌ | 그룹 랭킹 없음 |
| cohort_statistics | ❌ | ❌ | 코호트 비교 없음 |
| user_cohorts | ❌ | ❌ | 코호트 가입 없음 |
| cohort_aggregates | ❌ | ❌ | 집계 통계 없음 |
| user_learning_recommendations | ❌ | ❌ | AI 추천 없음 |

**누락된 FE 요소**:
- 친구 목록 사이드바
- "지금 학습 중" 실시간 표시
- 스터디 그룹 페이지 (/groups)
- AI 학습 추천 섹션

---

### 7. 게이미피케이션 - 25% 구현

| 테이블 | DB | FE 표시 | 갭 |
|--------|-----|---------|-----|
| user_streaks | ✅ | ✅ | 완료 |
| achievements | ❌ | ❌ | 업적 목록 없음 |
| user_achievements | ❌ | ❌ | 달성 업적 표시 없음 |
| leaderboard_weekly | ❌ | ❌ | 리더보드 없음 |

**누락된 FE 요소**:
- 업적 페이지 (/achievements)
- 주간 리더보드
- 업적 해금 알림

---

### 8. 결제/구독 - 0% 구현 🔴

| 테이블 | DB | FE 표시 | 갭 |
|--------|-----|---------|-----|
| subscriptions | ❌ | ❌ | 구독 관리 없음 |
| payment_history | ❌ | ❌ | 결제 내역 없음 |
| promo_codes | ❌ | ❌ | 프로모션 입력 없음 |

**누락된 FE 요소**:
- 프리미엄 업그레이드 페이지 (/pricing)
- 구독 관리 페이지 (/settings/subscription)
- 결제 내역

---

## 📋 우선순위별 구현 계획

### P0: 즉시 (오늘)
1. [ ] **난이도 표시 추가**
   - ExerciseLayout에 difficulty 배지
   - generatePassage 응답에 difficulty 포함
   - ResultsPanel에 difficulty 표시

2. [ ] **UI 레이아웃 통일**
   - GlobalHeader 컴포넌트 생성
   - max-w 통일 (max-w-6xl)
   - 헤더 위치 일관성

### P1: 이번 주
3. [ ] **history에 difficulty 저장**
   - 스키마 마이그레이션
   - saveExerciseHistory 수정
   - Dashboard에 난이도별 통계 표시

4. [ ] **topic_category 표시**
   - 문제 풀이 시 카테고리 태그

5. [ ] **스킬 통계 추가**
   - user_skills 테이블 생성
   - Dashboard에 스킬 레이더 차트

### P2: 다음 주
6. [ ] **학습 패턴 시각화**
   - 시간대별 히트맵
   - 주제별 성과 차트

7. [ ] **북마크 기능**
   - 결과 화면에 북마크 버튼
   - 북마크 목록 페이지

### P3: 이번 달
8. [ ] **소셜 기능 MVP**
   - 친구 목록
   - "지금 학습 중" 표시

9. [ ] **리더보드**
   - 주간 랭킹
   - 업적 시스템 기초

---

## 📊 진척률 재계산

### 기존 계산 (불완전)
```
Phase 1 (MVP):        100%
Phase 2 (Learning):   100%  ← 과대평가됨
Overall:              40%
```

### 수정된 계산 (스키마 기반)
```
콘텐츠 구현:          16.7%  (1/6 테이블, FE 부분 표시)
유저 구현:            25%    (1/4 테이블, 설정 페이지 없음)
학습 기록 구현:       40%    (2/5 테이블, difficulty 누락)
학습 패턴 구현:       0%     (0/3 테이블)
어휘력 구현:          75%    (3/4 테이블)
소셜/비교 구현:       0%     (0/7 테이블)
게이미피케이션 구현:  25%    (1/4 테이블)
결제 구현:            0%     (0/3 테이블)
분석/알림/지원 구현:  0%     (0/13 테이블)

가중 평균 진척률: 약 15-20%
```

### 정직한 진척률
```
DB 스키마 구현:           17.4% (8/46 테이블)
스키마 대비 FE 반영률:    ~30% (구현된 테이블 중 FE 표시)
실제 전체 진척률:         ~10-15%
```

---

## 🎯 핵심 결론

1. **스키마는 잘 설계되었으나 FE 구현이 따라가지 못함**
   - opus 모델 아키텍처 논의 후 auto 모델 구현 과정에서 누락

2. **MVP 중심 개발로 확장성 있는 기능들이 지연됨**
   - 당장 작동하는 것에 집중하다 보니 스키마 활용도 낮음

3. **진척률 과대평가**
   - 기능 단위로 계산해서 높게 나왔으나
   - 스키마 반영률로 보면 실제로는 10-15%

---

## 📚 관련 문서

- `docs/architecture/database-schema.md` - 전체 46개 테이블 스키마
- `docs/project-status.md` - 프로젝트 현황 (업데이트 필요)
- `docs/architecture/project-health-check-2026-01-16.md` - 코드 품질 점검

---

**작성자**: AI Assistant  
**다음 점검**: 매 기능 구현 후 갭 분석 업데이트
