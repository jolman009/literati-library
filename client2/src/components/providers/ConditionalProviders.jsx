// ConditionalProviders.jsx
// Smart provider loading - only loads gamification/session providers when authenticated
import React, { Suspense, lazy, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationProvider } from '../../contexts/NotificationContext';
import { LoadingSpinner } from '../ui/LoadingStates';

// Lazy load the heavy providers
const GamificationProvider = lazy(() =>
  import('../../contexts/GamificationContext').then(module => ({
    default: module.GamificationProvider
  }))
);

const ReadingSessionProvider = lazy(() =>
  import('../../contexts/ReadingSessionContext').then(module => ({
    default: module.ReadingSessionProvider
  }))
);

/**
 * ConditionalProviders - Intelligently loads providers based on auth state
 *
 * Performance Strategy:
 * - Unauthenticated users: No gamification/session code loaded (~500KB savings)
 * - Authenticated users: Providers loaded on first authenticated page
 * - Maintains all functionality while reducing initial bundle size
 *
 * This solves the previous issue where lazy loading broke gamification connections
 * by ensuring providers are loaded BEFORE any authenticated component needs them.
 */
const ConditionalProviders = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Memoize to prevent unnecessary re-renders
  const shouldLoadProviders = useMemo(() => {
    return isAuthenticated && !authLoading;
  }, [isAuthenticated, authLoading]);

  // For unauthenticated users, skip provider loading entirely
  if (!shouldLoadProviders) {
    return <>{children}</>;
  }

  // For authenticated users, lazy load the providers with suspense
  return (
    <Suspense fallback={
      <LoadingSpinner
        message="Initializing your reading environment..."
        size="large"
        variant="primary"
      />
    }>
      <NotificationProvider>
        <GamificationProvider>
          <ReadingSessionProvider>
            {children}
          </ReadingSessionProvider>
        </GamificationProvider>
      </NotificationProvider>
    </Suspense>
  );
};

export default ConditionalProviders;
