// ===============================================
// ENHANCED APP.JSX - PRESERVES ALL YOUR EXISTING FEATURES
// Adds routing while keeping everything you built
// ===============================================
import React, { Suspense, lazy, useEffect } from 'react';
import { initWebVitals } from './utils/webVitals';
import { initOfflineReading } from './utils/offlineInit';
import PerformanceMonitor from './components/PerformanceMonitor';
import CacheMonitor from './components/CacheMonitor';

// ⚠️ CRITICAL: Import mobile-fixes FIRST! ⚠️
import './styles/mobile-fixes.css';

// Import enhanced UX components
import { LoadingSpinner, PageTransition, NetworkStatus } from './components/ui/LoadingStates';
import ErrorBoundary, {
  LibraryErrorBoundary,
  ReaderErrorBoundary,
  UploadErrorBoundary,
  NotesErrorBoundary
} from './components/ui/ErrorBoundary';
import { useNetworkStatus } from './hooks/useNetworkStatus';

// PWA Components
import { InstallPrompt, UpdateNotification } from './components/PWA';
import OfflineIndicator from './components/OfflineIndicator';

// Sentry testing (development only)
// import SentryTestButton from './components/SentryTestButton.jsx';

// Import performance testing for development
if (process.env.NODE_ENV === 'development') {
  import('./utils/performanceTest');
  import('./utils/integrationTest');
  import('./utils/browserCompatibilityTest');
  import('./utils/mobileResponsivenessTest');
  import('./utils/authTestUtils'); // Auth testing utilities
}
import './styles/md3-unified-colors.css';
import './styles/md3-components.css';
import './styles/library-md3.css';
import './App.css';
import './styles/accessibility.css'; // WCAG AA compliance styles
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GamificationProvider } from './contexts/GamificationContext';
import './styles/dashboard-dark-mode-fix.css';

// Material3 imports - Direct imports from Material3 barrel
import { Material3ThemeProvider, MD3SnackbarProvider } from './components/Material3';

import AppLayout from './components/AppLayout';
import { ReadingSessionProvider } from './contexts/ReadingSessionContext';
import ReadingSessionTimer from './components/ReadingSessionTimer';
import GamificationOnboarding from './components/gamification/GamificationOnboarding';
import CookieConsent from './components/legal/CookieConsent';
import NoteSyncListener from './components/NoteSyncListener';

// Import only critical auth pages directly
import NewLandingPage from './pages/NewLandingPage';
import Login from './pages/Login';

// Lazy load all other pages for better performance
const SignUpPage = lazy(() => import('./pages/SignUpPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
// TEMPORARY: Import LibraryPage directly to debug loading issue
import LibraryPage from './pages/LibraryPage';
const GamificationRulesPage = lazy(() => import('./pages/GamificationRulesPage'));
const MentorPage = lazy(() => import('./pages/MentorPage'));
const OnboardingGuide = lazy(() => import('./pages/OnboardingGuide'));

// Lazy load secondary pages with error handling
const LibraryPageWrapper = lazy(() =>
  import('./components/wrappers/LibraryPageWrapper').catch(err => {
    console.error('Failed to load LibraryPageWrapper:', err);
    return { default: () => <div>Error loading Library. Please refresh.</div> };
  })
);

const UploadPageWrapper = lazy(() =>
  import('./components/wrappers/UploadPageWrapper').catch(err => {
    console.error('Failed to load UploadPageWrapper:', err);
    return { default: () => <div>Error loading Upload. Please refresh.</div> };
  })
);

const NotesPageWrapper = lazy(() =>
  import('./components/wrappers/NotesPageWrapper').catch(err => {
    console.error('Failed to load NotesPageWrapper:', err);
    return { default: () => <div>Error loading Notes. Please refresh.</div> };
  })
);

const ReadBookWrapper = lazy(() =>
  import('./components/wrappers/ReadBookWrapper').catch(err => {
    console.error('Failed to load ReadBookWrapper:', err);
    return { default: () => <div>Error loading Reader. Please refresh.</div> };
  })
);

const CollectionsPageWrapper = lazy(() =>
  import('./components/wrappers/CollectionsPageWrapper').catch(err => {
    console.error('Failed to load CollectionsPageWrapper:', err);
    return { default: () => <div>Error loading Collections. Please refresh.</div> };
  })
);

// Legal pages
const PrivacyPolicyPage = lazy(() =>
  import('./pages/legal/PrivacyPolicyPage').catch(err => {
    console.error('Failed to load PrivacyPolicyPage:', err);
    return { default: () => <div>Error loading Privacy Policy. Please refresh.</div> };
  })
);

const TermsOfServicePage = lazy(() =>
  import('./pages/legal/TermsOfServicePage').catch(err => {
    console.error('Failed to load TermsOfServicePage:', err);
    return { default: () => <div>Error loading Terms of Service. Please refresh.</div> };
  })
);

// Contact dialog (modal)
const ContactDialog = lazy(() =>
  import('./pages/ContactDialog').catch(err => {
    console.error('Failed to load ContactDialog:', err);
    return { default: () => <div>Error loading Contact. Please refresh.</div> };
  })
);

// Enhanced Loading Component (now using imported component)
const AppLoadingSpinner = ({ message = "Loading ShelfQuest..." }) => (
  <LoadingSpinner message={message} size="large" variant="primary" />
);

// Protected Layout Component with Outlet
const ProtectedAppLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <AppLoadingSpinner message="Verifying authentication..." />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <AppLayout />;
};

// Main App Routes Handler
const AppRoutes = () => {
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    console.log('🔍 AUTH DEBUG:', {
      user: user ? `${user.name} (${user.email})` : 'null',
      loading,
      isAuthenticated,
      hasToken: !!localStorage.getItem('shelfquest_token'),
      currentPath: window.location.pathname
    });
  }, [user, loading, isAuthenticated]);

  if (loading) {
    console.log('🔄 Loading auth state...');
    return <AppLoadingSpinner message="Initializing ShelfQuest..." />;
  }

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <NewLandingPage />} />
      <Route path="/signup" element={
        <ErrorBoundary fallbackComponent="signup" variant="full">
          <Suspense fallback={<AppLoadingSpinner message="Loading sign up..." />}>
            <SignUpPage />
          </Suspense>
        </ErrorBoundary>
      } />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />

      <Route element={<ProtectedAppLayout />}>
        <Route path="/dashboard" element={
          <ErrorBoundary fallbackComponent="dashboard" variant="full">
            <Suspense fallback={<AppLoadingSpinner message="Loading your dashboard..." />}>
              <DashboardPage />
            </Suspense>
          </ErrorBoundary>
        } />
        <Route path="/library" element={
          <LibraryErrorBoundary>
            <LibraryPage />
          </LibraryErrorBoundary>
        } />
        <Route path="/onboarding" element={
          <ErrorBoundary fallbackComponent="dashboard" variant="full">
            <Suspense fallback={<AppLoadingSpinner message="Loading onboarding..." />}>
              <OnboardingGuide />
            </Suspense>
          </ErrorBoundary>
        } />
        <Route path="/upload" element={
          <UploadErrorBoundary>
            <Suspense fallback={<AppLoadingSpinner message="Preparing upload..." />}>
              <UploadPageWrapper />
            </Suspense>
          </UploadErrorBoundary>
        } />
        <Route path="/notes" element={
          <NotesErrorBoundary>
            <Suspense fallback={<AppLoadingSpinner message="Loading your notes..." />}>
              <NotesPageWrapper />
            </Suspense>
          </NotesErrorBoundary>
        } />
        <Route path="/gamification" element={
          <ErrorBoundary fallbackComponent="gamification" variant="full">
            <Suspense fallback={<AppLoadingSpinner message="Loading gamification rules..." />}>
              <GamificationRulesPage />
            </Suspense>
          </ErrorBoundary>
        } />
        <Route path="/read/:bookId" element={
          <>
            {console.log('🛣️ App.jsx: /read/:bookId route matched!')}
            <ReaderErrorBoundary>
              <Suspense fallback={<AppLoadingSpinner message="Preparing your reading session..." />}>
                <ReadBookWrapper />
              </Suspense>
            </ReaderErrorBoundary>
          </>
        } />
        <Route path="/mentor" element={
          <ErrorBoundary fallbackComponent="mentor" variant="full">
            <Suspense fallback={<AppLoadingSpinner message="Loading Literary Mentor..." />}>
              <MentorPage />
            </Suspense>
          </ErrorBoundary>
        } />
        <Route path="/collections" element={
          <ErrorBoundary fallbackComponent="collections" variant="full">
            <Suspense fallback={<AppLoadingSpinner message="Loading your collections..." />}>
              <CollectionsPageWrapper />
            </Suspense>
          </ErrorBoundary>
        } />
      </Route>

      {/* Public routes - contact opens as modal dialog */}
      <Route path="/contact" element={
        <ErrorBoundary fallbackComponent="contact" variant="full">
          <Suspense fallback={<AppLoadingSpinner message="Opening Contact…" />}>
            <ContactDialog />
          </Suspense>
        </ErrorBoundary>
      } />
      <Route path="/legal/privacy-policy" element={
        <ErrorBoundary fallbackComponent="privacy-policy" variant="full">
          <Suspense fallback={<AppLoadingSpinner message="Loading Privacy Policy..." />}>
            <PrivacyPolicyPage />
          </Suspense>
        </ErrorBoundary>
      } />

      <Route path="/legal/terms-of-service" element={
        <ErrorBoundary fallbackComponent="terms-of-service" variant="full">
          <Suspense fallback={<AppLoadingSpinner message="Loading Terms of Service..." />}>
            <TermsOfServicePage />
          </Suspense>
        </ErrorBoundary>
      } />

      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />} />
    </Routes>
  );
};

// Main App Component
const App = () => {
  const { isOnline, isReconnecting } = useNetworkStatus();

  useEffect(() => {
    initWebVitals(); // ✅ keep web vitals monitoring

    // Initialize offline reading system
    initOfflineReading().then(result => {
      if (result.success) {
        console.log('📚 Offline reading initialized successfully');
        console.log('💾 Storage available:', result.storage);
      } else {
        console.warn('⚠️ Offline reading initialization failed:', result.error);
      }
    }).catch(error => {
      console.error('❌ Failed to initialize offline reading:', error);
    });
  }, []);

  return (
    <div className="app">
      <AuthProvider>
        <Material3ThemeProvider defaultTheme="auto">
          <MD3SnackbarProvider>
            <GamificationProvider>
              <ReadingSessionProvider>
                <NetworkStatus isOnline={isOnline} isReconnecting={isReconnecting} />
                <NoteSyncListener />
                <AppRoutes />
                <ReadingSessionTimer />
                <PerformanceMonitor />
                <CacheMonitor />
                <GamificationOnboarding />
                <CookieConsent />

                {/* PWA Components */}
                <OfflineIndicator />
                <InstallPrompt />

                {/* Sentry Test Button (Development Only) */}
                {/* <SentryTestButton /> */}
              </ReadingSessionProvider>
            </GamificationProvider>
          </MD3SnackbarProvider>
        </Material3ThemeProvider>
      </AuthProvider>
    </div>
  );
};

export default App;
// Test automated deployment
