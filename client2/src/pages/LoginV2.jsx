import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMaterial3 } from '../hooks/useMaterial3';
import MD3TextField from '../components/Material3/MD3TextField';
import MD3Button from '../components/Material3/MD3Button';
import './LoginV2.css';

const LoginV2 = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const { isDarkMode } = useMaterial3();

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
    <div className={`login-v2-container ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="login-card">
        <div className="login-header">
          <h1>Welcome Back</h1>
          <p>Sign in to your Literati Library</p>
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
                style={{ cursor: 'pointer', fontSize: '1.2rem' }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '🙈'}
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
