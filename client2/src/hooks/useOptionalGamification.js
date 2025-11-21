// src/hooks/useOptionalGamification.js
import { useState, useEffect } from 'react';

export const useOptionalGamification = () => {
  const [gamificationContext, setGamificationContext] = useState(null);

  useEffect(() => {
    // Try to load gamification context
    const loadGamification = async () => {
      try {
        const { useGamification } = await import('../contexts/GamificationContext');
        const context = useGamification();
        setGamificationContext(context);
      } catch (error) {
        console.warn('Gamification not available:', error.message);
        // Provide fallback
        setGamificationContext({
          trackAction: () => Promise.resolve(),
        });
      }
    };

    loadGamification();
  }, []);

  return gamificationContext;
};