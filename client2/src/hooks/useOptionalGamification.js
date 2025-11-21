// src/hooks/useOptionalGamification.js
import { useState, useEffect } from 'react';

export const useOptionalGamification = () => {
  const [gamificationContext, setGamificationContext] = useState({
    trackAction: () => Promise.resolve(),
  });

  useEffect(() => {
    // Try to load gamification context dynamically
    // Note: We cannot call useGamification directly here as it's a hook
    // Instead, we provide a fallback and could enhance this with dynamic import of the provider
    const loadGamification = async () => {
      try {
        // Import the context module to check if it's available
        const module = await import('../contexts/GamificationContext');
        if (module && module.useGamification) {
          console.warn('Gamification context is available but needs to be used at component level');
        }
      } catch (error) {
        console.warn('Gamification not available:', error.message);
      }
    };

    loadGamification();
  }, []);

  return gamificationContext;
};