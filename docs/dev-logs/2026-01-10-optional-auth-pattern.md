# 🔐 Optional Authentication Pattern for Edge Functions

> **Date**: 2026-01-10  
> **Topic**: Authentication Strategy & Edge Function Design  
> **Participants**: User & AI Assistant

---

## 1. The Context (배경)

Google OAuth 구현 완료 후, 인증된 사용자가 Dashboard에서 "Complete the Words" 카드를 클릭했을 때 문제 생성이 실패하는 현상 발견. 에러 조사 결과 Edge Function `generate-passage`가 401 Unauthorized 에러를 반환함.

**문제 상황**:
- 비인증 사용자(Demo 모드)로는 정상 작동
- 인증된 사용자로는 401 에러 발생
- Edge Function이 인증 토큰을 받지 못하고 있음

---

## 2. The Problem (문제 심층 분석)

### 왜 401 에러가 발생했나?

1. **Frontend**: `generatePassage()` 함수가 인증 토큰을 Edge Function에 전달하지 않음
2. **Edge Function**: 인증 토큰을 기대하지만, 전달받지 못함
3. **설정**: `supabase/config.toml`에 `verify_jwt = false`로 설정되어 있음
   - 하지만 Supabase의 기본 동작은 인증 토큰이 없으면 에러를 반환할 수 있음

### 설계 고려사항

**질문**: Edge Function은 인증이 필수여야 하는가?

**고려사항**:
- ✅ **Demo 모드 지원**: 비인증 사용자도 문제를 풀어볼 수 있어야 함 (온보딩)
- ✅ **개인화**: 인증된 사용자는 기록 저장, 통계 추적 필요
- ✅ **확장성**: 미래에는 프리미엄/무료 기능 차별화 필요
- ✅ **유연성**: 같은 Edge Function이 다양한 시나리오에서 작동해야 함

---

## 3. The Decision (의사결정)

**"Optional Authentication Pattern" 채택**

Edge Function을 **선택적으로 인증을 받도록** 설계:

| 구분 | 기존 접근 (고려했던 것) | 새로운 접근 (선택) |
|------|---------------------|------------------|
| **인증 요구** | 필수 (required) | 선택적 (optional) |
| **비인증 사용자** | ❌ 접근 불가 | ✅ 접근 가능 (Demo 모드) |
| **인증 사용자** | ✅ 접근 가능 | ✅ 접근 가능 + 추가 기능 (로깅, 개인화) |
| **설계 철학** | "인증 필수" | "인증은 옵션, 있으면 더 나은 기능 제공" |

---

## 4. Implementation (구현 내용)

### Frontend 수정

**파일**: `src/features/reading/text-completion/api.ts`

```typescript
export async function generatePassage(
  retryCount = 0
): Promise<GeneratePassageResult> {
  try {
    // Get current session to include auth token
    const { data: { session } } = await supabase.auth.getSession();
    
    // Invoke Edge Function with explicit headers
    const { data, error } = await supabase.functions.invoke('generate-passage', {
      headers: session ? {
        Authorization: `Bearer ${session.access_token}`,
      } : undefined,
    });
    // ... rest of the function
  }
}
```

**변경점**:
- 인증 세션이 있으면 `Authorization` 헤더에 토큰 포함
- 인증 세션이 없으면 헤더 전달 안 함 (비인증 모드)

### Backend 수정

**파일**: `supabase/functions/generate-passage/index.ts`

```typescript
serve(async (req) => {
  try {
    // Get auth header if present (optional - allows both authenticated and anonymous users)
    const authHeader = req.headers.get('Authorization');
    
    // Use service role for DB operations (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    // Optional: Log user info if authenticated (for analytics)
    if (authHeader) {
      try {
        const userSupabase = createClient(
          supabaseUrl,
          authHeader.replace('Bearer ', ''),
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          }
        );
        const { data: { user } } = await userSupabase.auth.getUser();
        if (user) {
          console.log(`Request from authenticated user: ${user.email || user.id}`);
        }
      } catch (authError) {
        // Ignore auth errors - function works for both authenticated and anonymous users
        console.log('Anonymous or invalid auth token - proceeding anyway');
      }
    }

    // Core logic continues regardless of authentication status
    // ... (캐시 조회, AI 생성 등)
  }
});
```

**핵심 설계 원칙**:

1. **Service Role 사용**: DB 작업은 Service Role Key로 수행 (RLS 우회)
   - 이유: 인증 여부와 관계없이 동일한 로직 실행 필요

2. **선택적 사용자 식별**: 인증 토큰이 있으면 사용자 정보 추출
   - 목적: 로깅, 분석, 향후 개인화 기능 준비
   - 에러 처리: 인증 토큰이 유효하지 않아도 무시하고 계속 진행

3. **Graceful Degradation**: 인증이 없어도 핵심 기능은 동작
   - 비인증: 문제 생성 및 풀이 가능 (Demo 모드)
   - 인증: 문제 생성 + 기록 저장 + 통계 추적 (추가 기능)

---

## 5. Configuration (설정)

### `supabase/config.toml`

```toml
[functions.generate-passage]
verify_jwt = false
```

**설명**:
- `verify_jwt = false`: Supabase가 자동으로 JWT 검증하지 않음
- 우리가 수동으로 인증 토큰을 처리하므로 자동 검증 비활성화
- 이렇게 하면 인증 토큰이 없어도 Edge Function이 실행됨

---

## 6. Benefits (장점)

### 1. **유연성 (Flexibility)**
- 같은 Edge Function이 다양한 시나리오에서 작동
- Demo 모드와 개인화 모드 모두 지원

### 2. **점진적 개선 (Progressive Enhancement)**
- 핵심 기능은 비인증으로도 접근 가능
- 인증 시 추가 기능 제공 (기록, 통계, 개인화)

### 3. **온보딩 개선**
- 사용자는 회원가입 없이도 앱을 체험할 수 있음
- 체험 후 회원가입 유도 가능

### 4. **확장성**
- 미래에 프리미엄/무료 기능 차별화 시 유연하게 대응 가능
- 같은 함수에서 권한에 따라 다른 로직 실행 가능

---

## 7. Trade-offs (트레이드오프)

### 장점 ✅
- 유연성과 확장성 확보
- 온보딩 개선 (비인증 사용자 경험)
- 점진적 개선 패턴

### 단점 ⚠️
- 인증 로직이 코드에 명시적으로 포함되어 복잡도 증가
- 수동 인증 검증 필요 (자동 검증 비활성화)
- 에러 처리 로직 필요 (인증 토큰 유효성 검사)

### 대안 (고려했던 것들)

1. **별도 Edge Function 분리**
   - `generate-passage-auth` (인증 필수)
   - `generate-passage-demo` (비인증)
   - **결정**: 코드 중복, 유지보수 어려움 → 기각

2. **인증 필수로 전환**
   - 모든 사용자가 회원가입 필요
   - **결정**: 온보딩 저해, 사용자 경험 저하 → 기각

3. **Optional Authentication (채택)**
   - 한 함수에서 선택적으로 인증 처리
   - **결정**: 유연성과 확장성 확보 → 채택

---

## 8. Lessons Learned (회고)

### 핵심 인사이트

> **"Authentication is a feature, not a gatekeeper."**

인증은 **사용자 경험을 향상시키는 기능**이지, **접근을 막는 장벽**이 아니어야 함.

### 설계 원칙

1. **Graceful Degradation**: 핵심 기능은 항상 동작
2. **Progressive Enhancement**: 인증 시 추가 기능 제공
3. **Flexibility First**: 확장 가능한 구조 우선 고려

### 향후 적용

이 패턴은 다른 Edge Function에도 적용:
- 문제 생성: ✅ 적용 완료
- 기록 저장: 인증 필수 (flow-5에서 구현 예정)
- 통계 조회: 인증 필수 (flow-6에서 구현 예정)
- 문제 검토/복습: 인증 필수 (향후 구현)

---

## 9. Related Decisions (관련 결정사항)

- **2025-12-31**: Clean In, Clean Out 아키텍처 전환
  - 이번 결정도 동일한 철학: "처음부터 확장 가능하게 설계"

---

## 10. Technical Notes (기술적 참고사항)

### MCP vs CLI 배포 이슈

**발견**: Supabase MCP 도구로 Edge Function 배포 시 `_shared` 폴더의 상대 경로 import 처리 실패

**해결**: Supabase CLI (`npx supabase`) 사용으로 전환
- CLI는 `_shared` 폴더를 자동으로 감지하여 올바르게 번들링
- 향후 배포는 CLI 사용 권장

**관찰**: MCP 도구는 단순 파일 업로드 방식이라 디렉토리 구조를 제대로 유지하지 못함

---

*이 문서는 프로젝트의 인증 전략 결정을 기록합니다. 향후 유사한 기능 추가 시 참고하세요.*
