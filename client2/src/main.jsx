import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// Initialize Sentry crash reporting
import { initializeSentry } from './services/sentry.jsx';
import * as Sentry from '@sentry/react';
initializeSentry();

// 1) Configure PDF.js worker first (must come before any <Document/> usage)
import './pdfjs-setup';
// Global styles (order matters)
import './styles/md3-unified-colors.css';  // MD3 color system foundation
import './styles/md3-components.css';       // All dashboard, navigation, gamification components
import './components/Material3/MD3Navigation.css'; // MD3 Navigation components
import './styles/library-md3.css';         // Library-specific styles
import './styles/performance-optimized.css';
import './index.css';


// 3) App + router
import App from './App.jsx';

// 4) Utilities

// 5) PWA registration with update notifications
import { registerSW } from 'virtual:pwa-register';


// Register SW based on environment mode only (no hostname detection)
// Use VITE_ENABLE_SERVICE_WORKER to control SW registration in production
const shouldRegisterSW = import.meta.env.PROD &&
  (import.meta.env.VITE_ENABLE_SERVICE_WORKER !== 'false');

if (shouldRegisterSW) {
  const updateSW = registerSW({
    immediate: true,

    onNeedRefresh() {
      // Show update notification when new version is available
      if (window.confirm('New content available! Click OK to refresh and update.')) {
        updateSW(true); // Force update
      }
    },

    onOfflineReady() {
      console.warn('[PWA] App ready to work offline');
      // Optional: Show toast notification
      // showToast('App is ready to work offline!');
    },

    onRegistered(registration) {
      console.warn('[PWA] Service Worker registered:', registration);

      // Check for updates every hour
      setInterval(() => {
        registration?.update();
      }, 60 * 60 * 1000);
    },

    onRegisterError(error) {
      console.error('[PWA] Service Worker registration failed:', error);
    },
  });
}



// DEV diagnostics (optional)
if (import.meta.env.DEV) {
  window.__SHELFQUEST_DEBUG__ = true;
}

// Standard error boundary fallback (no Sentry)
const ErrorFallback = ({ error: _error, resetError: _resetError }) => (
  <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface">
    <div className="w-full max-w-md p-8 rounded-3xl shadow-elevation-3 bg-surface border border-outline-variant text-center">
      <span className="material-symbols-outlined text-6xl text-error">error</span>
      <h1 className="text-2xl font-semibold mt-4">Oops! Something went wrong.</h1>
      <p className="text-on-surface-variant mb-4">
        Please try refreshing the page.
      </p>
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 rounded-full bg-primary text-on-primary hover:bg-primary/80 transition-all duration-200 shadow-elevation-1"
        >
          Refresh Page
        </button>
      </div>
    </div>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  // Add <React.StrictMode> later if you want double-effect checks
  <Sentry.ErrorBoundary
    fallback={ErrorFallback}
    showDialog={false}
    beforeCapture={(scope) => {
      scope.setTag('boundary', 'root');
      scope.setLevel('error');
    }}
  >
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Sentry.ErrorBoundary>
);
/* CI/CD Pipeline Test - Wed, Sep 24, 2025 10:38:07 PM */
