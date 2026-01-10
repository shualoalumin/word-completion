# 🔐 OAuth Popup Authentication Issues

> **Date**: 2026-01-11  
> **Topic**: Google OAuth Popup Authentication & React Infinite Loop  
> **Status**: ✅ Solved

---

## 1. The Symptoms (증상)

### Issue 1: "No access token found" Toast Error
- **증상**: Google OAuth 팝업 창에서 로그인 후 Dashboard로 돌아왔을 때 "No access token found" 토스트 에러 발생
- **발생 위치**: `src/pages/AuthCallback.tsx`
- **영향**: 사용자 경험 저하 (기능적으로는 로그인 성공했지만 에러 메시지 표시)

### Issue 2: Minified React error #310 (Infinite Loop)
- **증상**: Google OAuth 팝업 인증 구현 후 브라우저 콘솔에 무한 루프 에러 발생
- **에러 메시지**: `Minified React error #310` (React의 무한 리렌더링 경고)
- **발생 위치**: `src/features/auth/components/AuthModal.tsx`, `src/pages/Landing.tsx`
- **영향**: 성능 저하, 잠재적 메모리 누수

### Issue 3: Button State Not Resetting
- **증상**: Google 로그인 팝업 창을 닫았을 때 버튼이 "Loading..." 상태로 고정되거나 클릭 불가 상태 유지
- **발생 위치**: `src/features/auth/components/AuthModal.tsx`
- **영향**: 사용자가 재시도할 수 없음

### Issue 4: Cross-Origin-Opener-Policy Warning
- **증상**: 브라우저 콘솔에 `Cross-Origin-Opener-Policy policy would block the window.closed call` 경고
- **발생 위치**: `src/features/auth/components/AuthModal.tsx` (팝업 감시 로직)
- **영향**: 기능에는 영향 없음 (브라우저 보안 경고일 뿐)

---

## 2. The Deep Dive: Root Cause Analysis (원인 분석)

### 💡 Issue 1: "No access token found" - Timing Problem

**문제점**:
```typescript
// Before: URL hash에서 즉시 토큰 확인
const hashParams = new URLSearchParams(window.location.hash.substring(1));
const accessToken = hashParams.get('access_token');

if (!accessToken) {
  // 팝업인데 토큰이 없으면 에러
  window.opener.postMessage({ type: 'OAUTH_ERROR', error: 'No access token found' });
}
```

**원인**:
1. **Race Condition**: Supabase 클라이언트가 URL hash를 자동으로 처리하기 전에 우리 코드가 실행됨
2. **사용자 취소 vs 에러 구분 실패**: 사용자가 팝업을 닫은 경우와 실제 에러를 구분하지 못함
3. **URL Hash 처리 타이밍**: Supabase는 `onAuthStateChange` 이벤트를 통해 비동기적으로 세션을 처리하는데, 우리는 동기적으로 체크함

### 💡 Issue 2: Minified React error #310 - Unstable Callback References

**문제점**:
```typescript
// Before: onSuccess 콜백이 매번 새로 생성됨
useEffect(() => {
  const handleMessage = async (event: MessageEvent) => {
    // ...
    onSuccess(); // ← 이게 매번 새로운 참조를 가짐
  };
  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, [onSuccess]); // ← onSuccess가 변경될 때마다 리스너 재등록
```

**원인**:
1. **Unstable Callback Reference**: `Landing.tsx`에서 `onSuccess` 콜백이 매 렌더링마다 새로 생성됨
2. **useEffect 의존성 체인**: `onSuccess` 변경 → `useEffect` 재실행 → 이벤트 리스너 재등록 → 무한 루프
3. **중복 리디렉션 로직**: `AuthModal`의 `onSuccess`와 `Landing.tsx`의 `useEffect`가 동시에 리디렉션 시도

### 💡 Issue 3: Button State Not Resetting - Popup Monitoring Logic

**문제점**:
```typescript
// Before: 팝업이 닫혔는지만 확인
setInterval(() => {
  if (popup.closed) {
    // 세션 확인 없이 그냥 로딩 상태 유지
  }
}, 500);
```

**원인**:
1. **세션 확인 누락**: 팝업이 닫혔을 때 세션이 실제로 생성되었는지 확인하지 않음
2. **메시지 리스너와의 경쟁**: 팝업 감시 로직과 메시지 리스너가 동시에 실행되어 상태 충돌

---

## 3. The Solution (해결책)

### ✅ Solution 1: Use `onAuthStateChange` Instead of Manual Token Check

**핵심 변경**:
```typescript
// After: Supabase가 자동으로 처리하도록 기다림
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      // 로그인 성공
      if (isPopup) {
        window.opener?.postMessage({ type: 'OAUTH_SUCCESS', session });
        setTimeout(() => window.close(), 200);
      }
    }
  }
);

// Fallback: onAuthStateChange가 트리거되지 않은 경우를 대비
await new Promise((resolve) => setTimeout(resolve, 500));
const { data: { session } } = await supabase.auth.getSession();
```

**이유**:
- Supabase가 URL hash를 자동으로 처리하도록 기다림
- `onAuthStateChange` 이벤트를 통해 안정적으로 세션 확인
- 사용자 취소 시 에러 메시지 없이 조용히 닫기

### ✅ Solution 2: Stabilize Callback References with `useRef`

**핵심 변경**:
```typescript
// AuthModal.tsx
const onSuccessRef = useRef(onSuccess);

useEffect(() => {
  onSuccessRef.current = onSuccess; // 최신 값 유지
}, [onSuccess]);

useEffect(() => {
  const handleMessage = async (event: MessageEvent) => {
    if (event.data.type === 'OAUTH_SUCCESS') {
      onSuccessRef.current(); // ← 안정적인 참조 사용
    }
  };
  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, []); // ← 빈 배열: 한 번만 등록
```

**Landing.tsx**:
```typescript
// onSuccess 콜백을 useCallback으로 안정화
const handleAuthSuccess = useCallback(() => {
  setShowAuth(false);
  setTimeout(() => {
    navigate('/dashboard', { replace: true });
  }, 100);
}, [navigate]);

// useEffect는 모달이 열려있지 않을 때만 리디렉션
useEffect(() => {
  if (isAuthenticated && !loading && !showAuth) {
    navigate('/dashboard', { replace: true });
  }
}, [isAuthenticated, loading, navigate, showAuth]);
```

**이유**:
- `useRef`로 최신 콜백 참조 유지하면서도 `useEffect` 의존성에 포함하지 않음
- `useCallback`으로 콜백 안정화
- 리디렉션 로직 분리 (모달 내부 vs 외부)

### ✅ Solution 3: Proper Cleanup and State Management

**핵심 변경**:
```typescript
// 중복 처리 방지 플래그
let processed = false;

const cleanup = () => {
  if (subscription) {
    subscription.unsubscribe();
    subscription = null;
  }
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
};

// 사용자 취소 시 에러 없이 조용히 닫기
if (isPopup && !session) {
  // 에러 메시지를 보내지 않고 조용히 닫기
  setTimeout(() => {
    if (!processed) {
      window.close();
      cleanup();
    }
  }, 1000);
}
```

**이유**:
- 중복 처리 방지로 메모리 누수 방지
- 사용자 취소와 실제 에러 구분
- 적절한 cleanup으로 리소스 정리

---

## 4. Key Takeaways (배운 점)

### 1. **Supabase Auth는 비동기적으로 작동한다**
- URL hash의 토큰을 즉시 확인하지 말고, `onAuthStateChange` 이벤트를 기다려야 함
- Supabase 클라이언트가 자동으로 세션을 처리하는 시간을 고려해야 함

### 2. **React의 무한 루프는 대부분 불안정한 참조 때문**
- `useRef`로 최신 값 유지하면서도 `useEffect` 의존성에 포함하지 않기
- `useCallback`으로 콜백 안정화
- 의존성 배열을 최소화하되, 필요한 경우에만 포함

### 3. **사용자 취소와 에러를 구분해야 한다**
- 팝업 창을 닫은 것이 항상 에러는 아님
- 사용자 경험을 위해 불필요한 에러 메시지 표시 지양

### 4. **Cleanup은 필수다**
- `useEffect`의 cleanup 함수로 리소스 정리
- 타임아웃, 인터벌, 이벤트 리스너 모두 정리
- 중복 처리 방지 플래그로 안전성 확보

### 5. **브라우저 경고는 기능에 영향 없을 수 있다**
- `Cross-Origin-Opener-Policy` 경고는 브라우저 보안 정책 경고일 뿐
- 기능이 정상 작동한다면 우선순위 낮게 처리 가능

---

## 5. Related Code

### Modified Files
- `src/pages/AuthCallback.tsx` - OAuth 콜백 처리 로직 개선
- `src/features/auth/components/AuthModal.tsx` - 팝업 인증 및 상태 관리 개선
- `src/pages/Landing.tsx` - 리디렉션 로직 분리 및 콜백 안정화

### Key Changes

#### AuthCallback.tsx
```typescript
// Before: URL hash에서 즉시 토큰 확인
const accessToken = hashParams.get('access_token');
if (!accessToken) {
  // 에러 발생
}

// After: onAuthStateChange 이벤트 리스너 사용
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session) {
    // 성공 처리
  }
});
```

#### AuthModal.tsx
```typescript
// Before: onSuccess를 의존성에 포함
useEffect(() => {
  const handleMessage = (event) => {
    onSuccess(); // ← 불안정한 참조
  };
  // ...
}, [onSuccess]); // ← 무한 루프 유발

// After: useRef로 안정적인 참조 유지
const onSuccessRef = useRef(onSuccess);
useEffect(() => {
  onSuccessRef.current = onSuccess;
}, [onSuccess]);

useEffect(() => {
  const handleMessage = (event) => {
    onSuccessRef.current(); // ← 안정적인 참조
  };
  // ...
}, []); // ← 한 번만 등록
```

#### Landing.tsx
```typescript
// Before: 매 렌더링마다 새 콜백 생성
<AuthModal onSuccess={() => navigate('/dashboard')} />

// After: useCallback으로 안정화
const handleAuthSuccess = useCallback(() => {
  setShowAuth(false);
  setTimeout(() => navigate('/dashboard'), 100);
}, [navigate]);

<AuthModal onSuccess={handleAuthSuccess} />
```

---

## 6. Verification (검증)

### MCP/CLI로 확인한 내용

#### Auth Logs (MCP)
```bash
# Google OAuth 로그인 성공 확인
- user_id: eb6b676e-df3d-4eaa-b024-a78ef8aa8a75 (Josh Kim)
- 최근 로그인: 2026-01-10T15:41:51Z, 2026-01-10T15:29:51Z
- Provider: google
```

#### Database (MCP)
```sql
SELECT 
  au.id,
  au.email,
  au.last_sign_in_at,
  up.subscription_tier,
  up.display_name
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE au.email = 'realx1212@gmail.com';
-- 결과: subscription_tier: free, display_name: Josh Kim
```

#### Edge Function Logs (MCP)
```bash
# generate-passage 함수 정상 작동
- Status: 200
- 최근 실행: 약 1시간 전
- 실행 시간: 800ms ~ 1.4초 (정상 범위)
```

---

## 7. Prevention (예방)

### Best Practices

1. **OAuth 콜백 처리**
   - 항상 `onAuthStateChange` 이벤트 리스너 사용
   - URL hash 직접 파싱 지양
   - 사용자 취소와 에러 구분

2. **React Hooks**
   - 콜백은 `useCallback`으로 안정화
   - `useRef`로 최신 값 유지하면서 의존성 최소화
   - cleanup 함수로 리소스 정리

3. **팝업 창 관리**
   - 팝업 상태를 ref로 관리
   - 타임아웃 설정으로 무한 대기 방지
   - 중복 처리 방지 플래그 사용

4. **에러 처리**
   - 사용자 경험을 고려한 에러 메시지
   - 불필요한 에러 토스트 지양
   - 로그는 상세하게, 사용자에게는 간단하게

---

## 8. References

- [Supabase Auth: OAuth Callback](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [React: useCallback Hook](https://react.dev/reference/react/useCallback)
- [React: useRef Hook](https://react.dev/reference/react/useRef)
- [MDN: Window.postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)

---

> **Next Steps**: 
> - [ ] flow-5: `user_exercise_history` 테이블 생성 및 저장 로직 구현
> - [ ] flow-6: Dashboard 통계 컴포넌트 (스트릭, 토픽별 정오율)
