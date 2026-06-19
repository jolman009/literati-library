// src/components/onboarding/SetupWizardWrapper.jsx
//
// First-run gating + persistence for the SetupWizard. REPLACES the old
// gamification rules tour: the wizard shows only to users who have completed
// NEITHER onboarding, and on finish it marks BOTH keys so the rules tour never
// appears again (existing users who already dismissed the tour are left alone).
//
// Split outer/inner: ConditionalProviders mounts GamificationProvider only when
// authenticated, and useGamification() throws without it — so the gamification
// hook lives in the inner, which the outer renders only once authenticated.
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useGamification } from '../../contexts/GamificationContext';
import { useSnackbar } from '../Material3';
import monitoring from '../../services/monitoring';
import SetupWizard from './SetupWizard';

const WIZARD_KEY = 'setup_wizard_completed';
const LEGACY_TOUR_KEY = 'gamification_onboarding_dismissed';
const SHOW_DELAY_MS = 1200;

const alreadyOnboarded = () => {
  try {
    return localStorage.getItem(WIZARD_KEY) === 'true'
      || localStorage.getItem(LEGACY_TOUR_KEY) === 'true';
  } catch {
    return true; // storage unavailable -> don't nag
  }
};

const markDone = () => {
  try {
    localStorage.setItem(WIZARD_KEY, 'true');
    localStorage.setItem(LEGACY_TOUR_KEY, 'true'); // suppress the legacy rules tour
  } catch { /* ignore */ }
};

// Inner: only mounted when authenticated, so the gamification provider exists.
function SetupWizardInner() {
  const { user, updateProfile } = useAuth();
  const { createGoal, setGoalPreference } = useGamification();
  const toast = useSnackbar();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (alreadyOnboarded()) return undefined;
    const t = setTimeout(() => {
      setIsOpen(true);
      monitoring.trackFeature('setup_wizard', 'shown');
    }, SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  // All writes are best-effort: a failed save must never trap the user in a
  // wizard they can't finish. UX completion is decoupled from persistence.
  const persist = useCallback(async (data) => {
    try { if (data.name && data.name !== user?.name) await updateProfile({ name: data.name }); } catch { /* ignore */ }
    try {
      setGoalPreference({
        type: 'time',
        targetBooksPerMonth: Math.max(1, Math.round(data.goal / 12)),
        targetMinutesPerWeek: data.minutes * 7,
      });
    } catch { /* ignore */ }
    try {
      await createGoal({
        title: `Read ${data.goal} books this year`,
        description: 'Yearly reading goal from setup',
        type: 'books',
        target: data.goal,
        reward: 100,
      });
    } catch { /* ignore */ }
    // No server field for interests / first-book pick yet -> persist locally.
    try { localStorage.setItem('onboarding_interests', JSON.stringify(data.genres || [])); } catch { /* ignore */ }
    try { if (data.firstBook) localStorage.setItem('onboarding_first_book', data.firstBook); } catch { /* ignore */ }
  }, [user, updateProfile, createGoal, setGoalPreference]);

  const handleComplete = useCallback(async (data) => {
    setIsOpen(false);
    markDone();
    monitoring.trackFeature('setup_wizard', 'completed');
    await persist(data);
    try { toast.xp(50, 'Setup complete'); } catch { /* ignore */ }
  }, [persist, toast]);

  const handleSkip = useCallback(() => {
    setIsOpen(false);
    markDone();
    monitoring.trackFeature('setup_wizard', 'skipped');
  }, []);

  const handleStepView = useCallback((s) => {
    monitoring.trackFeature('setup_wizard', 'step_viewed', { step: s });
  }, []);

  if (!isOpen) return null;
  return (
    <SetupWizard
      name={user?.name || ''}
      onComplete={handleComplete}
      onSkip={handleSkip}
      onStepView={handleStepView}
    />
  );
}

// Outer: auth gate. useAuth is always safe (AuthProvider is always mounted);
// the gamification hook lives in the inner, mounted only when authenticated.
export default function SetupWizardWrapper() {
  const { isAuthenticated, loading } = useAuth();
  if (loading || !isAuthenticated) return null;
  if (alreadyOnboarded()) return null; // cheap early-out before mounting inner
  return <SetupWizardInner />;
}
