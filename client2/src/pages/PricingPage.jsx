// src/pages/PricingPage.jsx — Subscription pricing with feature comparison
import React from 'react';
import { useEntitlements } from '../contexts/EntitlementsContext';
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
  const { isPremium, tier } = useEntitlements();

  const handleSelectPlan = async (planId) => {
    // TODO: Integrate with Stripe Checkout
    alert(`Payment integration coming soon! Selected plan: ${planId}`);
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

      {isPremium && (
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
              disabled={isPremium}
            >
              {isPremium ? 'Current Plan' : 'Get Pro'}
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
