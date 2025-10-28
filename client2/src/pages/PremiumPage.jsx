import React from 'react';
import GoPremiumCTA from '../components/premium/GoPremiumCTA';
import { useEntitlements } from '../contexts/EntitlementsContext';

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
    <div className="container mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="md-headline-medium">ShelfQuest Premium</h1>
        <p className="text-on-surface-variant mt-2">Everything you need to read smarter.</p>
      </header>

      {!isPremium && (
        <div className="mb-6 bg-surface-container-high rounded-medium border border-outline-variant p-4 flex items-center justify-between gap-3">
          <div>
            <div className="md-title-medium mb-1">Unlock AI and advanced features</div>
            <div className="md-body-medium text-on-surface-variant">Start your Premium plan in seconds.</div>
          </div>
          <GoPremiumCTA size="large" />
        </div>
      )}

      <section className="mb-8 bg-surface-container rounded-medium border border-outline-variant p-4">
        <h2 className="md-title-large mb-3">Premium Benefits</h2>
        <ul className="md-body-medium list-disc pl-5 space-y-2">
          {benefits.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </section>

      <section className="mb-8 bg-surface-container rounded-medium border border-outline-variant p-4">
        <h2 className="md-title-large mb-3">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map(({ q, a }) => (
            <div key={q}>
              <div className="md-title-medium">{q}</div>
              <p className="md-body-medium text-on-surface-variant mt-1">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {!isPremium && (
        <div className="flex items-center gap-3">
          <GoPremiumCTA size="large">Start Premium</GoPremiumCTA>
          <a className="md3-button md3-button--outlined" href="/settings">Manage Subscription</a>
        </div>
      )}
    </div>
  );
};

export default PremiumPage;

