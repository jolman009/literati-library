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

  // Password Validation Logic
  const validation = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    noUsername: () => {
      if (!email || !email.includes('@')) return true;
      const username = email.split('@')[0].toLowerCase();
      return !password.toLowerCase().includes(username);
    }
  };

  const isPasswordValid = Object.values(validation).every(v => 
    typeof v === 'function' ? v() : v
  );

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError('Please ensure your password meets all requirements.');
      return;
    }

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

        <form onSubmit={handleLogin} className="login-form">
          <MD3TextField
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
          />

          <MD3TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            trailingIcon={
              <span 
                style={{ cursor: 'pointer', fontSize: '1.2rem' }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '🙈'}
              </span>
            }
          />

          <div className="password-requirements">
            <Requirement label="8+ characters" met={validation.length} />
            <Requirement label="Uppercase & Lowercase" met={validation.upper && validation.lower} />
            <Requirement label="Number & Special Character" met={validation.number && validation.special} />
            <Requirement label="Does not contain email username" met={validation.noUsername()} />
          </div>

          {error && (
            <div style={{ color: 'var(--md-sys-color-error)', fontSize: '0.8rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <MD3Button 
            type="submit" 
            variant="primary" 
            disabled={loading || !isPasswordValid}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </MD3Button>
        </form>

        <div className="login-footer">
          <Link to="/forgot-password" title="Forgot Password" className="login-link">
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

// Small helper component for requirements
const Requirement = ({ label, met }) => (
  <div className={`requirement-item ${met ? 'met' : 'unmet'}`}>
    <span>{met ? '✓' : '○'}</span>
    <span>{label}</span>
  </div>
);

export default LoginV2;