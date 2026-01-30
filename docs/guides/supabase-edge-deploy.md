# Edge Functions 배포 (Dashboard / CLI / MCP)

## Dashboard Via Editor (Docker·GitHub Actions 없이)

가장 심플한 방법. 브라우저에서 코드 붙여넣고 배포.

1. [Supabase Dashboard](https://supabase.com/dashboard) → 프로젝트 선택 → **Edge Functions**
2. 기존 함수 선택(예: `explain-word-in-context`) 또는 **Deploy a new function** → **Via Editor**
3. 로컬 코드 복사: `supabase/functions/explain-word-in-context/index.ts` (및 `_shared` 의존 시 해당 파일 내용도 참고)
4. 대시보드 에디터에 붙여넣기 → **Deploy function** (또는 **Deploy updates**)
5. 배포 완료(보통 10–30초). Docker·CI 불필요.

- **주의**: 대시보드에는 버전 관리 없음. `explain-word-in-context`는 `_shared/ai`를 import하므로, 대시보드 단일 에디터만으로는 공유 코드가 없어 실패할 수 있음. 그 경우 CLI(또는 MCP/CI)로 배포.

---

## CLI (Docker 있는 환경에서)

한 번만 로그인·링크 후:

```bash
npx supabase login
npx supabase link --project-ref qnqfarulquicshnwfaxi

npm run supabase:deploy              # 전체
npm run supabase:deploy:explain      # explain-word-in-context 만
npm run supabase:deploy:passage      # generate-passage 만
```

로컬에 Docker가 없으면 아래 GitHub Actions 사용.

---

## MCP (Cursor 등)

Supabase MCP를 쓰면 IDE에서 deploy 도구로 배포 가능.

- Cursor: 전역 MCP 설정에 Supabase 서버 추가 후, 해당 MCP의 배포 도구(예: `deploy_function`) 호출.

---

## GitHub Actions (Docker 없는 CI)

로컬에 Docker가 없을 때: push 시 자동 배포.

- 워크플로: `.github/workflows/deploy-edge-functions.yml`
- 저장소 Secrets 설정: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_ID`
- `main`에 push 시 `supabase/functions/**` 변경 시 배포.
