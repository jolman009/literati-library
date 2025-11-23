import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import environmentConfig from '../config/environment.js';
import './ResetPassword.css';

/**
 * UpdatePassword Component
 * 
 * Allows users to set a new password after clicking the reset link.
 * Works with ShelfQuest's custom backend API.
 * 
 * Features:
 * - Password strength validation
 * - Confirmation matching
 * - Show/hide password toggle
 * - Real-time validation feedback
 * - Accessible form controls
 * - Success redirect to login
 */
const UpdatePassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [resetToken, setResetToken] = useState('');

  // Extract reset token from URL
  useEffect(() => {
    const token = searchParams.get('token') || searchParams.get('reset_token');
    
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset.');
    } else {
      setResetToken(token);
      console.warn('Reset token found:', token);
    }
  }, [searchParams]);

  // Password strength validation
  const validatePassword = (pwd) => {
    const errors = {};
    
    if (pwd.length < 8) {
      errors.length = 'Password must be at least 8 characters';
    }
    
    if (!/[A-Z]/.test(pwd)) {
      errors.uppercase = 'Include at least one uppercase letter';
    }
    
    if (!/[a-z]/.test(pwd)) {
      errors.lowercase = 'Include at least one lowercase letter';
    }
    
    if (!/[0-9]/.test(pwd)) {
      errors.number = 'Include at least one number';
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
      errors.special = 'Include at least one special character';
    }

    return errors;
  };

  // Calculate password strength
  const getPasswordStrength = (pwd) => {
    const errors = validatePassword(pwd);
    const errorCount = Object.keys(errors).length;
    
    if (errorCount === 0) return { label: 'Strong', value: 100, color: 'success' };
    if (errorCount <= 2) return { label: 'Medium', value: 60, color: 'warning' };
    return { label: 'Weak', value: 30, color: 'error' };
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setError('');
    

  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Check for reset token
    if (!resetToken) {
      setError('Invalid reset token. Please request a new password reset.');
      return;
    }

    // Validate passwords
    if (!password) {
      setError('Please enter a new password');
      return;
    }

    const errors = validatePassword(password);
    if (Object.keys(errors).length > 0) {
      setError('Password does not meet requirements');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Call backend to update password
      const API_URL = environmentConfig.apiUrl;

      const response = await fetch(`${API_URL}/auth/secure/reset-password/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: resetToken,
          newPassword: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to update password');
      }

      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Password updated successfully! Please login with your new password.' 
          }
        });
      }, 3000);
    } catch (error) {
      console.error('Error updating password:', error);
      setError(error.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = password ? getPasswordStrength(password) : null;

  // Success State
  if (success) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-card">
          <div className="reset-password-success">
            <div className="success-icon" role="img" aria-label="Success">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <path 
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" 
                  fill="var(--md-sys-color-primary)"
                />
              </svg>
            </div>
            <h1 className="reset-password-title">Password Updated!</h1>
            <p className="success-message">
              Your password has been successfully updated.
            </p>
            <p className="success-instructions">
              Redirecting to login page...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        {/* Header */}
        <div className="reset-password-header">
          <div className="reset-password-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path 
                d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" 
                fill="currentColor"
              />
            </svg>
          </div>
          <h1 className="reset-password-title">Create New Password</h1>
          <p className="reset-password-subtitle">
            Choose a strong password to secure your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="reset-password-form" noValidate>
          {/* New Password Field */}
          <div className="form-field">
            <label htmlFor="new-password" className="form-label">
              New Password
            </label>
            <div className="input-wrapper password-wrapper">
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter new password"
                value={password}
                onChange={handlePasswordChange}
                disabled={loading || !resetToken}
                autoComplete="new-password"
                autoFocus
                aria-invalid={!!error}
                aria-describedby="password-requirements"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  {showPassword ? (
                    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" fill="currentColor" />
                  ) : (
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor" />
                  )}
                </svg>
              </button>
            </div>

            {/* Password Strength Indicator */}
            {password && passwordStrength && (
              <div className="password-strength" role="status" aria-live="polite">
                <div className="strength-bar">
                  <div 
                    className={`strength-fill strength-${passwordStrength.color}`}
                    style={{ width: `${passwordStrength.value}%` }}
                    aria-hidden="true"
                  ></div>
                </div>
                <span className={`strength-label strength-${passwordStrength.color}`}>
                  {passwordStrength.label}
                </span>
              </div>
            )}

            {/* Password Requirements */}
            <div id="password-requirements" className="password-requirements">
              <p className="requirements-title">Password must include:</p>
              <ul className="requirements-list">
                <li className={password.length >= 8 ? 'requirement-met' : ''}>
                  <span className="requirement-icon" aria-hidden="true">
                    {password.length >= 8 ? '✓' : '○'}
                  </span>
                  At least 8 characters
                </li>
                <li className={/[A-Z]/.test(password) ? 'requirement-met' : ''}>
                  <span className="requirement-icon" aria-hidden="true">
                    {/[A-Z]/.test(password) ? '✓' : '○'}
                  </span>
                  One uppercase letter
                </li>
                <li className={/[a-z]/.test(password) ? 'requirement-met' : ''}>
                  <span className="requirement-icon" aria-hidden="true">
                    {/[a-z]/.test(password) ? '✓' : '○'}
                  </span>
                  One lowercase letter
                </li>
                <li className={/[0-9]/.test(password) ? 'requirement-met' : ''}>
                  <span className="requirement-icon" aria-hidden="true">
                    {/[0-9]/.test(password) ? '✓' : '○'}
                  </span>
                  One number
                </li>
                <li className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'requirement-met' : ''}>
                  <span className="requirement-icon" aria-hidden="true">
                    {/[!@#$%^&*(),.?":{}|<>]/.test(password) ? '✓' : '○'}
                  </span>
                  One special character
                </li>
              </ul>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="form-field">
            <label htmlFor="confirm-password" className="form-label">
              Confirm Password
            </label>
            <div className="input-wrapper password-wrapper">
              <input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                className={`form-input ${confirmPassword && password !== confirmPassword ? 'input-error' : ''}`}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError('');
                }}
                disabled={loading || !resetToken}
                autoComplete="new-password"
                aria-invalid={confirmPassword && password !== confirmPassword}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  {showConfirmPassword ? (
                    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" fill="currentColor" />
                  ) : (
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor" />
                  )}
                </svg>
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="form-error" role="alert">
                Passwords do not match
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="form-error-banner" role="alert">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
              </svg>
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="reset-password-button button-filled"
            disabled={loading || !password || !confirmPassword || password !== confirmPassword || !resetToken}
            aria-busy={loading}
          >
            {loading ? (
              <span className="button-loading">
                <span className="loading-spinner" aria-hidden="true"></span>
                <span>Updating...</span>
              </span>
            ) : (
              'Update Password'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdatePassword;
