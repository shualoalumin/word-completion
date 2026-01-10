/**
 * Subscription & Feature Access Control
 * 
 * 확장 가능한 구독 모델 아키텍처
 * - 테스트 기간: anonymous, free, premium
 * - 수익화 모델: anonymous (무료), basic (기본 구독), premium (프리미엄 구독)
 * 
 * 환경 변수 VITE_BIZ_MODE로 모드 전환 가능
 */

export type SubscriptionTier = 
  | 'anonymous'   // 비인증 사용자
  | 'free'        // 테스트 기간: 인증 무료, 수익화 후: 사용 안 함
  | 'basic'       // 수익화 후: 기본 구독 ($4.99/월)
  | 'premium'     // 수익화 후: 프리미엄 구독 ($9.99/월)
  | 'enterprise'; // 향후: 기업용

export interface FeatureAccess {
  // 콘텐츠 기능
  translation: boolean;      // 지문 해석 (모국어별)
  vocabulary: boolean;       // 어휘 뜻 풀이 (모국어별)
  aiExplanation: boolean;    // AI 기반 문맥 설명
  
  // 학습 기능
  history: boolean;          // 풀이 기록 저장
  stats: boolean;            // 통계 추적
  advancedStats: boolean;    // 고급 통계 (AI 분석)
  reviewQueue: boolean;      // 복습 스케줄
  bookmarks: boolean;        // 오답 노트
  vocabularyBook: boolean;   // 개인 단어장
  
  // 게이미피케이션
  streaks: boolean;          // 스트릭 시스템
  achievements: boolean;     // 업적/뱃지
  leaderboard: boolean;      // 리더보드
  
  // 사용량
  dailyLimit: number;        // 일일 문제 제한 (0 = 무제한)
  unlimited: boolean;        // 무제한 문제 생성
  aiAnalysis: boolean;       // AI 기반 약점 분석
  customPath: boolean;       // 맞춤형 학습 경로
}

// 테스트 기간 설정
const TESTING_MODE: Record<SubscriptionTier, FeatureAccess> = {
  anonymous: {
    translation: false,
    vocabulary: false,
    aiExplanation: false,
    history: false,
    stats: false,
    advancedStats: false,
    reviewQueue: false,
    bookmarks: false,
    vocabularyBook: false,
    streaks: false,
    achievements: false,
    leaderboard: false,
    dailyLimit: 0, // 제한 없음 (Demo)
    unlimited: false,
    aiAnalysis: false,
    customPath: false,
  },
  free: {
    // 테스트 기간: 인증 무료 사용자는 해석, 통계 제공
    translation: true,
    vocabulary: true,
    aiExplanation: false,
    history: true,
    stats: true,
    advancedStats: false,
    reviewQueue: true,
    bookmarks: true,
    vocabularyBook: true,
    streaks: true,
    achievements: true,
    leaderboard: true,
    dailyLimit: 0, // 테스트 기간: 제한 없음
    unlimited: false,
    aiAnalysis: false,
    customPath: false,
  },
  premium: {
    // 테스트 기간: 프리미엄 사용자
    translation: true,
    vocabulary: true,
    aiExplanation: true,
    history: true,
    stats: true,
    advancedStats: true,
    reviewQueue: true,
    bookmarks: true,
    vocabularyBook: true,
    streaks: true,
    achievements: true,
    leaderboard: true,
    dailyLimit: 0,
    unlimited: true,
    aiAnalysis: true,
    customPath: true,
  },
  basic: {
    // 수익화 모델: 기본 구독자 (테스트 기간에는 사용 안 함)
    translation: true,
    vocabulary: true,
    aiExplanation: false,
    history: true,
    stats: true,
    advancedStats: false,
    reviewQueue: true,
    bookmarks: true,
    vocabularyBook: true,
    streaks: true,
    achievements: true,
    leaderboard: true,
    dailyLimit: 20, // 일일 20개 제한
    unlimited: false,
    aiAnalysis: false,
    customPath: false,
  },
  enterprise: {
    // 향후: 기업용 (모든 기능 + 커스터마이징)
    translation: true,
    vocabulary: true,
    aiExplanation: true,
    history: true,
    stats: true,
    advancedStats: true,
    reviewQueue: true,
    bookmarks: true,
    vocabularyBook: true,
    streaks: true,
    achievements: true,
    leaderboard: true,
    dailyLimit: 0,
    unlimited: true,
    aiAnalysis: true,
    customPath: true,
  },
};

// 수익화 모델 설정 (프로덕션)
const PRODUCTION_MODE: Record<SubscriptionTier, FeatureAccess> = {
  anonymous: {
    // 수익화 후: 비인증 사용자는 기본 기능만
    translation: false,
    vocabulary: false,
    aiExplanation: false,
    history: false,
    stats: false,
    advancedStats: false,
    reviewQueue: false,
    bookmarks: false,
    vocabularyBook: false,
    streaks: false,
    achievements: false,
    leaderboard: false,
    dailyLimit: 5, // 일일 5개 제한
    unlimited: false,
    aiAnalysis: false,
    customPath: false,
  },
  free: {
    // 수익화 모델에서는 'free' tier는 사용 안 함
    // 기존 free 사용자는 basic으로 마이그레이션
    translation: false,
    vocabulary: false,
    aiExplanation: false,
    history: false,
    stats: false,
    advancedStats: false,
    reviewQueue: false,
    bookmarks: false,
    vocabularyBook: false,
    streaks: false,
    achievements: false,
    leaderboard: false,
    dailyLimit: 0,
    unlimited: false,
    aiAnalysis: false,
    customPath: false,
  },
  basic: {
    // 수익화 모델: 기본 구독 ($4.99/월)
    translation: true,
    vocabulary: true,
    aiExplanation: false,
    history: true,
    stats: true,
    advancedStats: false,
    reviewQueue: true,
    bookmarks: true,
    vocabularyBook: true,
    streaks: true,
    achievements: true,
    leaderboard: true,
    dailyLimit: 20, // 일일 20개 제한
    unlimited: false,
    aiAnalysis: false,
    customPath: false,
  },
  premium: {
    // 수익화 모델: 프리미엄 구독 ($9.99/월)
    translation: true,
    vocabulary: true,
    aiExplanation: true,
    history: true,
    stats: true,
    advancedStats: true,
    reviewQueue: true,
    bookmarks: true,
    vocabularyBook: true,
    streaks: true,
    achievements: true,
    leaderboard: true,
    dailyLimit: 0, // 무제한
    unlimited: true,
    aiAnalysis: true,
    customPath: true,
  },
  enterprise: {
    translation: true,
    vocabulary: true,
    aiExplanation: true,
    history: true,
    stats: true,
    advancedStats: true,
    reviewQueue: true,
    bookmarks: true,
    vocabularyBook: true,
    streaks: true,
    achievements: true,
    leaderboard: true,
    dailyLimit: 0,
    unlimited: true,
    aiAnalysis: true,
    customPath: true,
  },
};

/**
 * Get feature access based on subscription tier
 * 
 * @param tier - Subscription tier
 * @returns Feature access configuration
 */
export function getFeatureAccess(tier: SubscriptionTier): FeatureAccess {
  // 환경 변수로 비즈니스 모드 확인
  const bizMode = import.meta.env.VITE_BIZ_MODE || 'testing';
  const mode = bizMode === 'production' ? PRODUCTION_MODE : TESTING_MODE;
  
  return mode[tier] || mode.anonymous;
}

/**
 * Check if user has access to a specific feature
 * 
 * @param tier - Subscription tier
 * @param feature - Feature name (key of FeatureAccess)
 * @returns true if user has access
 */
export function hasFeature(
  tier: SubscriptionTier, 
  feature: keyof FeatureAccess
): boolean {
  const access = getFeatureAccess(tier);
  return access[feature] === true || (feature === 'dailyLimit' && access.dailyLimit > 0);
}

/**
 * Get daily exercise limit for a tier
 * 
 * @param tier - Subscription tier
 * @returns Daily limit (0 = unlimited)
 */
export function getDailyLimit(tier: SubscriptionTier): number {
  const access = getFeatureAccess(tier);
  return access.dailyLimit;
}

/**
 * Normalize subscription tier from database
 * Handles migration from 'free' to 'basic' seamlessly
 * 
 * @param dbTier - Tier from database (can be 'free' in testing, 'basic'/'premium' in production)
 * @returns Normalized tier
 */
export function normalizeTier(dbTier: string | null | undefined): SubscriptionTier {
  if (!dbTier) return 'anonymous';
  
  const tier = dbTier.toLowerCase();
  
  // 테스트 기간: 'free' 허용
  // 수익화 모델: 'free'는 'basic'으로 처리 (마이그레이션 호환성)
  const bizMode = import.meta.env.VITE_BIZ_MODE || 'testing';
  
  if (bizMode === 'production' && tier === 'free') {
    // 프로덕션에서는 'free'를 'basic'으로 처리
    // (마이그레이션된 사용자)
    return 'basic';
  }
  
  // 유효한 tier인지 확인
  const validTiers: SubscriptionTier[] = ['anonymous', 'free', 'basic', 'premium', 'enterprise'];
  return validTiers.includes(tier as SubscriptionTier) ? (tier as SubscriptionTier) : 'anonymous';
}

/**
 * Check if tier allows unlimited exercises
 * 
 * @param tier - Subscription tier
 * @returns true if unlimited
 */
export function isUnlimited(tier: SubscriptionTier): boolean {
  const access = getFeatureAccess(tier);
  return access.unlimited || access.dailyLimit === 0;
}
