// src/components/OnboardingSpotlight.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MD3Card, MD3Button, MD3Checkbox } from './Material3';

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10000,
  padding: 16,
};

const cardStyle = {
  maxWidth: 720,
  width: '100%',
  padding: 20,
};

const titleStyle = { margin: 0 };
const subtitleStyle = { marginTop: 8, color: 'var(--md-sys-color-on-surface-variant)' };

const actionsRow = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  marginTop: 16,
};

const footerRow = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: 12,
};

const OnboardingSpotlight = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    if (dontShowAgain) {
      try { localStorage.setItem('onboarding_spotlight_dismissed', 'true'); } catch {}
    }
    onClose?.();
  };

  const go = (path) => {
    try { localStorage.setItem('onboarding_spotlight_dismissed', 'true'); } catch {}
    navigate(path);
    onClose?.();
  };

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-label="ShelfQuest Onboarding">
      <MD3Card variant="elevated" style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <h2 style={titleStyle}>Welcome to ShelfQuest</h2>
            <p style={subtitleStyle}>Quick actions to get started, or open the full guide.</p>
          </div>
          <button
            onClick={handleClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--md-sys-color-on-surface)' }}
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div style={actionsRow}>
          <MD3Button onClick={() => go('/upload')}>Upload a Book</MD3Button>
          <MD3Button variant="outlined" onClick={() => go('/onboarding')}>Open Onboarding Guide</MD3Button>
          <MD3Button variant="text" onClick={() => go('/library')}>Go to Library</MD3Button>
        </div>

        <div style={footerRow}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <MD3Checkbox checked={dontShowAgain} onChange={(e) => setDontShowAgain(e.target.checked)} />
            <span>Don’t show again</span>
          </label>
          <MD3Button variant="text" onClick={handleClose}>Dismiss</MD3Button>
        </div>
      </MD3Card>
    </div>
  );
};

export default OnboardingSpotlight;

