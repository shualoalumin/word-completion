# 🔍 Root Cause Analysis: `cn is not defined` Error

> **Date**: 2026-01-16  
> **Topic**: Missing Import 에러의 원인 분석 및 예방 방안  
> **Status**: ✅ Solved

---

## 1. 증상 (Symptoms)

### 에러 메시지
```
ReferenceError: cn is not defined
    at r2 (index-BddIzTfa.js:40)
    at M (index-BddIzTfa.js:163)
    ...
```

### 영향
- Dashboard 페이지 전체가 렌더링되지 않음
- 로그인 후 흰 화면만 표시
- 사용자가 어떤 기능도 사용 불가

---

## 2. 원인 커밋 추적 (Root Cause Tracking)

### 🔎 Git Bisect 결과

**원인 커밋**: `de58046` (2026-01-12 15:54:36 KST)

```
feat: add vocabulary management features to Dashboard and App

- Introduced new routes for Vocabulary and Vocabulary Review in App component.
- Enhanced Dashboard to display vocabulary statistics, including total words, 
  mastered words, learning words, new words, and words due for review.
- Added quick action links for navigating to the Vocabulary section from the Dashboard.
```

### 🔬 문제 코드 (What went wrong)

**추가된 코드** (line 242):
```typescript
<div 
  className={cn(
    "p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl transition-all",
    vocabStatsData?.data && vocabStatsData.data.wordsDueForReview > 0 
      ? "border-red-600/50 hover:border-red-600 cursor-pointer" 
      : ""
  )}
  ...
>
```

**누락된 import**:
```typescript
import { cn } from '@/lib/utils';
```

### 🔍 왜 발견되지 않았나?

1. **빌드 시스템의 한계**: 
   - Vite/TypeScript 빌드는 성공했음 (타입 체크 pass)
   - `cn`이 전역 스코프에 없는 것은 런타임에서만 발견됨

2. **ESLint 미설정**:
   - `no-undef` 규칙이 비활성화되어 있거나
   - ESLint가 JSX 내부 표현식을 제대로 검사하지 않음

3. **테스트 부재**:
   - Dashboard 컴포넌트에 대한 렌더링 테스트 없음
   - 배포 전 수동 테스트 미흡

4. **코드 리뷰 부재**:
   - 1인 개발로 인한 코드 리뷰 프로세스 없음

---

## 3. 해결책 (Solution)

### 즉시 수정
```typescript
// src/pages/Dashboard.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { UserMenu } from '@/features/auth/components/UserMenu';
import { Button } from '@/components/ui/button';
import { useDashboardStats, useRecentActivity } from '@/features/dashboard';
import { useVocabularyStats } from '@/features/vocabulary';
import { cn } from '@/lib/utils';  // ← 누락된 import 추가
```

### 수정 커밋
```
fix: add missing cn import to Dashboard.tsx (ReferenceError fix)
```

---

## 4. 재발 방지 규칙 (Prevention Rules)

### Rule 1: ESLint 강화 설정

**.eslintrc.cjs 추가 규칙**:
```javascript
module.exports = {
  rules: {
    // 정의되지 않은 변수 사용 금지
    'no-undef': 'error',
    
    // 사용하지 않는 import 경고
    'no-unused-vars': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn',
    
    // import 정렬 강제
    'import/order': ['warn', {
      'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      'newlines-between': 'always'
    }]
  }
};
```

### Rule 2: Pre-commit Hook (Husky)

**package.json**:
```json
{
  "scripts": {
    "lint": "eslint src --ext .ts,.tsx --max-warnings 0",
    "lint:fix": "eslint src --ext .ts,.tsx --fix"
  },
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint"
    }
  }
}
```

### Rule 3: 배포 전 테스트 체크리스트

**반드시 확인할 항목**:
1. [ ] `npm run build` 성공 확인
2. [ ] `npm run lint` 에러 0개 확인
3. [ ] 주요 페이지 렌더링 테스트 (Landing, Dashboard, Practice)
4. [ ] 콘솔 에러 없음 확인

### Rule 4: 컴포넌트 렌더링 테스트

**Dashboard.test.tsx 예시**:
```typescript
import { render, screen } from '@testing-library/react';
import Dashboard from '@/pages/Dashboard';

describe('Dashboard', () => {
  it('renders without crashing', () => {
    render(<Dashboard />);
    // 기본 렌더링 테스트
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
  });
});
```

### Rule 5: IDE 자동 import 활용

**VSCode/Cursor 설정** (settings.json):
```json
{
  "editor.codeActionsOnSave": {
    "source.organizeImports": true,
    "source.addMissingImports": true
  },
  "typescript.suggest.autoImports": true
}
```

---

## 5. AI 코드 생성 시 규칙 (Rules for AI Code Generation)

### ⚠️ 새로운 함수/유틸리티 사용 시

**AI가 코드 생성할 때 반드시 따를 규칙**:

1. **import 확인 필수**
   - 새로운 함수(`cn`, `clsx`, `twMerge` 등) 사용 시 import 존재 여부 확인
   - 파일 상단 import 섹션에 해당 import가 있는지 검증

2. **기존 파일 수정 시**
   - 수정 전 현재 import 목록 확인
   - 새로 사용하는 함수/컴포넌트가 있으면 import 추가

3. **코드 블록 생성 시**
   - 필요한 import를 코드 블록 상단에 명시
   - "다음 import가 필요합니다" 주석 추가

4. **빌드 검증**
   - 코드 변경 후 반드시 `npm run build` 실행
   - 빌드 성공해도 런타임 에러 가능성 인지

---

## 6. 타임라인 (Timeline)

| 시점 | 이벤트 |
|------|--------|
| 2026-01-12 15:54 | 원인 커밋 (de58046) 생성 |
| 2026-01-12 ~ 01-15 | 에러 잠복 (테스트 미흡) |
| 2026-01-16 02:22 | 사용자가 Dashboard 에러 발견 |
| 2026-01-16 02:25 | Git history 분석으로 원인 커밋 특정 |
| 2026-01-16 02:26 | 수정 커밋 배포 |

**잠복 기간**: ~4일

---

## 7. 교훈 (Lessons Learned)

### 🎯 핵심 교훈

1. **빌드 성공 ≠ 런타임 성공**
   - TypeScript/Vite 빌드가 성공해도 런타임 에러 발생 가능
   - JSX 내부 표현식의 undefined 변수는 빌드 시 잡히지 않을 수 있음

2. **AI 코드 생성의 함정**
   - AI가 기존 파일 수정 시 import 누락 가능성 높음
   - 특히 `cn`, `clsx` 같은 유틸리티 함수 자주 누락

3. **1인 개발의 리스크**
   - 코드 리뷰 없이 바로 배포 → 에러 잠복 기간 증가
   - 자동화된 검증 시스템 필수

### 🛠️ 즉시 적용할 개선 사항

1. ESLint `no-undef` 규칙 활성화
2. Pre-commit hook으로 lint 강제
3. 주요 페이지 렌더링 테스트 추가
4. AI 코드 생성 후 import 확인 습관화

---

## 8. 관련 커밋

| 커밋 | 설명 |
|------|------|
| `de58046` | 🐛 원인 커밋 - cn 사용하면서 import 누락 |
| `(새 커밋)` | ✅ 수정 커밋 - cn import 추가 |

---

**Status**: ✅ **Resolved**  
**Root Cause**: Missing `import { cn } from '@/lib/utils'` in Dashboard.tsx  
**Prevention**: ESLint + Husky pre-commit hook + Render tests
