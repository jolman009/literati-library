import React from 'react';
import GoPremiumCTA from '../components/premium/GoPremiumCTA';
import { useEntitlements } from '../contexts/EntitlementsContext';
import '../styles/premium-page.css';

const benefits = [
  'AI-powered summaries and contextual insights',
  'Advanced analytics, goals, streaks, and milestones',
  'Cross-device sync and secure cloud backup',
  'Full-text note search and export',
  'Priority processing and early access to features',
];

const faqs = [
  {
    q: 'What do I get with Premium?',
    a: 'Premium unlocks AI summaries/insights, advanced analytics and goals, cross-device sync and secure backup, full note search/export, and priority processing.',
  },
  {
    q: 'How much does it cost?',
    a: 'Premium is offered as a monthly or annual subscription. Typical pricing: $5.99/month or $39.99/year. Prices may vary by region and promotions.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes. Eligible new subscribers receive a free trial. You can cancel anytime during the trial to avoid charges.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Absolutely. Manage or cancel your subscription any time through the Google Play subscription settings on your device.',
  },
  {
    q: 'What happens if I cancel?',
    a: 'You keep access to free features. Premium features and higher AI quotas stop at the end of your current billing period.',
  },
  {
    q: 'How is my data handled?',
    a: 'We follow a privacy-first approach with secure sync and backups. See the Privacy Policy in the app for full details.',
  },
];

const PremiumPage = () => {
  const { isPremium } = useEntitlements();
  return (
    <div className="premium-page container">
      <header className="premium-hero">
        <div className="premium-hero-text">
          <h1 className="md-headline-medium premium-title">ShelfQuest Premium</h1>
          <p className="text-on-surface-variant premium-subtitle">Everything you need to read smarter.</p>
        </div>
        {!isPremium && (
          <div className="premium-hero-cta">
            <GoPremiumCTA size="large">Start Premium</GoPremiumCTA>
          </div>
        )}
      </header>

      <section className="premium-section premium-benefits">
        <h2 className="md-title-large section-title">Premium Benefits</h2>
        <ul className="benefits-grid">
          {benefits.map((b) => (
            <li key={b} className="benefit-item">
              <span className="material-symbols-outlined benefit-icon" aria-hidden>check_circle</span>
              <span className="md-body-medium">{b}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="premium-section premium-faq">
        <h2 className="md-title-large section-title">Frequently Asked Questions</h2>
        <div className="faq-list">
          {faqs.map(({ q, a }) => (
            <div key={q} className="faq-item">
              <div className="md-title-medium faq-q">{q}</div>
              <p className="md-body-medium text-on-surface-variant faq-a">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {!isPremium && (
        <section className="premium-section premium-final-cta">
          <div className="final-cta-content">
            <div>
              <div className="md-title-medium mb-1">Ready to unlock more?</div>
              <div className="md-body-medium text-on-surface-variant">AI insights, advanced analytics, sync, and more.</div>
            </div>
            <div className="final-cta-actions">
              <GoPremiumCTA size="large">Start Premium</GoPremiumCTA>
              <a className="md3-button md3-button--outlined" href="/settings">Manage Subscription</a>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default PremiumPage;
