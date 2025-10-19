// src/App.jsx - Version without wrappers
import React, { Suspense, lazy, useEffect } from 'react';
import './styles/gamification.css';
import './styles/dashboard-unified.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GamificationProvider } from './contexts/GamificationContext';
import { Material3ThemeProvider, MD3SnackbarProvider } from './components/Material3';
import AppLayout from './components/AppLayout';
import { ReadingSessionProvider } from './contexts/ReadingSessionContext';
import { FloatingReadingTimer, ReadingSessionManager } from './components/ReadingSessionUI';
import ReadBookWrapper from './components/wrappers/ReadBookWrapper';

// Import Login (non-lazy since it's critical)
import Login from './pages/Login';

// Lazy load page components with proper wrappers
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const LibraryPageWrapper = lazy(() => {
  console.log('🔍 DIAGNOSTIC: Attempting to load LibraryPageWrapper...');
  return import('./components/wrappers/LibraryPageWrapper').catch(error => {
    console.error('❌ DIAGNOSTIC: LibraryPageWrapper import failed:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    throw error;
  });
});
const UploadPage = lazy(() => import('./pages/UploadPage'));
const NotesPage = lazy(() => import('./pages/NotesPage'));

// Enhanced Library App for standalone routes (optional)
const CompleteEnhancedApp = lazy(() => import('./components/wrappers/LibraryPageWrapper'));

// Import CSS
import './styles/material3.css';
import './App.css';

// Loading Component
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
    <p style={{ color: '#6750a4', margin: 0 }}>Loading...</p>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

/**
 * App Routes with authentication logic
 */
const AppRoutes = () => {
  const { user, loading, isAuthenticated } = useAuth();

  // 🔍 DEBUG: Monitor auth state changes
  useEffect(() => {
    console.log('🔍 AUTH STATE DEBUG:', {
      user: user ? `${user.name} (${user.email})` : 'null',
      loading,
      isAuthenticated,
      hasToken: !!localStorage.getItem('shelfquest_token'),
      currentPath: window.location.pathname
    });
  }, [user, loading, isAuthenticated]);

  if (loading) {
    console.log('🔄 Still loading auth state...');
    return <LoadingSpinner />;
  }

  console.log('🔍 Rendering routes with user:', user ? 'authenticated' : 'not authenticated');

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {user ? (
          <>
            {/* Additional authenticated standalone routes if needed */}
            <Route path="/reading" element={<CompleteEnhancedApp />} />
            <Route path="/collections" element={<CompleteEnhancedApp />} />
            <Route path="/stats" element={<CompleteEnhancedApp />} />

            {/* Main layout with nested routes */}
            <Route path="/*" element={<AppLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="library" element={<LibraryPageWrapper />} />
              <Route path="upload" element={<UploadPage />} />
              <Route path="notes" element={<NotesPage />} />
              {/* Note: use relative path for read to avoid absolute path error */}
              <Route path="read/:bookId" element={<ReadBookWrapper />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>
          </>
        ) : (
          <Route path="*" element={<Login />} />
        )}
      </Routes>
    </Suspense>
  );
};

/**
 * Main App component with all providers
 */
function App() {
  return (
    <AuthProvider>
      <GamificationProvider>
        <ReadingSessionProvider>
          {/* Wrapping with Material3 theme and snackbar provider */}
          <Material3ThemeProvider defaultTheme="auto">
            <MD3SnackbarProvider>
              <AppRoutes />
            </MD3SnackbarProvider>
          </Material3ThemeProvider>
          {/* Floating timer and session manager outside of routes to show globally */}
          <FloatingReadingTimer />
          <ReadingSessionManager />
        </ReadingSessionProvider>
      </GamificationProvider>
    </AuthProvider>
  );
}

export default App;