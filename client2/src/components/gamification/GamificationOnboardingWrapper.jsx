import React, { useState, useEffect, useCallback } from 'react';
import GamificationOnboarding from './GamificationOnboarding';
import monitoring from '../../services/monitoring';

const STORAGE_KEY = 'gamification_onboarding_dismissed';
const SHOW_DELAY_MS = 1500;

const GamificationOnboardingWrapper = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === 'true') return;
    } catch {
      return;
    }

    const timer = setTimeout(() => {
      setIsOpen(true);
      monitoring.trackFeature('gamification_onboarding', 'shown');
    }, SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = useCallback((completedAll = false) => {
    setIsOpen(false);
    monitoring.trackFeature('gamification_onboarding', completedAll ? 'completed' : 'skipped');
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Silently ignore localStorage errors
    }
  }, []);

  if (!isOpen) return null;

  return <GamificationOnboarding isOpen={isOpen} onClose={handleClose} />;
};

export default GamificationOnboardingWrapper;
