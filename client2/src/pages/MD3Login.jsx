import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MD3Card, MD3TextField, MD3Button, MD3Checkbox } from '../components/Material3';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Sun, Moon, Monitor } from 'lucide-react';
import '../styles/md3-login.css';

const MD3Login = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const { actualTheme, setTheme } = useMaterial3Theme();

  // form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // field errors
  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');

  // global page error
  const [formError, setFormError] = useState('');
  
  // success snackbar
  const [successMessage, setSuccessMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const validateInputs = useCallback(() => {
    let isValid = true;

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid email address.');
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }

    if (!password || password.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage('Password must be at least 6 characters long.');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    if (!isValid) {
      setFormError('Please fix the errors above and try again.');
    } else {
      setFormError('');
    }

    return isValid;
  }, [email, password]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateInputs()) return;

    try {
      setSubmitting(true);
      const result = await auth.login(email, password);

      if (result?.success) {
        setSuccessMessage(`Welcome back${result.user?.name ? `, ${result.user.name}` : ''}!`);
        setTimeout(() => navigate('/dashboard', { replace: true }), 1000);
      } else {
        setFormError(result?.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      setFormError(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const ThemeToggle = () => (
    <div className="md3-login-theme-toggle">
      <button
        onClick={() => setTheme('light')}
        className={`md3-login-theme-button ${actualTheme === 'light' ? 'active' : ''}`}
        aria-label="Light theme"
      >
        <Sun size={16} />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`md3-login-theme-button ${actualTheme === 'dark' ? 'active' : ''}`}
        aria-label="Dark theme"
      >
        <Moon size={16} />
      </button>
      <button
        onClick={() => setTheme('system')}
        className="md3-login-theme-button"
        aria-label="System theme"
      >
        <Monitor size={16} />
      </button>
    </div>
  );

  return (
    <div className="md3-login-container" data-theme={actualTheme}>
      <ThemeToggle />

      <MD3Card className="md3-login-card">
        <div className="md3-login-header">
          <img
            src="/literatiLOGO.png"
            alt="Literati"
            className="md3-login-logo"
          />
          <h1 className="md3-login-title">
            Welcome to Literati
          </h1>
          <h2 className="md3-login-subtitle">
            Sign in to continue
          </h2>
        </div>

        {/* Error Alert */}
        {formError && (
          <div className="md3-login-error-alert" role="alert">
            {formError}
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="md3-login-success-alert" role="alert">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="md3-login-form">
          <MD3TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError}
            helperText={emailErrorMessage}
            disabled={submitting}
            required
            autoFocus
            style={{ width: '100%' }}
          />

          <MD3TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={passwordError}
            helperText={passwordErrorMessage}
            disabled={submitting}
            required
            style={{ width: '100%' }}
          />

          <div className="md3-login-checkbox-wrapper">
            <MD3Checkbox
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={submitting}
            />
            <span className="md3-login-checkbox-label">
              Remember me
            </span>
          </div>

          <MD3Button
            type="submit"
            variant="filled"
            disabled={submitting}
            style={{ width: '100%' }}
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </MD3Button>

          <div className="text-center">
            <Link
              to="/forgot-password"
              className="md3-login-link"
            >
              Forgot your password?
            </Link>
          </div>
        </form>

        <div className="md3-login-divider-wrapper">
          <div className="md3-login-divider-line" />
          <span className="md3-login-divider-text">or</span>
        </div>

        <div className="md3-login-social-buttons">
          <MD3Button
            onClick={() => console.log('TODO: Sign in with Google')}
            variant="outlined"
            disabled={submitting}
            style={{ width: '100%' }}
          >
            Sign in with Google
          </MD3Button>

          <MD3Button
            onClick={() => console.log('TODO: Sign in with Facebook')}
            variant="outlined"
            disabled={submitting}
            style={{ width: '100%' }}
          >
            Sign in with Facebook
          </MD3Button>

          <div className="md3-login-signup-wrapper">
            <span className="md3-login-signup-text">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="md3-login-link md3-login-link-bold"
              >
                Sign up
              </Link>
            </span>
          </div>
        </div>
      </MD3Card>
    </div>
  );
};

export default MD3Login;