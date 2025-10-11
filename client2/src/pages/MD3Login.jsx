import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MD3TextField, MD3Button } from '../components/Material3';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import '../styles/md3-login.css';

const MD3Login = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const { actualTheme } = useMaterial3Theme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const result = await auth.login(email, password);
      if (result?.success) {
        navigate('/dashboard', { replace: true });
      } else {
        setError(result?.error || 'Login failed');
      }
    } catch (err) {
      setError('Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="md3-login-container" data-theme={actualTheme}>
      {/* Decorative Background Elements */}
      <div className="login-background">
        <div className="login-gradient-orb orb-1"></div>
        <div className="login-gradient-orb orb-2"></div>
        <div className="login-gradient-orb orb-3"></div>
      </div>

      <div className="md3-login-content">
        {/* Header Section */}
        <div className="md3-login-header">
          <img
            src="/literatiLOGO.png"
            alt="Literati"
            className="md3-login-logo"
          />
          <h1 className="md3-login-title">Welcome Back</h1>
          <p className="md3-login-subtitle">
            Sign in to continue your reading journey
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="md3-alert md3-alert-error" role="alert">
            <span className="material-symbols-outlined md3-alert-icon">error</span>
            <span className="md3-alert-message">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="md3-login-form">
          <div className="md3-form-row">
            <MD3TextField
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
              autoFocus
              className="md3-login-field"
            />
          </div>

          <div className="md3-form-row">
            <MD3TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={submitting}
              className="md3-login-field"
            />
          </div>

          {/* Submit Button */}
          <MD3Button
            type="submit"
            variant="filled"
            disabled={submitting}
            className="md3-login-submit"
          >
            {submitting ? (
              <>
                <span className="md3-button-spinner"></span>
                Signing in...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">login</span>
                Sign In
              </>
            )}
          </MD3Button>
        </form>

        {/* Divider for Social Login */}
        <div className="md3-login-divider">
          <span className="divider-line"></span>
          <span className="divider-text">or continue with</span>
          <span className="divider-line"></span>
        </div>

        {/* Social Login Buttons */}
        <div className="md3-login-social">
          <MD3Button variant="outlined" className="md3-social-button">
            <span className="social-icon">🔍</span>
            Google
          </MD3Button>
          <MD3Button variant="outlined" className="md3-social-button">
            <span className="social-icon">📘</span>
            Facebook
          </MD3Button>
        </div>

        {/* Sign Up Link */}
        <div className="md3-login-footer">
          <span className="md3-login-footer-text">
            Don't have an account?{' '}
            <Link to="/signup" className="md3-link md3-link-bold">
              Sign up
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
};

export default MD3Login;
