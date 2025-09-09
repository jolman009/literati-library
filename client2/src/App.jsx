// ===============================================
// ENHANCED APP.JSX - PRESERVES ALL YOUR EXISTING FEATURES
// Adds routing while keeping everything you built
// ===============================================
import React, { Suspense, lazy, useEffect } from 'react';
import { initWebVitals } from './utils/webVitals';
import PerformanceMonitor from './components/PerformanceMonitor';
import CacheMonitor from './components/CacheMonitor';

// Import performance testing for development
if (process.env.NODE_ENV === 'development') {
  import('./utils/performanceTest');
  import('./utils/integrationTest');
  import('./utils/browserCompatibilityTest');
  import('./utils/mobileResponsivenessTest');
}
import './styles/md3-tokens.css';
import './styles/material3.css';
import './styles/app-layout.css';
import './styles/dashboard-md3.css';
import './styles/dashboard-unified.css';
import './styles/gamification.css';
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

// Import pages directly (not lazy loaded for critical routes)
import LandingPage from './pages/LandingPage';
import SignUpPage from './pages/SignUpPage';
import MD3Login from './pages/MD3Login';
import DashboardPage from './pages/DashboardPage';
import LibraryPage from './pages/LibraryPage';

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

// Enhanced Loading Spinner
const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    flexDirection: 'column',
    gap: '16px'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '3px solid #e0e0e0',
      borderTop: '3px solid #6750a4',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}></div>
    <p style={{ color: '#6750a4', margin: 0, fontWeight: 500 }}>Loading Literati...</p>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// Error Boundary for Lazy Loading
class LazyLoadErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Lazy load error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '60vh',
          flexDirection: 'column',
          gap: '16px',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#6750a4' }}>Something went wrong</h3>
          <p>This might be due to a missing file or import issue.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#6750a4',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Protected Layout Component with Outlet
const ProtectedAppLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
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
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <MD3Login />} />

      <Route element={<ProtectedAppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/upload" element={
          <LazyLoadErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <UploadPageWrapper />
            </Suspense>
          </LazyLoadErrorBoundary>
        } />
        <Route path="/notes" element={
          <LazyLoadErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <NotesPageWrapper />
            </Suspense>
          </LazyLoadErrorBoundary>
        } />
        <Route path="/read/:bookId" element={
          <LazyLoadErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <ReadBookWrapper />
            </Suspense>
          </LazyLoadErrorBoundary>
        } />
      </Route>

      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />} />
    </Routes>
  );
};

// Main App Component
const App = () => {
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
