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
      <div className="md3-login-box">
        <img src="/literatiLOGO.png" alt="Literati" className="md3-login-logo" />
        <h1 className="md3-login-title">Sign In</h1>

        {error && (
          <div style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            backgroundColor: 'var(--md-sys-color-error-container)',
            color: 'var(--md-sys-color-on-error-container)',
            borderRadius: '8px',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="md3-login-form">
          <MD3TextField
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            disabled={submitting}
          />

          <MD3TextField
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            disabled={submitting}
          />

          <MD3Button type="submit" variant="filled" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign In'}
          </MD3Button>
        </form>

        <div className="md3-login-divider">or</div>

        <div className="md3-login-social">
          <MD3Button variant="outlined">
            Sign in with Google
          </MD3Button>
          <MD3Button variant="outlined">
            Sign in with Facebook
          </MD3Button>
        </div>

        <div style={{ marginTop: '1.5rem', fontSize: '0.875rem' }}>
          Don't have an account?{' '}
          <Link to="/signup" className="md3-login-link">Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default MD3Login;
