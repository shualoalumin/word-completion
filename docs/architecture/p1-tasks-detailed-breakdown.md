# 📋 P1 항목 구체 작업 내용

> **Date**: 2026-01-18  
> **Purpose**: P1 중기 개선 항목별 상세 작업 내용 정리  
> **Status**: 📝 계획 단계

---

## 1. i18n 시스템 구축

### 🎯 목표
- 글로벌 확장 준비 (다국어 지원)
- 하드코딩된 텍스트 제거
- 언어별 UI 자동 전환

### 📦 설치 및 설정

**1.1 패키지 설치**
```bash
npm install react-i18next i18next i18next-browser-languagedetector
```

**1.2 i18n 설정 파일 생성**
```
src/
├── i18n/
│   ├── config.ts          # i18next 설정
│   ├── locales/
│   │   ├── en/
│   │   │   └── common.json
│   │   └── ko/
│   │       └── common.json
```

**1.3 번역 파일 구조**
```json
// locales/en/common.json
{
  "bookmark": {
    "save": "Save Bookmark",
    "saved": "Bookmarked",
    "remove": "Remove Bookmark",
    "tooltip": "Save for later review"
  },
  "vocabulary": {
    "title": "My Vocabulary",
    "new": "New",
    "learning": "Learning",
    "mastered": "Mastered"
  }
}

// locales/ko/common.json
{
  "bookmark": {
    "save": "북마크 저장",
    "saved": "북마크됨",
    "remove": "북마크 제거",
    "tooltip": "나중에 다시 풀기"
  },
  "vocabulary": {
    "title": "내 단어장",
    "new": "신규",
    "learning": "학습 중",
    "mastered": "완료"
  }
}
```

### 🔧 코드 변경 작업

**1.4 하드코딩 텍스트 찾기 및 교체**
```typescript
// Before
<Button>북마크 저장</Button>

// After
<Button>{t('bookmark.save')}</Button>
```

**변경 대상 파일 (예상 20+ 파일):**
- `src/pages/Dashboard.tsx`
- `src/pages/Vocabulary.tsx`
- `src/pages/History.tsx`
- `src/pages/Bookmarks.tsx`
- `src/features/reading/text-completion/components/ResultsPanel.tsx`
- `src/components/layout/ExerciseLayout.tsx`
- 기타 모든 페이지/컴포넌트

**1.5 언어 감지 및 전환**
- 브라우저 언어 자동 감지
- 사용자 프로필에 언어 설정 저장 (`user_profiles.locale`)
- 언어 전환 UI 추가 (설정 페이지 또는 헤더)

### ⏱️ 예상 소요 시간
- 설정: 2시간
- 번역 파일 작성: 4시간
- 코드 변경: 1일
- 테스트: 4시간
- **총 2-3일**

---

## 2. 테스트 인프라 구축

### 🎯 목표
- 회귀 버그 방지
- 리팩토링 안전망
- 배포 전 자동 검증

### 📦 설치 및 설정

**2.1 Vitest 설정 (단위 테스트)**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

**설정 파일:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**2.2 Playwright 설정 (E2E 테스트)**
```bash
npm install -D @playwright/test
npx playwright install
```

**설정 파일:**
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
  },
});
```

### 📝 테스트 작성 작업

**2.3 API 함수 단위 테스트**
```typescript
// src/features/reading/text-completion/api.test.ts
describe('generatePassage', () => {
  it('should generate a passage with valid structure', async () => {
    const result = await generatePassage();
    expect(result.data).toHaveProperty('content_parts');
    expect(result.data?.content_parts.length).toBeGreaterThan(0);
  });
});
```

**테스트 대상:**
- `src/features/reading/text-completion/api.ts`
- `src/features/dashboard/api.ts`
- `src/features/vocabulary/api.ts`
- `src/features/reading/text-completion/api.ts` (bookmark 함수들)

**2.4 컴포넌트 렌더링 테스트**
```typescript
// src/pages/Dashboard.test.tsx
import { render, screen } from '@testing-library/react';
import Dashboard from './Dashboard';

describe('Dashboard', () => {
  it('should render dashboard title', () => {
    render(<Dashboard />);
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });
});
```

**테스트 대상:**
- 주요 페이지 컴포넌트 (Dashboard, Vocabulary, History)
- 핵심 UI 컴포넌트 (ResultsPanel, ExerciseLayout)

**2.5 E2E 테스트 (핵심 플로우)**
```typescript
// e2e/text-completion.spec.ts
import { test, expect } from '@playwright/test';

test('complete text completion exercise flow', async ({ page }) => {
  // 1. 로그인
  await page.goto('/');
  await page.click('text=Sign in with Google');
  
  // 2. 문제 풀이 시작
  await page.goto('/practice/text-completion');
  await expect(page.locator('text=Fill in the missing letters')).toBeVisible();
  
  // 3. 답 입력
  await page.fill('input[type="text"]', 'test');
  
  // 4. 답 확인
  await page.click('text=Check Answers');
  await expect(page.locator('text=Score')).toBeVisible();
});
```

**E2E 테스트 시나리오:**
1. 로그인 → Dashboard → 문제 풀이 → 결과 확인
2. 단어장 추가 → Vocabulary 페이지 확인
3. 북마크 저장 → Bookmarks 페이지 확인
4. History 클릭 → Review 모드 이동

### ⏱️ 예상 소요 시간
- 설정: 4시간
- 단위 테스트 작성: 2일
- E2E 테스트 작성: 2일
- CI/CD 통합: 4시간
- **총 1주**

---

## 3. 스키마 구현 가속화

### 🎯 목표
- 스키마 구현률 17.4% → 25%+ 향상
- 핵심 기능 테이블 구현
- FE 연동

### 📋 구체 작업 내용

#### 3.1 user_skills 테이블 구현

**3.1.1 마이그레이션 파일 생성**
```sql
-- docs/migrations/user-skills-schema.sql
CREATE TABLE user_skills (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_type TEXT NOT NULL,              -- 'vocabulary', 'grammar', 'inference'
  proficiency_score DECIMAL(3,2),       -- 0.00 ~ 1.00
  exercises_completed INT DEFAULT 0,
  correct_rate DECIMAL(5,2),            -- 0.00 ~ 100.00
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, skill_type)
);

CREATE INDEX idx_user_skills_user ON user_skills (user_id);
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own skills"
  ON user_skills FOR SELECT
  USING (auth.uid() = user_id);
```

**3.1.2 API 함수 생성**
```typescript
// src/features/skills/api.ts
export async function getUserSkills(userId: string) {
  // user_skills 테이블 조회
}

export async function updateSkillProficiency(
  skillType: 'vocabulary' | 'grammar' | 'inference',
  score: number
) {
  // 문제 풀이 후 스킬 점수 업데이트
}
```

**3.1.3 Dashboard에 스킬 레이더 차트 추가**
- `recharts` 또는 `chart.js` 사용
- 3개 스킬 (vocabulary, grammar, inference) 표시
- 실시간 업데이트

**작업 파일:**
- `docs/migrations/user-skills-schema.sql` (신규)
- `src/features/skills/api.ts` (신규)
- `src/features/skills/hooks/useSkills.ts` (신규)
- `src/components/charts/SkillRadarChart.tsx` (신규)
- `src/pages/Dashboard.tsx` (수정)

**예상 소요 시간:** 3일

---

#### 3.2 learning_patterns 테이블 구현

**3.2.1 마이그레이션 파일 생성**
```sql
-- docs/migrations/learning-patterns-schema.sql
CREATE TABLE user_learning_patterns (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  hour_of_day INT CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
  day_of_week INT CHECK (day_of_week >= 0 AND day_of_week <= 6),
  avg_score_percent DECIMAL(5,2),
  avg_time_spent_seconds INT,
  exercises_count INT DEFAULT 0,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, hour_of_day, day_of_week)
);

CREATE INDEX idx_patterns_user ON user_learning_patterns (user_id);
ALTER TABLE user_learning_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own learning patterns"
  ON user_learning_patterns FOR SELECT
  USING (auth.uid() = user_id);
```

**3.2.2 학습 패턴 수집 로직**
```typescript
// 문제 풀이 완료 시 자동 수집
// src/features/reading/text-completion/hooks/useTextCompletion.ts
const saveLearningPattern = async () => {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();
  
  // user_learning_patterns에 업데이트
};
```

**3.2.3 학습 패턴 시각화**
- 시간대별 히트맵 (GitHub 스타일)
- 주제별 성과 차트
- 최적 학습 시간 추천

**작업 파일:**
- `docs/migrations/learning-patterns-schema.sql` (신규)
- `src/features/learning-patterns/api.ts` (신규)
- `src/components/charts/LearningHeatmap.tsx` (신규)
- `src/pages/Dashboard.tsx` (수정)

**예상 소요 시간:** 4일

---

#### 3.3 user_topic_performance 테이블 구현

**3.3.1 마이그레이션 파일 생성**
```sql
-- docs/migrations/topic-performance-schema.sql
CREATE TABLE user_topic_performance (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_category TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  exercises_completed INT DEFAULT 0,
  avg_score_percent DECIMAL(5,2),
  best_score_percent DECIMAL(5,2),
  last_practiced_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, topic_category, difficulty)
);
```

**3.3.2 주제별 성과 추적**
- 문제 풀이 시 자동 업데이트
- Dashboard에 주제별 통계 표시

**예상 소요 시간:** 2일

---

### 📊 전체 작업 요약

| 항목 | 작업 내용 | 파일 수 | 소요 시간 |
|------|----------|---------|----------|
| **user_skills** | 테이블 + API + 차트 | 5개 | 3일 |
| **learning_patterns** | 테이블 + 수집 로직 + 히트맵 | 4개 | 4일 |
| **user_topic_performance** | 테이블 + 통계 | 3개 | 2일 |
| **통합 및 테스트** | Dashboard 통합, 테스트 | - | 3일 |
| **총계** | - | 12개 | **2주** |

---

## 📈 예상 효과

### 구현 전
- 스키마 구현률: 17.4% (8/46 테이블)
- Global First 점수: 4/10

### 구현 후
- 스키마 구현률: 25%+ (11/46 테이블)
- Global First 점수: 6/10
- 전체 점수: 60/70 → 65/70 (93%)

---

## 🎯 우선순위 추천

1. **user_skills** (3일) - 가장 빠르고 효과적
2. **learning_patterns** (4일) - 사용자 인사이트 제공
3. **user_topic_performance** (2일) - 추가 분석 기능

---

## 📚 관련 문서

- [Database Schema](../database-schema.md)
- [Schema vs FE Gap Analysis](../schema-vs-fe-gap-analysis.md)
- [Architecture Midterm Review](./2026-01-18-architecture-midterm-review.md)
