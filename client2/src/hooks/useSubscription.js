// src/hooks/useSubscription.js — Fetches subscription status from server
import { useState, useEffect, useCallback } from 'react';
import API from '../config/api';

export function useSubscription() {
  const [status, setStatus] = useState({
    tier: 'free',
    expiresAt: null,
    isProUser: false,
    aiUsage: { used: 0, limit: 5 },
    pricing: null,
    loading: true,
    error: null,
  });

  const fetchStatus = useCallback(async () => {
    try {
      const response = await API.get('/api/subscription/status');
      setStatus({
        ...response.data,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.warn('Failed to fetch subscription status:', error);
      setStatus(prev => ({ ...prev, loading: false, error: error.message }));
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const isProUser = status.isProUser;
  const aiUsage = status.aiUsage || { used: 0, limit: 5 };

  return {
    tier: status.tier,
    isProUser,
    expiresAt: status.expiresAt,
    aiUsage,
    pricing: status.pricing,
    loading: status.loading,
    canUseAI: isProUser || (aiUsage.used < (aiUsage.limit || 5)),
    aiRemaining: isProUser ? Infinity : Math.max(0, (aiUsage.limit || 5) - aiUsage.used),
    refresh: fetchStatus,
  };
}

export default useSubscription;
