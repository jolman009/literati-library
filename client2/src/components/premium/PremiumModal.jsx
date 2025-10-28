import React, { useEffect, useState } from 'react';
import GoPremiumCTA from './GoPremiumCTA';
import { useEntitlements } from '../../contexts/EntitlementsContext';

const PremiumModal = () => {
  const [open, setOpen] = useState(false);
  const { isPremium } = useEntitlements();

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener('openPremiumModal', onOpen);
    return () => window.removeEventListener('openPremiumModal', onOpen);
  }, []);

  useEffect(() => {
    if (isPremium && open) setOpen(false);
  }, [isPremium, open]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[1000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
      <div className="relative bg-surface-container-high rounded-large shadow-lg max-w-[520px] w-[92%] p-5 border border-outline-variant">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <div className="md-headline-small">ShelfQuest Premium</div>
            <div className="md-body-medium text-on-surface-variant">Everything you need to read smarter.</div>
          </div>
          <button className="md3-button md3-button--text" onClick={() => setOpen(false)} aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <ul className="md-body-medium space-y-2 mb-4 list-disc pl-5">
          <li>AI summaries and contextual insights</li>
          <li>Advanced reading analytics and streaks</li>
          <li>Cross-device sync and secure backup</li>
          <li>Full-text note search and export</li>
          <li>Priority processing and new features first</li>
        </ul>
        <div className="flex items-center gap-3">
          <GoPremiumCTA size="large">Start Premium</GoPremiumCTA>
          <button className="md3-button md3-button--outlined" onClick={() => setOpen(false)}>Maybe later</button>
        </div>
      </div>
    </div>
  );
};

export default PremiumModal;

