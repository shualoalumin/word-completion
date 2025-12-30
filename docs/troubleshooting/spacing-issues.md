# 🚀 Spacing Issues: From Quick Fix to Self-Healing Architecture

> **Date**: 2025-12-30  
> **Topic**: AI Content Generation & Data Integrity  
> **Status**: ✅ Solved with "Clean In" Philosophy

---

## 1. The Symptom (증상)

AI가 생성한 영어 지문에서 **단어 사이의 공백이 사라지는 현상** 발생.
특히 `content_parts`의 경계선(Text ↔ Blank)에서 정확하게 발생함.

```
Original: "Ecosystems are complex natural systemswhere..."
Fixed:    "Ecosystems are complex natural systems where..."
```

---

## 2. The Deep Dive: Why did AI do this? (원인 분석)

우리는 단순히 AI의 실수라고 넘기지 않고, **"왜 AI는 공백을 싫어하는가?"**를 파고들었습니다.

### 💡 Insight 1: Tokenization Bias (토큰화 편향)
LLM에게 `systems`와 ` systems`는 완전히 다른 토큰입니다. AI는 효율성을 위해 의미(Semantic) 단위인 단어에 집중하고, 공백은 단순한 **구분자(Separator)**로 취급하여 생략하거나 JSON 구조화 과정에서 `trim()` 해버리는 경향이 있습니다.

### 💡 Insight 2: Implicit Prompt Failure (암묵적 지시의 실패)
우리는 "단어를 채워라"라고만 했지, "단어 뒤에 공백을 포함하라"는 **형식적 지시(Formatting Instruction)**를 하지 않았습니다. AI에게 "당연한 것"은 없습니다. 명시하지 않은 규칙은 존재하지 않는 규칙입니다.

---

## 3. The Evolution of Solution (해결책의 진화)

우리는 이 문제를 해결하기 위해 치열한 논의를 거쳤으며, 그 과정에서 아키텍처 철학이 바뀌었습니다.

### 🥉 V1. Frontend Normalization (기각됨)
- **접근**: "화면에 보여줄 때만 고쳐서 보여주자." (Passive Fix)
- **문제점**:
    - DB에는 여전히 깨진 데이터(`systemswhich`)가 남음.
    - 모바일 앱 등 다른 클라이언트가 생기면 로직을 또 짜야 함.
- **결론**: "Garbage In, Garbage Out"을 방치하는 미봉책.

### 🥈 V2. Backend Normalization (수용됨)
- **접근**: "DB에 넣기 전에 닦아서 넣자." (Clean In)
- **장점**: DB는 항상 깨끗한 데이터(Source of Truth)를 유지. 누가 가져다 써도 안전함.

### 🥇 V3. Self-Healing Cache (최종 채택)
- **접근**: "이미 오염된 과거 데이터는? 조회할 때 몰래 고쳐놓자."
- **로직**:
    1. 유저가 문제 요청
    2. Edge Function이 DB에서 꺼냄
    3. 오염 감지 시 → 즉시 수리하여 반환 (유저 행복)
    4. **동시에 DB 업데이트 (비동기)** (시스템 행복)
- **의의**: 별도의 대규모 마이그레이션 없이, 서비스를 운영할수록 데이터가 점점 깨끗해지는 **자가 치유 시스템** 구축.

---

## 4. Key Takeaways (배운 점)

1. **AI is Literal**: AI는 융통성이 없다. 포맷팅 규칙(공백 포함 등)은 프롬프트에 **"CRITICAL RULE"**로 박아넣어야 한다.
2. **Clean In, Clean Out**: 데이터를 소비하는 쪽(FE)에서 고생하지 말고, 생산하는 쪽(BE)에서 책임을 져야 한다.
3. **Think Long-term**: "지금 당장 되는 것"보다 "확장성 있는 데이터 구조"가 100배 중요하다.

---

### Related Code
- `supabase/functions/_shared/normalize-spacing.ts` (The Sanitizer)
- `supabase/functions/generate-passage/index.ts` (Self-Healing Logic)
