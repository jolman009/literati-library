import React from 'react';
import { useEntitlements } from '../../contexts/EntitlementsContext';
import GoPremiumCTA from './GoPremiumCTA';

const GoPremiumBanner = ({ className = '' }) => {
  const { isPremium } = useEntitlements();
  if (isPremium) return null;

  return (
    <div className={[
      'bg-surface-container-high',
      'border', 'border-outline-variant',
      'rounded-medium', 'p-3', 'mx-3', 'my-2',
      'flex', 'items-center', 'justify-between', 'gap-3',
      className
    ].filter(Boolean).join(' ')}>
      <div>
        <div className="md-title-medium">Unlock AI summaries, advanced stats, and sync</div>
        <div className="md-body-medium text-on-surface-variant">Upgrade to ShelfQuest Premium and get more from your reading.</div>
      </div>
      <div className="flex items-center gap-2">
        <GoPremiumCTA variant="tonal" />
        <a href="/premium" className="md3-button md3-button--outlined">Learn More</a>
      </div>
    </div>
  );
};

export default GoPremiumBanner;
