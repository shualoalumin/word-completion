# 🔧 Troubleshooting: UI/UX Issues & API Problems (2026-01-26)

> **Date**: 2026-01-26  
> **Status**: ✅ All Resolved  
> **Topics**: Git commit messages, UI responsiveness, Word explanation API, Translation toggle

---

## 1. Git 커밋 메시지 깨짐 문제

### 증상
- GitHub에서 한글 커밋 메시지가 깨져서 표시됨 (물음표로 표시)
- 예: `feat: 버튼 공통 기능...` → `feat: ?곷??湲곕???ы쁽...`

### 원인
- Git 인코딩 설정 문제
- Windows 환경에서 한글 커밋 메시지가 UTF-8로 제대로 저장/전송되지 않음

### 해결 방법
1. **백업 브랜치 생성**
   ```bash
   git branch backup-before-rebase
   ```

2. **Git 인코딩 설정**
   ```bash
   git config --global core.quotepath false
   git config --global i18n.commitencoding utf-8
   git config --global i18n.logoutputencoding utf-8
   ```

3. **Interactive Rebase로 커밋 메시지 수정**
   - 24개의 깨진 커밋 메시지를 영어로 변경
   - `git rebase -i 922861d` 사용
   - 각 커밋의 `pick`을 `reword`로 변경 후 영어 메시지 입력

4. **Force Push**
   ```bash
   git push --force-with-lease origin main
   ```

### 결과
- ✅ 모든 커밋 메시지가 영어로 정상 표시
- ✅ GitHub에서 깨진 메시지 제거

### 참고 파일
- `FIX_COMMIT_MESSAGES.md`: 커밋 해시 → 영어 메시지 매핑 테이블

---

## 2. Full Passage & Translation 섹션 반응형 및 가독성 문제

### 증상
1. **16:9 화면에서 박스는 확대되지만 텍스트는 80% 지점에서 줄바꿈**
   - 문제 지문 섹션은 반응형으로 잘 작동
   - Full Passage와 Translation 섹션은 고정 너비(`max-w-4xl`)로 제한됨

2. **UI 일관성 부족**
   - 문제 지문: `text-[17px] leading-[1.85] tracking-[0.01em]`
   - Full Passage: `text-base leading-7 font-serif tracking-wide`
   - Translation: `text-base leading-7 tracking-wide`

### 해결 방법

#### 2.1 반응형 레이아웃 개선
```tsx
// Before
<div className="max-w-4xl mb-6">

// After
<div className="max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto mb-6">
```

#### 2.2 타이포그래피 통일
```tsx
// 모든 섹션에 동일한 스타일 적용
className={cn(
  'text-[17px] leading-[1.85] text-justify tracking-[0.01em]',
  darkMode ? 'text-gray-100' : 'text-gray-900'
)}
style={{ fontFamily: "'Arial Narrow', 'Helvetica Condensed', Arial, sans-serif" }}
```

### 결과
- ✅ 모든 섹션이 일관된 스타일과 반응형 동작
- ✅ 16:9 화면에서도 텍스트가 박스 너비를 최대한 활용

### 관련 파일
- `src/components/layout/ExerciseLayout.tsx`
- `src/features/reading/text-completion/components/ResultsPanel.tsx`

---

## 3. 단어 뜻 API 문제

### 증상
- Dictionary API(`api.dictionaryapi.dev`)에서 일부 단어의 정의를 찾지 못함
- 예: "cues" 같은 단어에서 "No definition found" 표시
- 단일 API 의존으로 실패율 높음

### 해결 방법

#### 3.1 AI 기반 Context Explanation으로 전환
- Dictionary API → AI-powered context-based explanation
- Sider처럼 지문 맥락에서 단어 의미 설명

#### 3.2 Edge Function 생성
- `supabase/functions/explain-word-in-context/index.ts` 생성
- Gemini API를 사용하여 지문 맥락에서 단어 의미 생성

#### 3.3 클라이언트 코드 수정
```tsx
// Before: Dictionary API
const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);

// After: AI Context Explanation
const result = await explainWordInContext({
  word,
  context: fullPassageText,
});
```

### 결과
- ✅ 모든 단어에 대해 지문 맥락에서의 의미 제공
- ✅ Dictionary API 실패 문제 해결

### 관련 파일
- `supabase/functions/explain-word-in-context/index.ts`
- `src/features/reading/text-completion/api.ts`
- `src/features/reading/text-completion/components/ResultsPanel.tsx`

---

## 4. Translation UI 개선

### 증상
- Translation이 항상 표시되어 화면이 복잡함
- 사용자가 필요할 때만 볼 수 있도록 개선 필요

### 해결 방법

#### 4.1 토글 버튼 추가
- Full Passage 카드 하단에 작은 해석 버튼 추가
- 기본 상태: 숨김
- 클릭 시 번역 표시/숨김

#### 4.2 UI 개선
- 버튼을 왼쪽 정렬
- 버튼 위 실선 제거
- 번역 표시 시 "Korean Translation" 라벨 제거

### 결과
- ✅ 초기 화면이 더 깔끔함
- ✅ 필요 시에만 번역 표시
- ✅ 더 나은 사용자 경험

### 관련 파일
- `src/features/reading/text-completion/components/ResultsPanel.tsx`
- `src/i18n/locales/en/common.json`
- `src/i18n/locales/ko/common.json`

---

## 5. Edge Function 템플릿 리터럴 버그

### 증상
- Full Passage에서 단어 클릭 시 "Unable to explain word in this context" 에러
- Edge Function이 제대로 작동하지 않음

### 원인
- Edge Function 파일 생성 시 템플릿 리터럴이 제대로 처리되지 않음
- 백틱(`)이 없고 변수 삽입이 안 됨

### 해결 방법
```typescript
// Before (잘못된 코드)
const systemPrompt = You are an expert...;
const userPrompt = Word: ""...;

// After (수정된 코드)
const systemPrompt = `You are an expert...`;
const userPrompt = `Word: "${word}"...`;
```

### 결과
- ✅ Edge Function이 정상 작동
- ✅ 단어 클릭 시 지문 맥락에서의 의미 제공

### 관련 파일
- `supabase/functions/explain-word-in-context/index.ts`

---

## 6. 요약

### 해결된 문제들
1. ✅ Git 커밋 메시지 깨짐 → 영어로 변경 완료
2. ✅ Full Passage/Translation 반응형 문제 → 반응형 레이아웃 적용
3. ✅ 단어 뜻 API 실패 → AI 기반 context explanation으로 전환
4. ✅ Translation UI 복잡 → 토글 버튼으로 개선
5. ✅ Edge Function 버그 → 템플릿 리터럴 수정

### 주요 개선 사항
- **UI 일관성**: 모든 섹션의 타이포그래피 통일
- **반응형**: 16:9 화면에서도 최적화된 레이아웃
- **사용자 경험**: Translation 토글, AI 기반 단어 설명
- **코드 품질**: Git 히스토리 정리, Edge Function 버그 수정

### 다음 단계
- Supabase에 Edge Function 배포 필요
- 배포 후 단어 설명 기능 테스트

---

## 관련 문서
- [Git Commit Message Fix Guide](../FIX_COMMIT_MESSAGES.md)
- [Architecture Review](../architecture/2026-01-18-architecture-midterm-review.md)
