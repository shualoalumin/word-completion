# Spacing Issues in AI-Generated Passages

> **Date**: 2025-12-30  
> **Severity**: Medium (UX issue, no functionality loss)  
> **Status**: ✅ Fixed

---

## Issue: Missing Spaces Between Words

### 📸 Symptom

```
"systemswh___ living organismsinte___ with"
"Forinst___ plants" 
"produceen___"
```

단어와 빈칸 사이 공백이 누락되어 텍스트가 붙어 보임.

---

### 🔍 Root Cause

AI (Gemini API)가 생성한 JSON `content_parts`에서 공백이 누락됨:

```json
// ❌ 문제 발생
{
  "type": "text",
  "value": "systemswh"  // "systems " 이어야 함
}
```

---

### ✅ Solution: Client-Side Normalization

**Location**: `src/features/reading/text-completion/hooks/useTextCompletion.ts`

#### Before

```typescript
if (result.data) {
  setPassage(result.data); // ❌ AI 데이터 그대로 사용
}
```

#### After

```typescript
if (result.data) {
  // ✅ 공백 정규화 적용 (AI 생성 데이터의 공백 누락 자동 수정)
  const normalizedPassage = normalizeSpacing(result.data);
  setPassage(normalizedPassage);
}
```

---

### 📝 Implementation

```typescript
/**
 * 공백 정규화 함수
 * AI가 생성한 content_parts에서 누락된 공백을 자동으로 추가
 * 예: "systemswh___" → "systems wh___"
 */
function normalizeSpacing(passage: TextCompletionPassage): TextCompletionPassage {
  const parts = passage.content_parts;
  const normalizedParts: TextCompletionPart[] = [];

  for (let i = 0; i < parts.length; i++) {
    const current = parts[i];
    const next = parts[i + 1];

    if (current.type === 'text') {
      let value = current.value;

      // 다음이 blank인데, 현재 text가 공백으로 끝나지 않으면 공백 추가
      if (next && isBlankPart(next)) {
        if (value.length > 0 && !/\s$/.test(value)) {
          value = value + ' ';
        }
      }

      normalizedParts.push({ ...current, value });
    } else if (isBlankPart(current)) {
      normalizedParts.push(current);

      // 다음이 text인데, 공백/구두점으로 시작하지 않으면 공백 삽입
      if (next && next.type === 'text') {
        const nextValue = next.value;
        // 구두점(.,!?;:')이나 공백으로 시작하지 않으면
        if (nextValue.length > 0 && !/^[\s.,!?;:']/.test(nextValue)) {
          parts[i + 1] = { ...next, value: ' ' + nextValue };
        }
      }
    } else {
      normalizedParts.push(current);
    }
  }

  return { ...passage, content_parts: normalizedParts };
}
```

---

### 🤔 Why Client-Side Fix?

| 방식 | 장점 | 단점 |
|------|------|------|
| **Client-Side (선택)** | 캐시된 데이터도 자동 수정, 즉시 적용 | 매 요청마다 처리 |
| Server-Side | 한 번 처리로 완료 | 배포 필요, 기존 캐시 수동 마이그레이션 필요 |

**결론**: 캐시된 데이터까지 자동으로 수정해주는 Client-Side 방식 선택.

---

### 🔮 Prevention (Future)

Edge Function에 검증 로직 추가 고려:

```typescript
// supabase/functions/generate-passage/index.ts
function validateSpacing(passage: PassageData): boolean {
  for (let i = 0; i < passage.content_parts.length - 1; i++) {
    const current = passage.content_parts[i];
    const next = passage.content_parts[i + 1];
    
    // text → blank: text는 공백으로 끝나야 함
    if (current.type === 'text' && next.type === 'blank') {
      if (!/\s$/.test(current.value)) {
        return false;
      }
    }
  }
  return true;
}
```

---

### 📚 Related Documents

- [ETS Text Completion Algorithm](../algorithms/ets-text-completion-algorithm.md)
- [Database Schema](../architecture/database-schema.md)

