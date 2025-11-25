import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MD3TextField, MD3Button, MD3Checkbox } from '../components/Material3';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import './SignUpPage.css';

const SignUpPage = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const { actualTheme } = useMaterial3Theme();

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTos, setAcceptedTos] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);

  // Field errors + global error
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [formError, setFormError] = useState('');

  // Success message
  const [successMessage, setSuccessMessage] = useState('');

  const validate = useCallback(() => {
    let ok = true;

    // Reset
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmError('');
    setFormError('');

    if (!name.trim()) {
      setNameError('Name is required.');
      ok = false;
    }

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address.');
      ok = false;
    }

    if (!password || password.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      ok = false;
    }

    if (confirmPassword !== password) {
      setConfirmError('Passwords do not match.');
      ok = false;
    }

    if (!acceptedTos) {
      setFormError('You must accept the Terms of Service and Privacy Policy to continue.');
      ok = false;
    }

    return ok;
  }, [name, email, password, confirmPassword, acceptedTos]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth?.register) return;

    if (!validate()) return;

    setIsLoading(true);
    try {
      const result = await auth.register(email, password, name);
      if (result?.success) {
        setSuccessMessage(`Welcome to ShelfQuest${result.user?.name ? `, ${result.user.name}` : ''}!`);
        setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
      } else {
        setFormError(result?.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setFormError(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="md3-signup-container" data-theme={actualTheme}>
      {/* Decorative Background Elements */}
      <div className="signup-background">
        <div className="signup-gradient-orb orb-1"></div>
        <div className="signup-gradient-orb orb-2"></div>
        <div className="signup-gradient-orb orb-3"></div>
      </div>

      <div className="md3-signup-content">
        {/* Header Section */}
        <div className="md3-signup-header">
          <div className="md3-signup-logo-container">
            <div className="md3-signup-logo-circle">
              <img
                src="/ShelfQuest_logo_favicon.png"
                alt="ShelfQuest"
                className="md3-signup-logo"
              />
            </div>
            <span className="md3-signup-brand">ShelfQuest</span>
          </div>
          <h1 className="md3-signup-title">Create Your Account</h1>
          <p className="md3-signup-subtitle">
            Join ShelfQuest and start your reading journey today
          </p>
        </div>

        {/* Error Alert */}
        {formError && (
          <div className="md3-alert md3-alert-error" role="alert">
            <span className="material-symbols-outlined md3-alert-icon">error</span>
            <span className="md3-alert-message">{formError}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="md3-alert md3-alert-success" role="alert">
            <span className="material-symbols-outlined md3-alert-icon">check_circle</span>
            <span className="md3-alert-message">{successMessage}</span>
          </div>
        )}

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit} className="md3-signup-form" data-testid="signup-form">
          <div className="md3-form-row">
            <MD3TextField
              label="Full Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={!!nameError}
              helperText={nameError}
              disabled={isLoading}
              required
              autoFocus
              className="md3-signup-field"
              data-testid="name-input"
            />
          </div>

          <div className="md3-form-row">
            <MD3TextField
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!emailError}
              helperText={emailError}
              disabled={isLoading}
              required
              className="md3-signup-field"
              data-testid="email-input"
            />
          </div>

          <div className="md3-form-row">
            <MD3TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!passwordError}
              helperText={passwordError}
              disabled={isLoading}
              required
              className="md3-signup-field"
              data-testid="password-input"
            />
          </div>

          <div className="md3-form-row">
            <MD3TextField
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={!!confirmError}
              helperText={confirmError}
              disabled={isLoading}
              required
              className="md3-signup-field"
              data-testid="confirm-password-input"
            />
          </div>

          {/* Password Requirements */}
          <div className="md3-password-requirements">
            <span className="material-symbols-outlined requirements-icon">info</span>
            <span className="requirements-text">Password must be at least 8 characters long</span>
          </div>

          {/* Terms Checkbox */}
          <div className="md3-checkbox-field">
            <MD3Checkbox
              id="signup-accept-tos"
              checked={acceptedTos}
              onChange={(e) => setAcceptedTos(e.target.checked)}
              disabled={isLoading}
            />
            <label htmlFor="signup-accept-tos" className="md3-checkbox-label">
              I agree to the{' '}
              <Link
                to="/legal/terms-of-service"
                target="_blank"
                rel="noopener noreferrer"
                className="md3-link"
              >
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link
                to="/legal/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="md3-link"
              >
                Privacy Policy
              </Link>
            </label>
          </div>

          {/* Submit Button */}
          <MD3Button
            type="submit"
            variant="filled"
            disabled={isLoading}
            className="md3-signup-submit"
            data-testid="signup-button"
          >
            {isLoading ? (
              <>
                <span className="md3-button-spinner"></span>
                Creating account...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">rocket_launch</span>
                Create Account
              </>
            )}
          </MD3Button>
        </form>

        {/* Sign In Link */}
        <div className="md3-signup-footer">
          <span className="md3-signup-footer-text">
            Already have an account?{' '}
            <Link to="/login" className="md3-link md3-link-bold" data-testid="login-link">
              Sign in
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
