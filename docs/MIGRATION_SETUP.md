# Supabase 마이그레이션 자동화 가이드

## 🎯 목표
- Supabase 대시보드 수동 접근 제거
- CLI를 통한 마이그레이션 자동화
- dev 브랜치에서 마이그레이션 적용 자동화

## 🔧 초기 설정 (1회만)

### 1. Supabase 액세스 토큰 생성
1. https://supabase.com/dashboard → 우측 상단 프로필
2. **Access Tokens** 클릭
3. **Generate new token** 클릭
4. Scope: `API` 선택
5. 토큰 복사

### 2. 로컬 환경 변수 설정
```bash
# 프로젝트 루트에 .env.local 생성
SUPABASE_ACCESS_TOKEN=your_token_here
SUPABASE_DB_PASSWORD=your_db_password_here  # (선택사항)
```

### 3. Supabase CLI 로그인
```bash
npx supabase link --project-ref qnqfarulquicshnwfaxi
# 프롬프트에서 토큰 입력
```

## 🚀 마이그레이션 적용 (매번)

### 1. 마이그레이션 파일 생성
```bash
# supabase/migrations/ 디렉토리에 SQL 파일 추가
# 파일명: YYYYMMDDHHMMSS_description.sql
# 예: 20250206000001_add_exercise_type.sql
```

### 2. 마이그레이션 적용
```bash
# 현재 상태 확인
npx supabase migration list

# 원격에 미적용된 마이그레이션 확인
npx supabase migration list --remote

# 마이그레이션 적용
npx supabase migration push --skip-verification
```

### 3. 확인
```bash
# 상태 재확인
npx supabase migration list --remote
```

## 📋 마이그레이션 파일 작성 규칙

### 파일명
```
YYYYMMDDHHMMSS_description.sql
```
예: `20250206000001_add_exercise_type.sql`

### 내용
- 멱등성(Idempotency) 필수: `IF NOT EXISTS` 사용
- 주석으로 의도 설명
- 인덱스도 함께 생성

```sql
-- Add exercise_type to user_exercise_history
ALTER TABLE public.user_exercise_history
ADD COLUMN IF NOT EXISTS exercise_type text NULL DEFAULT 'text-completion';

CREATE INDEX IF NOT EXISTS idx_user_exercise_history_exercise_type
ON public.user_exercise_history(user_id, exercise_type, completed_at DESC);
```

## ⚠️ 주의사항

1. **마이그레이션은 한 번 작성되면 수정 불가**
   - 실수하면 새 마이그레이션으로 되돌림

2. **테스트 DB에서 먼저 검증**
   - `npx supabase migration preview` 사용

3. **프로덕션 배포 전 검증**
   - 쿼리 실행 계획 확인
   - 성능 영향도 테스트

## 🔄 CI/CD 통합 (GitHub Actions)

파일: `.github/workflows/supabase-migrate.yml`

```yaml
name: Supabase Migration

on:
  push:
    paths:
      - 'supabase/migrations/**'
    branches:
      - main

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: supabase/setup-cli@v1
      - run: supabase link --project-ref qnqfarulquicshnwfaxi
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      - run: supabase migration push --skip-verification
```

## 📚 참고
- [Supabase CLI 문서](https://supabase.com/docs/guides/cli)
- [마이그레이션 가이드](https://supabase.com/docs/guides/cli/managing-schemas)
