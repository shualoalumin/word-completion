/**
 * useSubscription Hook
 * 
 * 사용자 구독 정보 및 기능 접근 권한 관리
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { SubscriptionTier, FeatureAccess } from '@/core/utils/subscription';
import { 
  getFeatureAccess, 
  hasFeature, 
  normalizeTier,
  getDailyLimit,
  isUnlimited 
} from '@/core/utils/subscription';

interface SubscriptionData {
  tier: SubscriptionTier;
  access: FeatureAccess;
  expiresAt: Date | null;
  isLoading: boolean;
}

/**
 * Get user's subscription tier from database
 */
async function fetchUserTier(userId: string): Promise<SubscriptionTier> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Failed to fetch user tier:', error);
      return 'anonymous';
    }

    return normalizeTier(data?.subscription_tier);
  } catch (error) {
    console.error('Error fetching user tier:', error);
    return 'anonymous';
  }
}

/**
 * Hook to get current user's subscription information and feature access
 * 
 * @returns Subscription data and helper functions
 */
export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData>({
    tier: 'anonymous',
    access: getFeatureAccess('anonymous'),
    expiresAt: null,
    isLoading: true,
  });

  useEffect(() => {
    async function loadSubscription() {
      if (!user) {
        // 비인증 사용자
        setSubscription({
          tier: 'anonymous',
          access: getFeatureAccess('anonymous'),
          expiresAt: null,
          isLoading: false,
        });
        return;
      }

      // 인증된 사용자: DB에서 tier 조회
      const tier = await fetchUserTier(user.id);
      const access = getFeatureAccess(tier);

      // subscription_expires_at도 조회 (향후 사용)
      let expiresAt: Date | null = null;
      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('subscription_expires_at')
          .eq('id', user.id)
          .single();
        
        if (data?.subscription_expires_at) {
          expiresAt = new Date(data.subscription_expires_at);
        }
      } catch (error) {
        console.error('Error fetching subscription expiry:', error);
      }

      setSubscription({
        tier,
        access,
        expiresAt,
        isLoading: false,
      });
    }

    loadSubscription();
  }, [user]);

  return {
    ...subscription,
    // Helper functions
    hasFeature: (feature: keyof FeatureAccess) => hasFeature(subscription.tier, feature),
    getDailyLimit: () => getDailyLimit(subscription.tier),
    isUnlimited: () => isUnlimited(subscription.tier),
    // Convenience checks
    isAnonymous: subscription.tier === 'anonymous',
    isFree: subscription.tier === 'free',
    isBasic: subscription.tier === 'basic',
    isPremium: subscription.tier === 'premium',
    isEnterprise: subscription.tier === 'enterprise',
    isAuthenticated: !!user,
  };
}
