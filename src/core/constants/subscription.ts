/**
 * Subscription Model Constants
 * 
 * 비즈니스 모델 전환을 위한 구독 관련 상수
 */

export const SUBSCRIPTION_TIERS = {
  ANONYMOUS: 'anonymous',
  FREE: 'free',        // 테스트 기간만
  BASIC: 'basic',      // 수익화 후: 기본 구독
  PREMIUM: 'premium',  // 수익화 후: 프리미엄 구독
  ENTERPRISE: 'enterprise',
} as const;

export const SUBSCRIPTION_PRICING = {
  basic: {
    monthly: 499,      // $4.99/월 (cent 단위)
    yearly: 4990,      // $49.90/년 (월 $4.16, 30% 할인)
    currency: 'USD',
  },
  premium: {
    monthly: 999,      // $9.99/월
    yearly: 9990,      // $99.90/년 (월 $8.33, 30% 할인)
    currency: 'USD',
  },
} as const;

export const SUBSCRIPTION_FEATURES = {
  basic: [
    '모국어별 지문 해석',
    '주요 어휘 뜻 풀이 (상위 10개)',
    '기본 통계 (일일, 주간)',
    '풀이 기록 저장',
    '스트릭 시스템',
    '오답 노트',
    '일일 20개 문제 제한',
  ],
  premium: [
    '기본 구독 기능 모두 포함',
    '무제한 문제 생성',
    '고급 해석 (문장 구조 분석)',
    '상세 어휘 풀이 (예문, 동의어, 반의어)',
    'AI 기반 약점 진단',
    '맞춤형 학습 경로 추천',
    '고급 통계 (성장 곡선, 토픽별 심층 분석)',
    '오디오 발음 제공',
    '우선 고객 지원',
    '광고 제거',
  ],
} as const;

export const BUSINESS_MODE = {
  TESTING: 'testing',      // 테스트 기간 (현재)
  PRODUCTION: 'production', // 수익화 모델 (확장 후)
} as const;
