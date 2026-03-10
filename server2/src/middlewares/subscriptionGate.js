// src/middlewares/subscriptionGate.js
// Gates AI endpoints by subscription tier + monthly usage limits.
// Free users get 5 AI calls/month; Pro users get unlimited.
import { supabase } from '../config/supabaseClient.js';

const FREE_MONTHLY_LIMIT = 5;

function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function subscriptionGate() {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Fetch user subscription tier
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('subscription_tier, subscription_expires_at')
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        console.error('subscriptionGate: failed to fetch user tier', userError);
        // Fail open — don't block AI on DB issues
        return next();
      }

      const tier = userData.subscription_tier || 'free';
      const expiresAt = userData.subscription_expires_at;

      // Pro user — check expiry (lifetime users have null expiresAt)
      if (tier === 'pro') {
        if (!expiresAt || new Date(expiresAt) > new Date()) {
          req.subscriptionTier = 'pro';
          return next();
        }
        console.warn(`⚠️ Pro subscription expired for user ${userId}`);
      }

      // Free user — check and increment monthly usage
      const month = getCurrentMonth();

      // Read current count
      const { data: existing } = await supabase
        .from('ai_usage')
        .select('call_count')
        .eq('user_id', userId)
        .eq('month', month)
        .single();

      const currentCount = existing?.call_count || 0;

      // Check limit BEFORE incrementing
      if (currentCount >= FREE_MONTHLY_LIMIT) {
        return res.status(403).json({
          error: 'Monthly AI limit reached. Upgrade to Pro for unlimited AI features.',
          upgradeRequired: true,
          used: currentCount,
          limit: FREE_MONTHLY_LIMIT,
        });
      }

      // Increment (or create row)
      if (existing) {
        await supabase
          .from('ai_usage')
          .update({ call_count: currentCount + 1 })
          .eq('user_id', userId)
          .eq('month', month);
      } else {
        await supabase
          .from('ai_usage')
          .insert({ user_id: userId, month, call_count: 1 });
      }

      req.subscriptionTier = 'free';
      req.aiUsage = { used: currentCount + 1, limit: FREE_MONTHLY_LIMIT };
      next();
    } catch (error) {
      console.error('subscriptionGate error:', error);
      // Fail open — don't block AI on unexpected errors
      next();
    }
  };
}
