import { useEffect, useRef, useCallback, useState } from 'react';
import environmentConfig from '../config/environment.js';

const GoogleSignInButton = ({ onSuccess, onError, text = 'signin_with' }) => {
  const buttonRef = useRef(null);
  const initializedRef = useRef(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleCredentialResponse = useCallback((response) => {
    if (response.credential) {
      onSuccess(response.credential);
    } else {
      onError?.('No credential received from Google');
    }
  }, [onSuccess, onError]);

  useEffect(() => {
    const clientId = environmentConfig.google.clientId;
    if (!clientId) {
      console.warn('Google Client ID not configured (VITE_GOOGLE_CLIENT_ID)');
      setStatusMessage('Google sign-in is not configured for this environment.');
      return;
    }

    let attempts = 0;
    const maxAttempts = 20;

    const tryInitialize = () => {
      if (initializedRef.current) return;
      if (!window.google?.accounts?.id) {
        attempts++;
        if (attempts >= maxAttempts) {
          console.warn('Google Identity Services failed to load');
          setStatusMessage('Google sign-in failed to load. Please refresh or try again later.');
          return;
        }
        return; // interval will retry
      }

      initializedRef.current = true;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        itp_support: true
      });

      if (buttonRef.current) {
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text,
          shape: 'rectangular',
          width: '100%'
        });
      }
    };

    // Try immediately, then poll
    tryInitialize();
    const interval = setInterval(tryInitialize, 200);

    return () => {
      clearInterval(interval);
      initializedRef.current = false;
    };
  }, [handleCredentialResponse, text]);

  return (
    <div
      ref={buttonRef}
      style={{
        display: 'flex',
        justifyContent: 'center',
        minHeight: 44,
        width: '100%'
      }}
      aria-live="polite"
    >
      {statusMessage && (
        <span className="google-signin-fallback md3-body-medium md3-on-surface-variant">
          {statusMessage}
        </span>
      )}
    </div>
  );
};

export default GoogleSignInButton;
