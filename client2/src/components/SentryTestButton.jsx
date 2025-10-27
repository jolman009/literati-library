// src/components/SentryTestButton.jsx - Sentry Error Testing Component
import * as Sentry from '@sentry/react';
import environmentConfig from '../config/environment.js';

// Test button to verify Sentry error tracking
function ErrorButton() {
  return (
    <button
      onClick={() => {
        throw new Error('This is your first error!');
      }}
      style={{
        backgroundColor: '#ff4444',
        color: 'white',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px',
        marginLeft: '10px'
      }}
    >
      Break the world
    </button>
  );
}

// Test various Sentry features
function SentryTestPanel() {
  const handleMessageTest = () => {
    Sentry.captureMessage('Test message from ShelfQuest!', 'info');
    alert('Test message sent to Sentry!');
  };

  const handleBreadcrumbTest = () => {
    Sentry.addBreadcrumb({
      message: 'User clicked breadcrumb test',
      category: 'user_action',
      level: 'info'
    });
    alert('Breadcrumb added! Now trigger an error to see it in context.');
  };

  const handleUserContextTest = () => {
    Sentry.setUser({
      id: 'test-user-123',
      email: 'test@shelfquest.org',
      username: 'test_reader'
    });
    alert('User context set! Future errors will include this user info.');
  };

  // Only show in development
  if (!environmentConfig.isDevelopment) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      minWidth: '200px'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
        🚨 Sentry Test Panel
      </div>

      <button
        onClick={handleMessageTest}
        style={{
          backgroundColor: '#2196F3',
          color: 'white',
          border: 'none',
          padding: '6px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '11px'
        }}
      >
        Send Test Message
      </button>

      <button
        onClick={handleBreadcrumbTest}
        style={{
          backgroundColor: '#FF9800',
          color: 'white',
          border: 'none',
          padding: '6px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '11px'
        }}
      >
        Add Breadcrumb
      </button>

      <button
        onClick={handleUserContextTest}
        style={{
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          padding: '6px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '11px'
        }}
      >
        Set User Context
      </button>

      <ErrorButton />

      <div style={{ fontSize: '10px', opacity: '0.7', marginTop: '8px' }}>
        Development only - configure VITE_SENTRY_DSN in .env.local
      </div>
    </div>
  );
}

// Wrap the test button with Sentry error boundary
const SentryTestButtonWithBoundary = Sentry.withErrorBoundary(SentryTestPanel, {
  fallback: ({ error, resetError }) => (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: '#ff4444',
      color: 'white',
      padding: '10px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <div>Error captured by Sentry!</div>
      <div style={{ fontSize: '10px', margin: '5px 0' }}>
        {error.message}
      </div>
      <button
        onClick={resetError}
        style={{
          background: 'white',
          color: '#ff4444',
          border: 'none',
          padding: '4px 8px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '10px'
        }}
      >
        Reset
      </button>
    </div>
  ),
  showDialog: false
});

export { ErrorButton, SentryTestPanel, SentryTestButtonWithBoundary };
export default SentryTestButtonWithBoundary;
