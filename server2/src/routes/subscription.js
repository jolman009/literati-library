// src/routes/subscription.js — Subscription status, Stripe Checkout & webhook
import { Router } from 'express';
import Stripe from 'stripe';
import { supabase } from '../config/supabaseClient.js';

function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const FREE_MONTHLY_LIMIT = 5;

// Initialize Stripe (null if key not configured — graceful degradation)
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// Stripe Price IDs — set these in .env after creating products in Stripe Dashboard
const PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  annual: process.env.STRIPE_PRICE_ANNUAL,
  lifetime: process.env.STRIPE_PRICE_LIFETIME,
};

// Map plan to subscription duration for DB records
const PLAN_DURATIONS = {
  monthly: () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString();
  },
  annual: () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString();
  },
  lifetime: () => null, // null = never expires
};

/**
 * Activate a Pro subscription for a user after successful payment.
 */
async function activateSubscription(userId, plan, stripeSessionId) {
  const expiresAt = PLAN_DURATIONS[plan]();

  // Update user tier
  const { error: userError } = await supabase
    .from('users')
    .update({
      subscription_tier: 'pro',
      subscription_expires_at: expiresAt,
    })
    .eq('id', userId);

  if (userError) {
    console.error('Failed to update user subscription:', userError);
    throw userError;
  }

  // Record in subscription history
  const { error: historyError } = await supabase
    .from('subscription_history')
    .insert({
      user_id: userId,
      tier: 'pro',
      period_type: plan,
      started_at: new Date().toISOString(),
      expires_at: expiresAt,
      stripe_session_id: stripeSessionId,
    });

  if (historyError) {
    console.error('Failed to record subscription history:', historyError);
    // Non-fatal — subscription is active, just history insert failed
  }

  console.log(`✅ Subscription activated: user=${userId} plan=${plan} expires=${expiresAt || 'never'}`);
}

export function subscriptionRouter(authenticateToken) {
  const router = Router();

  // GET /api/subscription/status — current tier, AI usage, expiry
  router.get('/status', authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;

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

  // POST /api/subscription/create-checkout — create Stripe Checkout session
  router.post('/create-checkout', authenticateToken, async (req, res) => {
    try {
      const { plan } = req.body;
      const validPlans = ['monthly', 'annual', 'lifetime'];

      if (!plan || !validPlans.includes(plan)) {
        return res.status(400).json({ error: `Invalid plan. Choose: ${validPlans.join(', ')}` });
      }

      if (!stripe) {
        return res.status(503).json({
          error: 'Payment processing is not configured yet. Please try again later.',
        });
      }

      const priceId = PRICE_IDS[plan];
      if (!priceId) {
        return res.status(503).json({
          error: `Price for "${plan}" plan is not configured. Please contact support.`,
        });
      }

      const userId = req.user.id;

      // Fetch user email for Stripe
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();

      const clientUrl = process.env.CLIENT_URL || 'https://shelfquest.org';

      // Build Checkout session params
      const sessionParams = {
        mode: plan === 'lifetime' ? 'payment' : 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${clientUrl}/pricing?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `${clientUrl}/pricing?canceled=true`,
        client_reference_id: userId,
        metadata: { userId, plan },
      };

      // Pre-fill email if available
      if (user?.email) {
        sessionParams.customer_email = user.email;
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      res.json({
        checkoutUrl: session.url,
        sessionId: session.id,
      });
    } catch (error) {
      console.error('Create checkout error:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  });

  // POST /api/subscription/webhook — Stripe webhook handler
  // NOTE: This endpoint receives raw body (not JSON-parsed).
  // The raw body must be passed via express.raw() middleware mounted
  // BEFORE express.json() in server.js.
  router.post('/webhook', async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe not configured' });
    }

    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    // Handle relevant events
    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          const userId = session.client_reference_id || session.metadata?.userId;
          const plan = session.metadata?.plan;

          if (!userId || !plan) {
            console.error('Webhook: missing userId or plan in session metadata');
            break;
          }

          await activateSubscription(userId, plan, session.id);
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object;
          const userId = subscription.metadata?.userId;

          if (!userId) break;

          if (subscription.status === 'active') {
            // Subscription renewed — extend expiry
            const periodEnd = new Date(subscription.current_period_end * 1000);
            await supabase
              .from('users')
              .update({
                subscription_tier: 'pro',
                subscription_expires_at: periodEnd.toISOString(),
              })
              .eq('id', userId);
            console.log(`✅ Subscription renewed: user=${userId} until=${periodEnd.toISOString()}`);
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object;
          const userId = subscription.metadata?.userId;

          if (!userId) break;

          // Downgrade to free
          await supabase
            .from('users')
            .update({
              subscription_tier: 'free',
              subscription_expires_at: null,
            })
            .eq('id', userId);
          console.log(`⚠️ Subscription canceled: user=${userId} → free tier`);
          break;
        }

        default:
          // Unhandled event type — log but don't fail
          console.log(`Stripe webhook: unhandled event type ${event.type}`);
      }
    } catch (err) {
      console.error(`Webhook handler error for ${event.type}:`, err);
      // Return 200 anyway — Stripe retries on non-200, and we don't want loops
    }

    res.json({ received: true });
  });

  // POST /api/subscription/verify-session — verify a completed checkout
  router.post('/verify-session', authenticateToken, async (req, res) => {
    try {
      const { sessionId } = req.body;
      if (!sessionId || !stripe) {
        return res.status(400).json({ error: 'Invalid session' });
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status === 'paid' && session.client_reference_id === req.user.id) {
        // Double-check the subscription is activated (idempotent)
        const plan = session.metadata?.plan;
        if (plan) {
          await activateSubscription(req.user.id, plan, session.id);
        }
        res.json({ verified: true, plan });
      } else {
        res.json({ verified: false });
      }
    } catch (error) {
      console.error('Verify session error:', error);
      res.status(500).json({ error: 'Failed to verify session' });
    }
  });

  return router;
}
