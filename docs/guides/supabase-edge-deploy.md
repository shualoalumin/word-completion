# Edge Functions 배포 (CLI / MCP)

## CLI (다른 IDE·터미널에서 심플하게)

한 번만 로그인·링크 후, 아래 스크립트로 배포.

```bash
# 한 번만
npx supabase login
npx supabase link --project-ref qnqfarulquicshnwfaxi

# 배포 (Docker 있는 환경에서)
npm run supabase:deploy              # 전체
npm run supabase:deploy:explain      # explain-word-in-context 만
npm run supabase:deploy:passage      # generate-passage 만
```

- 로컬에 Docker가 없으면: GitHub Actions 워크플로 사용 (`.github/workflows/deploy-edge-functions.yml`). Secrets `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_ID` 설정 후 push 시 자동 배포.

## MCP (Cursor 등)

Supabase MCP를 쓰면 IDE에서 deploy 도구로 배포 가능.

- Cursor: 전역 MCP 설정(예: `~/.cursor/mcp.json` 또는 Cursor 설정의 MCP)에 Supabase 서버 추가.
- 사용할 도구 예: `deploy_function` 또는 해당 MCP가 제공하는 배포용 도구 이름 확인 후 호출.
