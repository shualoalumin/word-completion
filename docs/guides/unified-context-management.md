# 🌐 통합 컨텍스트 관리 가이드 (Unified Context Management)

여러 IDE(Cursor, Claude, VS Code 등)와 디바이스를 오가며 개발할 때, AI 에이전트가 프로젝트의 상태와 규칙을 일관되게 인식하도록 하는 관리 전략입니다.

---

## 1. 컨텍스트의 핵심 소스 (Single Source of Truth)

에이전트가 가장 먼저 읽어야 할 파일들을 최상단에 배치하여 일관성을 유지합니다.

### 🏛️ `AGENTS.md` (헌법 및 규칙)
- **용도**: AI 에이전트가 지켜야 할 절대적인 원칙과 코딩 컨벤션.
- **포함 내용**: 아키텍처 원칙, 기술 스택, 유지보수 룰(로컬-서버 동기화 등).
- **효과**: IDE가 바뀌어도 에이전트가 동일한 "성격"과 "기준"으로 작업하게 함.

### 📊 `docs/project-status.md` (기록 및 상태)
- **용도**: 프로젝트의 현재 진행 상황과 세션별 변경 로그(Change Log).
- **포함 내용**: 구현된 기능, 남은 작업(Backlog), 일자별 상세 변천사.
- **효과**: "마지막에 어디까지 했지?"라는 질문에 대한 즉각적인 해답 제공.

---

## 2. 여러 IDE 사용 시 설정 팁 💡

### 🔄 IDE 간 설정 동기화
1. **VS Code Profiles**: 설정을 Profile로 저장하여 GitHub 계정으로 동기화하면 Cursor와 VS Code 간 확장 프로그램 및 설정을 맞출 수 있습니다.
2. **Environment Variables**: `.env` 파일은 Git에 올리지 않으므로, 1password나 별도의 보안 메모에 `.env.template`과 함께 실제 값을 관리하여 새 디바이스에서 즉시 복구할 수 있게 합니다.

### 🤖 AI 에이전트 동기화 (Rules for AI)
각 도구의 "준수 사항" 설정에 다음을 추가하세요:
- **Cursor (.cursorrules)**: `Always read AGENTS.md and docs/project-status.md at the start of a session.`
- **Claude / Windsurf**: 프로젝트 세션이 시작될 때 위 파일들을 읽도록 명시적으로 요청하거나, `AGENTS.md`에 정의된 룰을 시스템 프롬프트로 활용.

---

## 3. 문서 구조화 원칙 (Zero-Clutter)

프로젝트 루트가 지저분해지면 AI가 파일 탐색 시 혼란을 겪습니다.

- **루트 폴더**: 필수 설정 파일(`package.json`, `tsconfig.json`)과 핵심 문서(`README.md`, `AGENTS.md`)만 유지.
- **작업 로그 및 스크립트**: 임시 스크립트나 Fix 로그는 작업 완료 후 즉시 삭제하거나 `scripts/` 또는 `docs/dev-logs/`로 이동.
- **문서 통합**: 지식 파편화 방지를 위해 새로운 의사결정은 `docs/dev-logs/`에, 상시 가이드는 `docs/guides/`에 저장.

---

## 4. 실시간 서버 상태 동기화

에이전트 룰에 따라 다음 작업을 수행합니다:
1. **Settings Change**: Supabase Edge Function 설정 변경 시 `supabase/config.toml` 즉시 업데이트.
2. **Database Schema**: 스키마 변경 시 `docs/architecture/database-schema.md` 업데이트.

이 가이드를 준수하면 디바이스나 도구가 바뀌어도 끊김 없는(Seamless) 개발 경험을 유지할 수 있습니다.
