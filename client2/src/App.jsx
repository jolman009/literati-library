// ===============================================
// ENHANCED APP.JSX - PRESERVES ALL YOUR EXISTING FEATURES
// Adds routing while keeping everything you built
// ===============================================
import React, { Suspense, lazy, useEffect } from 'react';
import { initWebVitals } from './utils/webVitals';
import { initOfflineReading } from './utils/offlineInit';
// Temporarily disabled dev monitors
// import PerformanceMonitor from './components/PerformanceMonitor';
// import CacheMonitor from './components/CacheMonitor';

// ⚠️ CRITICAL: Import mobile-fixes FIRST! ⚠️
import './styles/mobile-fixes.css';

// Modern responsive design tokens (Material Design 3)
import './styles/responsive-tokens.css';

// Import enhanced UX components
import { LoadingSpinner, NetworkStatus } from './components/ui/LoadingStates';
import ErrorBoundary, {
  LibraryErrorBoundary,
  ReaderErrorBoundary,
  UploadErrorBoundary,
  NotesErrorBoundary
} from './components/ui/ErrorBoundary';
import { useNetworkStatus } from './hooks/useNetworkStatus';

// PWA Components
import { InstallPrompt } from './components/PWA';
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
import { EntitlementsProvider } from './contexts/EntitlementsContext';
import './styles/dashboard-dark-mode-fix.css';
import './styles/themes.css'; // Theme system with 6 unlockable themes
import { loadThemePreference, applyTheme, getDefaultTheme } from './utils/themeUtils';

// Material3 imports - Direct imports from Material3 barrel
import { Material3ThemeProvider, MD3SnackbarProvider } from './components/Material3';

import AppLayout from './components/AppLayout';
import ReadingSessionTimer from './components/ReadingSessionTimer';
import GamificationOnboarding from './components/gamification/GamificationOnboarding';

// Smart conditional provider loading
import ConditionalProviders from './components/providers/ConditionalProviders';
import CookieConsent from './components/legal/CookieConsent';
import NoteSyncListener from './components/NoteSyncListener';
import PremiumModal from './components/premium/PremiumModal';

// Import only critical auth pages directly
import NewLandingPage from './pages/NewLandingPage';
import Login from './pages/Login';
import ResetPassword from './components/ResetPassword';

// Lazy load all other pages for better performance
const SignUpPage = lazy(() => import('./pages/SignUpPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProgressPage = lazy(() => import('./pages/ProgressPage'));
const AchievementsPage = lazy(() => import('./pages/AchievementsPage'));
const JolmanPressPage = lazy(() => import('./pages/JolmanPressPage'));
const GamificationRulesPage = lazy(() => import('./pages/GamificationRulesPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const MockLibraryPage = lazy(() => import('./pages/MockLibraryPage'));
const MentorPage = lazy(() => import('./pages/MentorPage'));
const OnboardingGuide = lazy(() => import('./pages/OnboardingGuide'));
const HelpViewer = lazy(() => import('./pages/HelpViewer'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const DataExport = lazy(() => import('./components/DataExport'));
const PremiumPage = lazy(() =>
  import('./pages/PremiumPage').catch(err => {
    console.error('Failed to load PremiumPage:', err);
    return { default: () => <div>Error loading Premium. Please refresh.</div> };
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
    // Auth state monitoring - removed for production
  }, [user, loading, isAuthenticated]);

  if (loading) {
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
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/update-password" element={<ResetPassword />} />
      <Route element={<ProtectedAppLayout />}>
        <Route path="/dashboard" element={
          <ErrorBoundary fallbackComponent="dashboard" variant="full">
            <Suspense fallback={<AppLoadingSpinner message="Loading your dashboard..." />}>
              <DashboardPage />
            </Suspense>
          </ErrorBoundary>
        } />
        <Route path="/progress" element={
          <ErrorBoundary fallbackComponent="progress" variant="full">
            <Suspense fallback={<AppLoadingSpinner message="Loading your progress..." />}>
              <ProgressPage />
            </Suspense>
          </ErrorBoundary>
        } />
        <Route path="/achievements" element={
          <ErrorBoundary fallbackComponent="achievements" variant="full">
            <Suspense fallback={<AppLoadingSpinner message="Loading your achievements..." />}>
              <AchievementsPage />
            </Suspense>
          </ErrorBoundary>
        } />
        <Route path="/library" element={
          <LibraryErrorBoundary>
            <Suspense fallback={<AppLoadingSpinner message="Loading your library..." />}>
              <MockLibraryPage />
            </Suspense>
          </LibraryErrorBoundary>
        } />
        <Route path="/settings" element={
          <ErrorBoundary fallbackComponent="settings" variant="full">
            <Suspense fallback={<AppLoadingSpinner message="Loading settings..." />}>
              <SettingsPage />
            </Suspense>
          </ErrorBoundary>
        } />
        <Route path="/settings/data-export" element={
          <ErrorBoundary fallbackComponent="data-export" variant="full">
            <Suspense fallback={<AppLoadingSpinner message="Preparing data export..." />}>
              <DataExport />
            </Suspense>
          </ErrorBoundary>
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
        <Route path="/help/viewer" element={
          <ErrorBoundary fallbackComponent="dashboard" variant="full">
            <Suspense fallback={<AppLoadingSpinner message="Loading help..." />}>
              <HelpViewer />
            </Suspense>
          </ErrorBoundary>
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
          <ReaderErrorBoundary>
            <Suspense fallback={<AppLoadingSpinner message="Preparing your reading session..." />}>
              <ReadBookWrapper />
            </Suspense>
          </ReaderErrorBoundary>
        } />
        <Route path="/mentor" element={
          <ErrorBoundary fallbackComponent="mentor" variant="full">
            <Suspense fallback={<AppLoadingSpinner message="Loading Literary Mentor..." />}>
              <MentorPage />
            </Suspense>
          </ErrorBoundary>
        } />
        <Route path="/leaderboard" element={
          <ErrorBoundary fallbackComponent="leaderboard" variant="full">
            <Suspense fallback={<AppLoadingSpinner message="Loading leaderboard..." />}>
              <LeaderboardPage />
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
        <Route path="/mock-library" element={
          <Suspense fallback={<AppLoadingSpinner message="Loading mock library..." />}>
            <MockLibraryPage />
          </Suspense>
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
      <Route path="/jolman-press" element={
        <ErrorBoundary fallbackComponent="jolman-press" variant="full">
          <Suspense fallback={<AppLoadingSpinner message="Loading Jolman Press..." />}>
            <JolmanPressPage />
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

      <Route path="/premium" element={
        <ErrorBoundary fallbackComponent="premium" variant="full">
          <Suspense fallback={<AppLoadingSpinner message="Loading Premium..." />}>
            <PremiumPage />
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

    // Initialize theme system early (before gamification context loads)
    const savedTheme = loadThemePreference();
    const themeToApply = savedTheme || getDefaultTheme().id;
    const currentMode = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(themeToApply, currentMode);

    // Initialize offline reading system
    initOfflineReading().then(result => {
      if (!result.success) {
        console.warn('⚠️ Offline reading initialization failed:', result.error);
      }
    }).catch(error => {
      console.error('❌ Failed to initialize offline reading:', error);
    });
  }, []);

  return (
    <div className="app">
      <MD3SnackbarProvider>
        <AuthProvider>
          <EntitlementsProvider>
            <Material3ThemeProvider defaultTheme="auto">
              {/* ConditionalProviders only loads gamification/sessions when authenticated */}
              <ConditionalProviders>
                <NetworkStatus isOnline={isOnline} isReconnecting={isReconnecting} />
                <NoteSyncListener />
                <AppRoutes />
                <ReadingSessionTimer />
                {/* Temporarily disabled dev monitors */}
                {/* <PerformanceMonitor /> */}
                {/* <CacheMonitor /> */}
                <GamificationOnboarding />
                <CookieConsent />
                <PremiumModal />

                {/* PWA Components */}
                <OfflineIndicator />
                <InstallPrompt />

                {/* Sentry Test Button (Development Only) */}
                {/* <SentryTestButton /> */}
              </ConditionalProviders>
            </Material3ThemeProvider>
          </EntitlementsProvider>
        </AuthProvider>
      </MD3SnackbarProvider>
    </div>
  );
};

export default App;
// Test automated deployment
