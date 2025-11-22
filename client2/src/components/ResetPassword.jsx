import React, { useState } from 'react';
import { supabase } from '../config/supabaseClient';
import './ResetPassword.css';

/**
 * ResetPassword Component
 * 
 * Allows users to request a password reset link via email.
 * Follows Material Design 3 expressive design principles.
 * 
 * Features:
 * - Email validation
 * - Loading states with Material animations
 * - Success/error feedback
 * - Accessible form controls
 * - Mobile-responsive design
 */
const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  // Email validation regex
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    setMessage('');
    setError('');

    // Validate email
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;

      setEmailSent(true);
      setMessage('Password reset link sent! Check your email inbox.');
      setEmail(''); // Clear email field
    } catch (error) {
      console.error('Error sending reset email:', error);
      setError(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setEmailSent(false);
    setMessage('');
    setError('');
  };

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        {/* Header */}
        <div className="reset-password-header">
          <div className="reset-password-icon">
            <svg 
              width="48" 
              height="48" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path 
                d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" 
                fill="currentColor"
              />
            </svg>
          </div>
          <h1 className="reset-password-title">Reset Password</h1>
          <p className="reset-password-subtitle">
            {emailSent 
              ? 'Email sent successfully' 
              : 'Enter your email address and we\'ll send you a link to reset your password'}
          </p>
        </div>

        {/* Success State */}
        {emailSent ? (
          <div className="reset-password-success">
            <div className="success-icon" role="img" aria-label="Success">
              <svg 
                width="64" 
                height="64" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" 
                  fill="var(--md-sys-color-primary)"
                />
              </svg>
            </div>
            <p className="success-message">{message}</p>
            <div className="success-instructions">
              <p>Check your email inbox for a password reset link.</p>
              <p>The link will expire in 60 minutes for security purposes.</p>
            </div>
            <button 
              type="button"
              className="reset-password-button button-text"
              onClick={handleResend}
              aria-label="Send another reset link"
            >
              Send Another Link
            </button>
          </div>
        ) : (
          /* Form State */
          <form onSubmit={handleResetPassword} className="reset-password-form" noValidate>
            {/* Email Input */}
            <div className="form-field">
              <label htmlFor="reset-email" className="form-label">
                Email Address
              </label>
              <div className="input-wrapper">
                <input
                  id="reset-email"
                  type="email"
                  className={`form-input ${error && !email.trim() ? 'input-error' : ''}`}
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(''); // Clear error on change
                  }}
                  disabled={loading}
                  autoComplete="email"
                  autoFocus
                  aria-invalid={!!error}
                  aria-describedby={error ? 'reset-email-error' : undefined}
                  required
                />
                {email && (
                  <button
                    type="button"
                    className="input-clear"
                    onClick={() => setEmail('')}
                    disabled={loading}
                    aria-label="Clear email"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path 
                        d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" 
                        fill="currentColor"
                      />
                    </svg>
                  </button>
                )}
              </div>
              {error && (
                <p id="reset-email-error" className="form-error" role="alert">
                  {error}
                </p>
              )}
            </div>

            {/* Success Message */}
            {message && !emailSent && (
              <div className="form-message" role="status">
                {message}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="reset-password-button button-filled"
              disabled={loading || !email.trim()}
              aria-busy={loading}
            >
              {loading ? (
                <span className="button-loading">
                  <span className="loading-spinner" aria-hidden="true"></span>
                  <span>Sending...</span>
                </span>
              ) : (
                'Send Reset Link'
              )}
            </button>

            {/* Back to Login Link */}
            <div className="reset-password-footer">
              <a href="/login" className="footer-link">
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  aria-hidden="true"
                >
                  <path 
                    d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" 
                    fill="currentColor"
                  />
                </svg>
                Back to Login
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
