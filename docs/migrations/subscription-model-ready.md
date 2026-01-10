# 🎯 구독 모델 확장 준비 완료 (Testing → Production)

> **목적**: 테스트 기간에서 수익화 모델로 전환 시 필요한 구조 준비  
> **날짜**: 2026-01-10  
> **상태**: ✅ 아키텍처 완료, 마이그레이션 대기

---

## 📋 요약

확장 가능한 구독 모델 아키텍처 구현 완료. 환경 변수 하나만 변경하면 테스트 모드 → 프로덕션 모드로 전환 가능.

### 구현 내용

1. ✅ **구독 기능 접근 제어 유틸리티** (`src/core/utils/subscription.ts`)
   - 테스트 모드 / 프로덕션 모드 분리
   - Tier별 기능 접근 권한 정의
   - 환경 변수로 모드 전환 (`VITE_BIZ_MODE`)

2. ✅ **구독 상수 정의** (`src/core/constants/subscription.ts`)
   - 가격 정보 (basic: $4.99/월, premium: $9.99/월)
   - 기능 비교표
   - Tier 타입

3. ✅ **React Hook** (`src/core/hooks/useSubscription.ts`)
   - 사용자 구독 정보 조회
   - 기능 접근 권한 확인
   - 실시간 구독 상태 관리

---

## 🔄 모드 전환 방법

### 테스트 모드 (현재)
```env
# .env
VITE_BIZ_MODE=testing
```

**Tier 구조**:
- `anonymous`: 비인증 사용자 (기본 기능만, 제한 없음)
- `free`: 인증 무료 사용자 (해석, 통계 제공, 제한 없음)
- `premium`: 프리미엄 사용자 (모든 기능, 제한 없음)

### 프로덕션 모드 (수익화)
```env
# .env
VITE_BIZ_MODE=production
```

**Tier 구조**:
- `anonymous`: 비인증 사용자 (일일 5개 제한)
- `basic`: 기본 구독자 $4.99/월 (일일 20개 제한, 해석/통계 제공)
- `premium`: 프리미엄 구독자 $9.99/월 (무제한, 모든 기능)

---

## 📊 Tier별 기능 비교

### 테스트 모드 (Testing)

| 기능 | anonymous | free | premium |
|:---|:---:|:---:|:---:|
| 문제 생성 및 풀이 | ✅ | ✅ | ✅ |
| 지문 해석 (모국어) | ❌ | ✅ | ✅ |
| 어휘 뜻 풀이 | ❌ | ✅ | ✅ |
| AI 기반 설명 | ❌ | ❌ | ✅ |
| 풀이 기록 저장 | ❌ | ✅ | ✅ |
| 통계 추적 | ❌ | ✅ | ✅ |
| 고급 통계 | ❌ | ❌ | ✅ |
| 복습 스케줄 | ❌ | ✅ | ✅ |
| 오답 노트 | ❌ | ✅ | ✅ |
| 스트릭/업적 | ❌ | ✅ | ✅ |
| 일일 제한 | 없음 | 없음 | 없음 |

### 프로덕션 모드 (Production)

| 기능 | anonymous | basic | premium |
|:---|:---:|:---:|:---:|
| 문제 생성 및 풀이 | ✅ (5개/일) | ✅ (20개/일) | ✅ (무제한) |
| 지문 해석 (모국어) | ❌ | ✅ | ✅ |
| 어휘 뜻 풀이 | ❌ | ✅ | ✅ |
| AI 기반 설명 | ❌ | ❌ | ✅ |
| 풀이 기록 저장 | ❌ | ✅ | ✅ |
| 통계 추적 | ❌ | ✅ | ✅ |
| 고급 통계 | ❌ | ❌ | ✅ |
| 복습 스케줄 | ❌ | ✅ | ✅ |
| 오답 노트 | ❌ | ✅ | ✅ |
| 스트릭/업적 | ❌ | ✅ | ✅ |
| 맞춤형 학습 경로 | ❌ | ❌ | ✅ |
| AI 약점 분석 | ❌ | ❌ | ✅ |

---

## 💻 사용 방법

### 1. Hook 사용 (React 컴포넌트)

```typescript
import { useSubscription } from '@/core/hooks/useSubscription';

function MyComponent() {
  const { 
    tier,              // 현재 tier: 'anonymous' | 'free' | 'basic' | 'premium'
    access,            // 기능 접근 권한 객체
    isLoading,         // 로딩 상태
    hasFeature,        // 기능 접근 확인 함수
    isPremium,         // 편의성 체크
    isAuthenticated,   // 인증 여부
  } = useSubscription();

  if (isLoading) return <Loading />;

  // 기능별 조건부 렌더링
  return (
    <div>
      {hasFeature('translation') && (
        <TranslationPanel />
      )}
      
      {hasFeature('aiExplanation') && (
        <AIExplanation />
      )}
      
      {!isAuthenticated && (
        <SignUpPrompt />
      )}
    </div>
  );
}
```

### 2. 직접 유틸리티 함수 사용

```typescript
import { 
  getFeatureAccess, 
  hasFeature, 
  normalizeTier,
  type SubscriptionTier 
} from '@/core/utils/subscription';

// Tier로 기능 접근 확인
const tier: SubscriptionTier = 'free';
const access = getFeatureAccess(tier);

if (hasFeature(tier, 'translation')) {
  // 해석 기능 제공
}

// DB에서 가져온 tier 정규화 (마이그레이션 호환)
const dbTier = 'free'; // 또는 null/undefined
const normalized = normalizeTier(dbTier); // 'free' or 'basic' (모드에 따라)
```

---

## 🗄️ 데이터베이스 마이그레이션 (수익화 전환 시)

### Step 1: 기존 'free' 사용자 처리

테스트 기간 동안 생성된 `subscription_tier = 'free'` 사용자를 `'basic'`으로 업그레이드하거나 유지.

**옵션 A: 모든 free 사용자를 basic으로 업그레이드 (추천)**
```sql
-- 기존 free 사용자를 basic으로 업그레이드
UPDATE user_profiles
SET subscription_tier = 'basic'
WHERE subscription_tier = 'free'
  AND subscription_expires_at IS NULL;

-- 기존 free 사용자에게 1개월 무료 체험 제공
UPDATE user_profiles
SET 
  subscription_tier = 'basic',
  subscription_expires_at = NOW() + INTERVAL '30 days'
WHERE subscription_tier = 'free'
  AND subscription_expires_at IS NULL;
```

**옵션 B: free 유지 (코드에서 normalizeTier가 처리)**
- `normalizeTier('free')`가 프로덕션 모드에서 자동으로 `'basic'`으로 변환
- 별도 마이그레이션 불필요 (하지만 명확성을 위해 옵션 A 추천)

### Step 2: subscriptions 테이블 생성 (아직 없다면)

```sql
-- subscriptions 테이블이 없다면 생성
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL,                 -- 'basic', 'premium'
  status TEXT NOT NULL,               -- 'active', 'canceled', 'expired', 'past_due'
  provider TEXT,                      -- 'stripe', 'paddle', 'apple', 'google'
  provider_subscription_id TEXT,      -- 외부 결제사 ID
  provider_customer_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions (status);

-- user_profiles와 subscriptions 동기화 함수 (향후 사용)
CREATE OR REPLACE FUNCTION sync_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles
  SET 
    subscription_tier = NEW.tier,
    subscription_expires_at = NEW.current_period_end
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_subscription_to_profile
AFTER INSERT OR UPDATE ON subscriptions
FOR EACH ROW
WHEN (NEW.status = 'active')
EXECUTE FUNCTION sync_user_subscription();
```

### Step 3: user_usage_limits 테이블 준비 (일일 제한 추적)

```sql
-- user_usage_limits 테이블이 없다면 생성
CREATE TABLE IF NOT EXISTS user_usage_limits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_exercises_used INT DEFAULT 0,
  daily_exercises_limit INT DEFAULT 10,   -- 기본값 (tier에 따라 업데이트)
  daily_ai_generations_used INT DEFAULT 0,
  monthly_ai_generations_used INT DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE
);

-- 매일 자정 리셋 트리거 (cron job 또는 Edge Function에서 처리)
-- 또는 Supabase Cron Jobs 사용
```

---

## 🔐 환경 변수 설정

### `.env.local` (로컬 개발)

```env
# 비즈니스 모드: 'testing' (기본값) 또는 'production'
VITE_BIZ_MODE=testing

# Supabase (기존)
VITE_SUPABASE_URL=https://qnqfarulquicshnwfaxi.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Vercel / 프로덕션 배포

**테스트 모드 (현재)**:
```bash
VITE_BIZ_MODE=testing
```

**프로덕션 모드 (수익화)**:
```bash
VITE_BIZ_MODE=production
```

---

## ✅ 체크리스트 (수익화 전환 전)

### 필수 사항
- [ ] `.env`에 `VITE_BIZ_MODE=production` 설정
- [ ] 기존 `free` 사용자 마이그레이션 SQL 실행
- [ ] `subscriptions` 테이블 생성 및 RLS 설정
- [ ] `user_usage_limits` 테이블 생성 및 리셋 로직 구현
- [ ] Stripe/Paddle 등 결제 프로바이더 연동
- [ ] 구독 플랜 UI 구현 (가격표, 결제 버튼)

### 권장 사항
- [ ] 무료 체험 기간 프로모션 (1개월 free trial)
- [ ] 기존 사용자 이메일 알림 (구독 전환 안내)
- [ ] 사용량 모니터링 대시보드
- [ ] 결제 실패 시 재시도 로직
- [ ] 환불 정책 문서화

---

## 🎨 UI 컴포넌트 예시 (향후 구현)

### PricingPage.tsx (구독 플랜 페이지)

```typescript
import { useSubscription } from '@/core/hooks/useSubscription';
import { SUBSCRIPTION_PRICING, SUBSCRIPTION_FEATURES } from '@/core/constants/subscription';

export function PricingPage() {
  const { tier, isPremium, isBasic } = useSubscription();

  return (
    <div className="pricing-grid">
      <PricingCard
        name="Basic"
        price={SUBSCRIPTION_PRICING.basic.monthly / 100}
        features={SUBSCRIPTION_FEATURES.basic}
        currentTier={tier === 'basic'}
        disabled={isPremium} // Premium은 Basic 다운그레이드 불가
      />
      <PricingCard
        name="Premium"
        price={SUBSCRIPTION_PRICING.premium.monthly / 100}
        features={SUBSCRIPTION_FEATURES.premium}
        currentTier={tier === 'premium'}
        recommended
      />
    </div>
  );
}
```

### FeatureGate.tsx (기능 제한 컴포넌트)

```typescript
import { useSubscription } from '@/core/hooks/useSubscription';

interface FeatureGateProps {
  feature: keyof FeatureAccess;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function FeatureGate({ feature, fallback, children }: FeatureGateProps) {
  const { hasFeature } = useSubscription();

  if (!hasFeature(feature)) {
    return fallback || <UpgradePrompt feature={feature} />;
  }

  return <>{children}</>;
}

// 사용 예시
<FeatureGate feature="translation" fallback={<SignUpPrompt />}>
  <TranslationPanel />
</FeatureGate>
```

---

## 📈 예상 비즈니스 영향

### 전환 전 (Testing)
- 모든 인증 사용자에게 무료로 모든 기능 제공
- 사용자 확보 및 피드백 수집
- 제품-시장 적합성 검증

### 전환 후 (Production)
- **익명 사용자**: 일일 5개 제한 → 구독 유도
- **Basic 구독자 ($4.99/월)**: 일일 20개 + 해석/통계 → 충분한 가치 제공
- **Premium 구독자 ($9.99/월)**: 무제한 + 모든 기능 → 최고 경험

**예상 전환율**:
- 익명 → Basic: 5-10%
- Basic → Premium: 15-25%
- 무료 → 구독: 전체 활성 사용자의 8-15%

---

## 🔗 관련 문서

- [Optional Authentication Pattern](./2026-01-10-optional-auth-pattern.md)
- [Database Schema](../architecture/database-schema.md)
- [Project Status](../project-status.md)

---

## 📝 변경 이력

- **2026-01-10**: 초기 문서 작성, 구독 모델 아키텍처 구현 완료
