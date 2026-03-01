import React, { useState, useEffect, useCallback } from 'react';
import GamificationOnboarding from './GamificationOnboarding';

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

    const timer = setTimeout(() => setIsOpen(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
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
