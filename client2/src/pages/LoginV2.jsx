import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMaterial3 } from '../hooks/useMaterial3';
import MD3TextField from '../components/Material3/MD3TextField';
import MD3Button from '../components/Material3/MD3Button';
import GoogleSignInButton from '../components/GoogleSignInButton';
import './LoginV2.css';

const LoginV2 = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { isDark } = useMaterial3();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to sign in. Please check your credentials.');
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
              <img src="/ShelfQuest_logo_v2.png" alt="ShelfQuest Logo" className="login-logo-img" />
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
              await loginWithGoogle(credential);
              navigate('/dashboard');
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

        <form onSubmit={handleLogin} className="login-form" data-testid="login-form">
          <MD3TextField
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            data-testid="email-input"
          />

          <MD3TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            data-testid="password-input"
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
              style={{ color: 'var(--md-sys-color-error)', fontSize: '0.8rem', textAlign: 'center' }}
              data-testid="login-error"
            >
              {error}
            </div>
          )}

          <MD3Button 
            type="submit" 
            variant="primary" 
            disabled={loading}
            data-testid="login-button"
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
  );
};

export default LoginV2;
