# Edge Functions 배포 (npx)

한 번만 로그인 후, npx로 배포. `--use-api` 사용으로 Docker 불필요.

```bash
npx supabase login
```

```bash
npm run supabase:deploy              # 전체
npm run supabase:deploy:explain      # explain-word-in-context
npm run supabase:deploy:passage      # generate-passage
```

CI: `.github/workflows/deploy-edge-functions.yml`. Secrets: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_ID`.
