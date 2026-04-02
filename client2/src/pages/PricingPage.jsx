// src/pages/PricingPage.jsx — Subscription pricing with Stripe Checkout
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useEntitlements } from '../contexts/EntitlementsContext';
import API from '../config/api';
import { Crown, Check, Zap, BookOpen, Brain, Sparkles, MessageSquare, StickyNote, Target } from 'lucide-react';
import './PricingPage.css';

const PLANS = [
  { id: 'monthly', price: '$4.99', period: '/month', label: 'Monthly', description: 'Cancel anytime' },
  { id: 'annual', price: '$39.99', period: '/year', label: 'Annual', description: 'Save 33%', popular: true },
  { id: 'lifetime', price: '$79.99', period: '', label: 'Lifetime', description: 'Pay once, yours forever' },
];

const FEATURES = [
  { name: 'Library management', free: true, pro: true, icon: BookOpen },
  { name: 'Reading progress tracking', free: true, pro: true, icon: Target },
  { name: 'Notes & highlights', free: true, pro: true, icon: StickyNote },
  { name: 'Gamification & achievements', free: true, pro: true, icon: Zap },
  { name: 'Chrome extension', free: true, pro: true, icon: Sparkles },
  { name: 'AI book recommendations', free: '5/month', pro: 'Unlimited', icon: BookOpen },
  { name: 'Mentor AI discussions', free: '5/month', pro: 'Unlimited', icon: MessageSquare },
  { name: 'Mentor AI quizzes', free: '5/month', pro: 'Unlimited', icon: Brain },
  { name: 'AI note enhancement', free: '5/month', pro: 'Unlimited', icon: Sparkles },
  { name: 'Smart Reading Queue', free: '5/month', pro: 'Unlimited', icon: Target },
];

export default function PricingPage() {
  const { isPremium, refreshSubscription } = useEntitlements();
  const [searchParams, setSearchParams] = useSearchParams();
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const verifiedRef = useRef(false);

  // Handle return from Stripe Checkout (runs once)
  useEffect(() => {
    if (verifiedRef.current) return;

    const sessionId = searchParams.get('session_id');
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success && sessionId) {
      verifiedRef.current = true;
      // Clean URL params immediately
      setSearchParams({}, { replace: true });

      (async () => {
        try {
          await API.post('/api/subscription/verify-session', { sessionId });
          setSuccessMessage('Welcome to ShelfQuest Pro! Your subscription is now active.');
        } catch {
          setSuccessMessage('Payment received! Your Pro features are activating...');
        }
        try { await refreshSubscription(); } catch {}
      })();
    } else if (canceled) {
      verifiedRef.current = true;
      setErrorMessage('Checkout was canceled. No charges were made.');
      setSearchParams({}, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectPlan = async (planId) => {
    setCheckoutLoading(planId);
    setErrorMessage('');
    try {
      const { data } = await API.post('/api/subscription/create-checkout', { plan: planId });
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setErrorMessage(data.error || data.message || 'Unable to start checkout.');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.error || 'Failed to start checkout. Please try again.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="pricing-page">
      <div className="pricing-page__header">
        <Crown size={28} />
        <h1>ShelfQuest Pro</h1>
        <p className="pricing-page__subtitle">
          Unlock unlimited AI-powered reading features
        </p>
      </div>

      {successMessage && (
        <div className="pricing-page__active">
          <Check size={16} />
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="pricing-page__error">
          {errorMessage}
        </div>
      )}

      {isPremium && !successMessage && (
        <div className="pricing-page__active">
          <Check size={16} />
          You're on the Pro plan
        </div>
      )}

      {/* Plan cards */}
      <div className="pricing-page__plans">
        {PLANS.map(plan => (
          <div key={plan.id} className={`pricing-card ${plan.popular ? 'pricing-card--popular' : ''}`}>
            {plan.popular && <span className="pricing-card__badge">Most Popular</span>}
            <h3 className="pricing-card__label">{plan.label}</h3>
            <div className="pricing-card__price-row">
              <span className="pricing-card__price">{plan.price}</span>
              {plan.period && <span className="pricing-card__period">{plan.period}</span>}
            </div>
            <p className="pricing-card__desc">{plan.description}</p>
            <button
              className="pricing-card__cta"
              onClick={() => handleSelectPlan(plan.id)}
              disabled={isPremium || checkoutLoading !== null}
            >
              {isPremium
                ? 'Current Plan'
                : checkoutLoading === plan.id
                  ? 'Redirecting...'
                  : 'Get Pro'}
            </button>
          </div>
        ))}
      </div>

      {/* Feature comparison */}
      <div className="pricing-page__comparison">
        <h2>Free vs Pro</h2>
        <div className="pricing-table">
          <div className="pricing-table__header">
            <div className="pricing-table__feature-col">Feature</div>
            <div className="pricing-table__tier-col">Free</div>
            <div className="pricing-table__tier-col pricing-table__tier-col--pro">Pro</div>
          </div>
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="pricing-table__row">
                <div className="pricing-table__feature-col">
                  <Icon size={14} />
                  {f.name}
                </div>
                <div className="pricing-table__tier-col">
                  {f.free === true ? <Check size={16} className="pricing-check" /> : f.free}
                </div>
                <div className="pricing-table__tier-col pricing-table__tier-col--pro">
                  {f.pro === true ? <Check size={16} className="pricing-check" /> : f.pro}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="pricing-page__note">
        All AI features share a pool of 5 free calls per month.
        Pro unlocks unlimited usage across all AI features.
      </p>
    </div>
  );
}
