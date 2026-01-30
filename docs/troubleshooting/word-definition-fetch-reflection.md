# 단어정의(explain-word-in-context) 이슈: 반성과 사전조사 기반 해결

## 핵심 원인·해결 (요약)

- **증상**: Full Passage에서 단어 클릭 시 "Failed to fetch explanation" / 404.
- **원인**: Edge Function이 **deprecated된 Gemini 모델**(`gemini-1.5-flash-002` 등)을 사용 → Google AI API 404 (`models/gemini-1.5-flash-002 is not found for API version v1`).
- **해결**: `supabase/functions/_shared/ai/client.ts`, `gemini.ts`에서 **공식 문서 기준 현재 지원 모델만** 사용(`gemini-2.5-flash` 등), `gemini-1.5-flash*` 계열 제거 후 Edge Function 재배포.
- **검증**: 앱에서 단어 클릭 시 뜻/설명 정상 표시 확인.

---

## 왜 troubleshooting을 제대로 하지 못했는가

### 1. 런타임 증거 없이 수정했다
- **한 일**: 디버그 로그(ingest 서버)를 넣었지만 로그 파일이 생성되지 않음. 그런데도 URL 폴백·CORS 등 코드 추론만으로 수정 적용.
- **문제**: Debug 모드 원칙인 "fix only with 100% confidence from runtime evidence"를 지키지 않음. 실제 원인(Gemini 404)은 verify 스크립트로 나중에 확인함.

### 2. 외부 API·모델 버전을 문서 없이 가정했다
- **한 일**: AIClient 폴백에 `gemini-1.5-flash-002` 등 하드코딩. deprecated/제거된 모델인지 확인하지 않음.
- **문제**: [Gemini models](https://ai.google.dev/gemini-api/docs/models), [API versions](https://ai.google.dev/gemini-api/docs/api-versions), [Deprecations](https://ai.google.dev/gemini-api/docs/deprecations) 등 **공식 문서·ListModels**를 먼저 보지 않고 과거에 쓰이던 모델명을 그대로 사용함.

### 3. 배포 검증을 수렴 기준으로 쓰지 않았다
- **한 일**: 로컬에서 002→001로만 바꾸고, "재배포 후 확인하라"고만 안내. 배포된 함수가 실제로 새 코드인지·동작하는지 한 번에 검증하는 플로우가 없었음.
- **문제**: 스크린샷에서 여전히 `gemini-1.5-flash-002` 404가 나오는 것은 **배포된 Edge Function이 여전히 구 코드**이거나, **1.5 계열 전체가 API에서 제거**된 상황을 반영함. "한 번에 검증"할 수 있는 기준(공식 문서 기준 모델만 사용 + 배포 후 verify 스크립트)을 사전에 정하지 않음.

### 4. 올바른 절차 (앞으로)
1. **사전조사**: 외부 API/서비스 변경 시 반드시 **최신 공식 문서**(models, api-versions, deprecations) 또는 **ListModels/API**로 사용 가능한 값 확인.
2. **원인 수렴**: 에러 메시지(404, model not found)를 보고 "모델 버전 문제"로 좁힌 뒤, 문서와 대조해 제거/대체 모델 확인.
3. **한 번에 수정**: 문서에 명시된 **현재 지원 모델만** 사용하도록 코드 수정(폴백 목록 정리).
4. **배포·검증**: `--use-api`로 배포 후 `node scripts/verify-edge-function.js`로 200 + 정의/설명 확인.

---

## 공식 문서 기반 결론 (2025–2026)

- **Models**: https://ai.google.dev/gemini-api/docs/models  
  - Text generateContent용 **Stable**: `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-2.0-flash-001`, `gemini-2.5-flash-lite`, `gemini-2.0-flash-lite`, `gemini-2.0-flash-lite-001`.
- **Deprecations**: https://ai.google.dev/gemini-api/docs/deprecations  
  - `gemini-1.5-flash*` 계열은 현재 문서 목록에 없음 → 사용 중단.  
  - 2.0 계열은 2026년 2월까지 지원, 대체는 `gemini-2.5-flash` 등.

따라서 **AIClient 폴백은 위 공식 문서에 나온 모델만 사용**하고, 1.5 계열은 전부 제거하는 것이 근본 해결이다.
