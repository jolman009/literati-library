import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMaterial3 } from '../hooks/useMaterial3';
import MD3TextField from '../components/Material3/MD3TextField';
import MD3Button from '../components/Material3/MD3Button';
import environmentConfig from '../config/environment.js';
import './LoginV2.css';

/**
 * RequestPasswordReset
 *
 * The "forgot password" entry point at /forgot-password. Collects the user's
 * email and calls the backend `/auth/secure/reset-password` endpoint, which
 * (by design) always responds with a generic success message to avoid leaking
 * which emails are registered. Once a link is sent, we show a confirmation.
 *
 * Note: this is distinct from ResetPassword.jsx (mounted at /reset-password
 * and /update-password), which sets a NEW password using a token from the
 * emailed link.
 */
const RequestPasswordReset = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { isDark } = useMaterial3();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const apiUrl = environmentConfig.apiUrl;
      const response = await fetch(`${apiUrl}/auth/secure/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      // The endpoint returns a generic success body even for unknown emails to
      // prevent account enumeration, so any non-5xx response is treated as sent.
      if (response.status >= 500) {
        throw new Error('Something went wrong. Please try again in a moment.');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`login-v2-container ${isDark ? 'dark' : 'light'}`}>
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-container">
            <div className="login-logo-wrapper">
              <img src="/ShelfQuest_logo_v3.png" alt="ShelfQuest Logo" className="login-logo-img" />
            </div>
          </div>
          <h1>Reset your password</h1>
          <p>Enter your email and we&apos;ll send you a link to reset your password.</p>
        </div>

        {submitted ? (
          <div
            role="status"
            data-testid="reset-success"
            style={{ textAlign: 'center', color: 'var(--md-sys-color-on-surface)', padding: '0.5rem 0' }}
          >
            Password reset link sent! If an account exists for{' '}
            <strong>{email}</strong>, you&apos;ll receive instructions to reset your password shortly.
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="login-form"
            data-testid="forgot-password-form"
            aria-label="Request a password reset"
          >
            <MD3TextField
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              data-testid="email-input"
              aria-label="Email Address"
            />

            {error && (
              <div
                role="alert"
                style={{ color: 'var(--md-sys-color-error)', fontSize: '0.8rem', textAlign: 'center' }}
                data-testid="reset-error"
              >
                {error}
              </div>
            )}

            <MD3Button
              type="submit"
              variant="primary"
              disabled={loading}
              data-testid="reset-password-button"
              aria-label="Send password reset link"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </MD3Button>
          </form>
        )}

        <div className="login-footer">
          <p style={{ fontSize: '0.875rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
            Remembered it? <Link to="/login" className="login-link">Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RequestPasswordReset;
