// src/routes/subscription.js — Subscription status & checkout endpoints
import { Router } from 'express';
import { supabase } from '../config/supabaseClient.js';

function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const FREE_MONTHLY_LIMIT = 5;

export function subscriptionRouter(authenticateToken) {
  const router = Router();

  // GET /api/subscription/status — current tier, AI usage, expiry
  router.get('/status', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;

      // Fetch tier
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('subscription_tier, subscription_expires_at')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const tier = user.subscription_tier || 'free';
      const expiresAt = user.subscription_expires_at;
      const isExpired = expiresAt && new Date(expiresAt) <= new Date();
      const effectiveTier = (tier === 'pro' && isExpired) ? 'free' : tier;

      // Fetch AI usage for current month
      const month = getCurrentMonth();
      const { data: usage } = await supabase
        .from('ai_usage')
        .select('call_count')
        .eq('user_id', userId)
        .eq('month', month)
        .single();

      const used = usage?.call_count || 0;
      const isProUser = effectiveTier === 'pro';

      res.json({
        tier: effectiveTier,
        expiresAt: isProUser ? expiresAt : null,
        isProUser,
        aiUsage: {
          used,
          limit: isProUser ? null : FREE_MONTHLY_LIMIT,
        },
        pricing: {
          monthly: { price: 4.99, period: 'month' },
          annual: { price: 39.99, period: 'year', savings: '33%' },
          lifetime: { price: 79.99, period: 'lifetime' },
        },
      });
    } catch (error) {
      console.error('Subscription status error:', error);
      res.status(500).json({ error: 'Failed to fetch subscription status' });
    }
  });

  // POST /api/subscription/create-checkout — Stripe checkout (placeholder)
  router.post('/create-checkout', authenticateToken, async (req, res) => {
    try {
      const { plan } = req.body;
      const validPlans = ['monthly', 'annual', 'lifetime'];

      if (!plan || !validPlans.includes(plan)) {
        return res.status(400).json({ error: `Invalid plan. Choose: ${validPlans.join(', ')}` });
      }

      // TODO: Integrate Stripe Checkout
      // For now, return a placeholder response
      res.json({
        message: 'Payment integration coming soon! For early access to Pro, contact support.',
        plan,
        checkoutUrl: null,
      });
    } catch (error) {
      console.error('Create checkout error:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

  // POST /api/subscription/webhook — Stripe webhook (placeholder)
  router.post('/webhook', async (req, res) => {
    // TODO: Validate Stripe webhook signature and process events
    // Events to handle: checkout.session.completed, customer.subscription.updated/deleted
    console.log('Subscription webhook received (placeholder)');
    res.json({ received: true });
  });

  return router;
}
