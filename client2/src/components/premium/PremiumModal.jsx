import React, { useEffect, useState } from 'react';
import GoPremiumCTA from './GoPremiumCTA';
import { useEntitlements } from '../../contexts/EntitlementsContext';
import { useSnackbar } from '../Material3';
import { useNavigate } from 'react-router-dom';

const PremiumModal = () => {
  const [open, setOpen] = useState(false);
  const { isPremium } = useEntitlements();
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();

  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      // Also surface a lightweight snackbar with a learn-more action
      try {
        showSnackbar({
          message: 'Premium unlocks AI and advanced features',
          variant: 'default',
          autoHideDuration: 5000,
          action: (
            <button className="md3-button md3-button--text" onClick={() => navigate('/premium')}>
              Learn more
            </button>
          )
        });
      } catch {
        // Silently ignore navigation errors
      }
    };
    window.addEventListener('openPremiumModal', onOpen);
    return () => window.removeEventListener('openPremiumModal', onOpen);
  }, [navigate, showSnackbar]);

  useEffect(() => {
    if (isPremium && open) setOpen(false);
  }, [isPremium, open]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center pointer-events-none">
      {/* Scrim */}
      <div className="absolute inset-0 bg-black/30 pointer-events-auto" onClick={() => setOpen(false)} />

      {/* Bottom sheet container */}
      <div className="relative pointer-events-auto w-full max-w-[720px] mx-auto md:my-6">
        <div className="bg-surface-container-high border border-outline-variant shadow-lg rounded-t-large md:rounded-large w-full p-5 md:p-6"
             style={{
               boxShadow: 'var(--md-sys-elevation-level3)'
             }}>
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
            <button className="md3-button md3-button--text" onClick={() => navigate('/premium')}>Learn more</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumModal;
