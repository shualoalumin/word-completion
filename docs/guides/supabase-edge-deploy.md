# Edge Functions 배포 (npx)

한 번만 로그인·링크 후, npx로 배포.

```bash
npx supabase login
npx supabase link --project-ref qnqfarulquicshnwfaxi
```

```bash
npm run supabase:deploy              # 전체
npm run supabase:deploy:explain      # explain-word-in-context
npm run supabase:deploy:passage      # generate-passage
```

CI로 돌리려면 `.github/workflows/deploy-edge-functions.yml` 사용. Secrets: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_ID`.
