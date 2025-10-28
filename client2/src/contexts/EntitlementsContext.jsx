import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

/**
 * Minimal entitlements context for gating premium features without
 * requiring backend changes. Derives isPremium from user profile and
 * allows a localStorage override for testing/review.
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(OVERRIDE_KEY);
      if (raw != null) setOverride(/^(1|true|yes)$/i.test(String(raw)));
    } catch {}
  }, []);

  const isPremium = useMemo(() => {
    if (override != null) return !!override;
    const u = user || {};
    return Boolean(
      u.isPremium ||
      u.plan === 'premium' ||
      u.subscription === 'premium' ||
      u?.entitlements?.premium === true
    );
  }, [user, override]);

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
    } catch {}
  };

  const openPremiumModal = () => {
    try {
      window.dispatchEvent(new CustomEvent('openPremiumModal'));
    } catch {}
  };

  const value = useMemo(() => ({
    isPremium,
    limits,
    setPremiumOverride,
    openPremiumModal,
  }), [isPremium, limits]);

  return (
    <EntitlementsContext.Provider value={value}>
      {children}
    </EntitlementsContext.Provider>
  );
};

export default EntitlementsContext;

