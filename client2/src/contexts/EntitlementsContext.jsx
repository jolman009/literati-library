import React, { createContext, useContext, useMemo, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSubscription } from '../hooks/useSubscription';

/**
 * Entitlements context backed by server subscription status.
 * Free users get 5 AI calls/month; Pro users get unlimited.
 * Supports a localStorage override for testing/review.
 */
const EntitlementsContext = createContext(null);

export const useEntitlements = () => {
  const ctx = useContext(EntitlementsContext);
  if (!ctx) throw new Error('useEntitlements must be used within EntitlementsProvider');
  return ctx;
};

const OVERRIDE_KEY = 'sq_premium_override';

export const EntitlementsProvider = ({ children }) => {
  const { user } = useAuth();
  const [override, setOverride] = useState(null);
  const subscription = useSubscription();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(OVERRIDE_KEY);
      if (raw != null) setOverride(/^(1|true|yes)$/i.test(String(raw)));
    } catch {
      // Silently ignore localStorage errors
    }
  }, []);

  const isPremium = useMemo(() => {
    if (override != null) return !!override;
    // Server-backed: subscription status is the source of truth
    if (!subscription.loading) return subscription.isProUser;
    // While loading, check user profile as fallback
    const u = user || {};
    return Boolean(
      u.subscription_tier === 'pro' ||
      u.isPremium ||
      u.plan === 'premium' ||
      u.subscription === 'premium'
    );
  }, [user, override, subscription.isProUser, subscription.loading]);

  const limits = useMemo(() => ({
    aiMonthlyQuota: isPremium ? Infinity : 5,
  }), [isPremium]);

  const setPremiumOverride = (val) => {
    try {
      if (val == null) {
        localStorage.removeItem(OVERRIDE_KEY);
        setOverride(null);
      } else {
        const v = !!val;
        localStorage.setItem(OVERRIDE_KEY, v ? '1' : '0');
        setOverride(v);
      }
    } catch {
      // Silently ignore localStorage errors
    }
  };

  const openPremiumModal = useCallback(() => {
    try {
      window.dispatchEvent(new CustomEvent('openPremiumModal'));
    } catch {
      // Silently ignore event dispatch errors
    }
  }, []);

  const value = useMemo(() => ({
    isPremium,
    limits,
    tier: subscription.tier,
    aiUsage: subscription.aiUsage,
    canUseAI: isPremium || subscription.canUseAI,
    aiRemaining: isPremium ? Infinity : subscription.aiRemaining,
    pricing: subscription.pricing,
    subscriptionLoading: subscription.loading,
    refreshSubscription: subscription.refresh,
    setPremiumOverride,
    openPremiumModal,
  }), [isPremium, limits, subscription, openPremiumModal]);

  return (
    <EntitlementsContext.Provider value={value}>
      {children}
    </EntitlementsContext.Provider>
  );
};

export default EntitlementsContext;
