// ===============================================
// ENHANCED APP.JSX - PRESERVES ALL YOUR EXISTING FEATURES
// Adds routing while keeping everything you built
// ===============================================
import React, { Suspense, lazy, useEffect } from 'react';
import { initWebVitals } from './utils/webVitals';
import PerformanceMonitor from './components/PerformanceMonitor';
import CacheMonitor from './components/CacheMonitor';

// Import enhanced UX components
import { LoadingSpinner, PageTransition, NetworkStatus } from './components/ui/LoadingStates';
import ErrorBoundary, { 
  LibraryErrorBoundary, 
  ReaderErrorBoundary, 
  UploadErrorBoundary, 
  NotesErrorBoundary 
} from './components/ui/ErrorBoundary';
import { useNetworkStatus } from './hooks/useNetworkStatus';

// Import performance testing for development
if (process.env.NODE_ENV === 'development') {
  import('./utils/performanceTest');
  import('./utils/integrationTest');
  import('./utils/browserCompatibilityTest');
  import('./utils/mobileResponsivenessTest');
}
import './styles/md3-unified-colors.css';
import './styles/md3-components.css';
import './styles/library-md3.css';
import './styles/reading-timer-md3.css';
import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GamificationProvider } from './contexts/GamificationContext';

// Material3 imports - adjust paths as needed
import { Material3ThemeProvider } from './contexts/Material3ThemeContext';
import { MD3SnackbarProvider } from './components/Material3';

import AppLayout from './components/AppLayout';
import { ReadingSessionProvider } from './contexts/ReadingSessionContext';
import ReadingSessionTimer from './components/ReadingSessionTimer';

// Import only critical auth pages directly
import LandingPage from './pages/LandingPage';
import MD3Login from './pages/MD3Login';

// Lazy load all other pages for better performance
const SignUpPage = lazy(() => import('./pages/SignUpPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const LibraryPage = lazy(() => import('./pages/LibraryPage'));

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

// Enhanced Loading Component (now using imported component)
const AppLoadingSpinner = ({ message = "Loading Literati..." }) => (
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
      hasToken: !!localStorage.getItem('literati_token'),
      currentPath: window.location.pathname
    });
  }, [user, loading, isAuthenticated]);

  if (loading) {
    console.log('🔄 Loading auth state...');
    return <AppLoadingSpinner message="Initializing Literati..." />;
  }

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
      <Route path="/signup" element={
        <ErrorBoundary fallbackComponent="signup" variant="full">
          <Suspense fallback={<AppLoadingSpinner message="Loading sign up..." />}>
            <SignUpPage />
          </Suspense>
        </ErrorBoundary>
      } />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <MD3Login />} />

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
            <Suspense fallback={<AppLoadingSpinner message="Loading your library..." />}>
              <LibraryPage />
            </Suspense>
          </LibraryErrorBoundary>
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
        <Route path="/read/:bookId" element={
          <ReaderErrorBoundary>
            <Suspense fallback={<AppLoadingSpinner message="Preparing your reading session..." />}>
              <ReadBookWrapper />
            </Suspense>
          </ReaderErrorBoundary>
        } />
      </Route>

      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />} />
    </Routes>
  );
};

// Main App Component
const App = () => {
  const { isOnline, isReconnecting } = useNetworkStatus();

  useEffect(() => {
    initWebVitals(); // ✅ keep web vitals monitoring
  }, []);

  return (
    <div className="app">
      <AuthProvider>
        <Material3ThemeProvider defaultTheme="auto">
          <MD3SnackbarProvider>
            <GamificationProvider>
              <ReadingSessionProvider>
                <NetworkStatus isOnline={isOnline} isReconnecting={isReconnecting} />
                <AppRoutes />
                <ReadingSessionTimer />
                <PerformanceMonitor />
                <CacheMonitor />
              </ReadingSessionProvider>
            </GamificationProvider>
          </MD3SnackbarProvider>
        </Material3ThemeProvider>
      </AuthProvider>
    </div>
  );
};

export default App;
