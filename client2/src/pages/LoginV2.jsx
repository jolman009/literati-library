import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMaterial3 } from '../hooks/useMaterial3';
import MD3TextField from '../components/Material3/MD3TextField';
import MD3Button from '../components/Material3/MD3Button';
import GoogleSignInButton from '../components/GoogleSignInButton';
import AuthBrandPanel from './AuthBrandPanel';
import './LoginV2.css';

const LoginV2 = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [rateLimited, setRateLimited] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { isDark, theme, toggleTheme } = useMaterial3();

  const handleLogin = async (e) => {
    e.preventDefault();

    setError('');
    setRateLimited(false);
    setLoading(true);

    // login() resolves to { success, error, status, code } — it does NOT throw,
    // so we must branch on the result rather than relying on a catch block.
    const result = await login(email, password);
    setLoading(false);

    if (result?.success) {
      navigate('/dashboard');
      return;
    }

    const isRateLimited =
      result?.status === 429 ||
      result?.code === 'ACCOUNT_LOCKED' ||
      /too many|locked|rate limit|try again later/i.test(result?.error || '');

    if (isRateLimited) {
      setRateLimited(true);
    } else {
      // Ensure the message clearly signals bad credentials.
      setError(
        result?.error && /invalid|incorrect/i.test(result.error)
          ? result.error
          : 'Invalid email or password. Please check your credentials and try again.'
      );
    }
  };

  return (
    <div className={`auth-v2-layout ${isDark ? 'dark' : 'light'}`}>
      <AuthBrandPanel theme={theme} toggleTheme={toggleTheme} />

      <div className="auth-form-pane login-v2-container">
        <div className="login-card">
        <div className="login-header">
          <div className="login-logo-container">
            <div className="login-logo-wrapper">
              <img src="/ShelfQuest_logo_v3.png" alt="ShelfQuest Logo" className="login-logo-img" />
            </div>
          </div>
          <h1>Welcome Back</h1>
          <p>Sign in to your ShelfQuest Digital Library</p>
        </div>

        <GoogleSignInButton
          onSuccess={async (credential) => {
            try {
              setError('');
              setLoading(true);
              const result = await loginWithGoogle(credential);
              if (result.success) {
                navigate('/dashboard');
              } else {
                setError(result.error || 'Google sign-in failed. Please try again.');
              }
            } catch (err) {
              setError('Google sign-in failed. Please try again.');
            } finally {
              setLoading(false);
            }
          }}
          onError={() => setError('Google sign-in failed. Please try again.')}
        />

        <div className="auth-divider">
          <span>or</span>
        </div>

        {/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- explicit role required by E2E a11y contract */}
        <form
          onSubmit={handleLogin}
          className="login-form"
          data-testid="login-form"
          role="form"
          aria-label="Sign in to ShelfQuest"
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

          <MD3TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            data-testid="password-input"
            aria-label="Password"
            trailingIcon={
              <span
                className="material-symbols-outlined password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'visibility' : 'visibility_off'}
              </span>
            }
          />

          {error && (
            <div
              role="alert"
              style={{ color: 'var(--md-sys-color-error)', fontSize: '0.8rem', textAlign: 'center' }}
              data-testid="login-error"
            >
              {error}
            </div>
          )}

          {rateLimited && (
            <div
              role="alert"
              style={{ color: 'var(--md-sys-color-error)', fontSize: '0.8rem', textAlign: 'center' }}
              data-testid="rate-limit-error"
            >
              Too many login attempts. Please wait a few minutes before trying again.
            </div>
          )}

          <MD3Button
            type="submit"
            variant="primary"
            disabled={loading}
            data-testid="login-button"
            aria-label="Sign in"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </MD3Button>
        </form>

        <div className="login-footer">
          <Link 
            to="/forgot-password" 
            title="Forgot Password" 
            className="login-link"
            data-testid="forgot-password-link"
          >
            Forgot Password?
          </Link>
          <p style={{ fontSize: '0.875rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
            New here? <Link to="/signup" className="login-link">Create an account</Link>
          </p>
        </div>
        </div>
      </div>
    </div>
  );
};

export default LoginV2;
