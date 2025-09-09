import React from 'react';
import ReactDOM from 'react-dom/client';``
import { BrowserRouter } from 'react-router-dom';


// 1) Configure PDF.js worker first (must come before any <Document/> usage)
import './pdfjs-setup';
// Global styles (order matters)
import './styles/material3.css';          // MD3 variables + tokens + base (expressive)
import './styles/dashboard-md3.css';      // MD3 dashboard specific styles
import './styles/dashboard-unified.css';  // dashboard clusters & grids
import './styles/gamification.css';       // badges, progress rings, confetti
import './styles/performance-optimized.css';
import './index.css';


// 3) App + router
import App from './App.jsx';

// 4) Utilities
import { clearExpiredToken } from './utils/clearExpiredToken';

// 5) OPTIONAL PWA registration (PROD only to avoid dev cache fights)
import { registerSW } from 'virtual:pwa-register';

// One-time token cleanup
clearExpiredToken();

// Register SW only in production to avoid stale caches / 404s in dev
if (import.meta.env.PROD && window.location.hostname !== 'localhost') {
  registerSW({
    immediate: true,
    // onNeedRefresh() { /* show refresh UI */ },
    // onOfflineReady() { /* toast "ready to work offline" */ },
  });
}



// --- Error Boundary ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error('Error caught by ErrorBoundary:', error, errorInfo);
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface">
          <div className="w-full max-w-md p-8 rounded-3xl shadow-elevation-3 bg-surface border border-outline-variant text-center">
            <span className="material-symbols-outlined text-6xl text-error">error</span>
            <h1 className="text-2xl font-semibold mt-4">Oops! Something went wrong.</h1>
            <p className="text-on-surface-variant">Please refresh the page to continue.</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 rounded-full bg-primary text-on-primary hover:bg-primary-container transition-all duration-200 shadow-elevation-1"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// DEV diagnostics (optional)
if (import.meta.env.DEV) {
  window.__LITERATI_DEBUG__ = true;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  // Add <React.StrictMode> later if you want double-effect checks
  <ErrorBoundary>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ErrorBoundary>
);
