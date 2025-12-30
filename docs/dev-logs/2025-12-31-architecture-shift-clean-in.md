# 🏗️ Architecture Shift: The "Clean In" Philosophy

> **Date**: 2025-12-31  
> **Topic**: Data Integrity & AI Tokenization  
> **Participants**: User & AI Assistant

---

## 1. The Context (배경)
TOEFL Text Completion 기능 개발 중, AI가 생성한 지문에서 **단어 사이의 공백이 누락되는 현상**(`systemswhich`)이 발견됨. 
초기에는 프론트엔드에서 단순히 공백을 추가하여 해결하려 했으나, 깊은 논의 끝에 아키텍처 전체를 재검토하게 됨.

## 2. The Problem (문제 심층 분석)

### 왜 AI는 공백을 빼먹었나?
- **Tokenization Bias**: LLM은 공백을 '데이터'가 아닌 '구분자'로 인식함.
- **Implicit Prompt**: "공백을 넣어라"는 명시적 지시가 없었음.

### FE 해결책의 위험성 (Simulation)
1.  **Mobile Expansion**: 앱 출시 시 로직 중복 구현 필요.
2.  **SSR Migration**: 서버 데이터와 클라이언트 렌더링 불일치(Hydration Mismatch) 발생 위험.
3.  **Data Pollution**: DB에는 여전히 깨진 데이터가 영구 보존됨.

## 3. The Decision (의사결정)

**"Passive Fix"에서 "Active Healing"으로 전환**

| 구분 | 기존 접근 (FE Fix) | 새로운 접근 (BE Clean In) |
|------|-------------------|--------------------------|
| **시점** | Read Time (읽을 때) | Write Time (쓸 때) & Access Time |
| **철학** | "보여줄 때만 잘하자" | "DB에는 보석만 남기자" |
| **책임** | Consumer (FE) | Producer (BE/Edge Function) |

## 4. Implementation (구현 내용)

1.  **Strict Prompting**: AI 프롬프트에 "Formatting Rule" 추가.
2.  **Backend Normalization**: `_shared/normalize-spacing.ts` 유틸리티로 DB 저장 전 강제 정화.
3.  **Self-Healing Cache**:
    - 조회 시 오염된 데이터 발견 → 즉시 메모리 수정 후 반환.
    - **Background**: 비동기로 DB 업데이트 수행 (유저 딜레이 없음).

## 5. Lessons Learned (회고)

> **"Garbage In, Garbage Out을 막는 것을 넘어, Garbage In, Clean Out 시스템을 구축하라."**

단순 버그 수정이 아니라, 서비스의 **확장성(Scalability)**과 **무결성(Integrity)**을 지키는 중요한 아키텍처 원칙을 수립함.

