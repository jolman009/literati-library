import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
import Card from '../components/Material3/Card';
import TextField from '../components/Material3/TextField';
import Button from '../components/Material3/Button';
import '../styles/login.css';

const Login = () => {
  const { actualTheme } = useMaterial3Theme();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const auth = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    console.warn('🔐 Attempting login/signup:', { email, isSignUp });

    try {
      if (isSignUp) {
        // Validation for sign up
        if (!name.trim()) {
          setError('Name is required');
          setIsLoading(false);
          return;
        }
        
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }
        
        if (password.length < 8) {
          setError('Password must be at least 8 characters');
          setIsLoading(false);
          return;
        }

        // Register new user
        const result = await auth.register(email, password, name);
        
        if (result.success) {
          navigate('/dashboard', { replace: true });
        } else {
          setError(result.error || 'Registration failed. Please try again.');
        }
      } else {
        // Sign in existing user
        console.warn('🔐 Calling auth.login...');
        const result = await auth.login(email, password);
        console.warn('🔐 Login result:', result);

        if (result.success) {
          console.warn('✅ Login successful, navigating to dashboard');
          navigate('/dashboard', { replace: true });
        } else {
          console.error('❌ Login failed:', result.error);
          setError(result.error || 'Login failed. Please try again.');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    // Clear password fields when switching modes
    setPassword('');
    setConfirmPassword('');
  };


  return (
    <div className="login-background" data-theme={actualTheme}>
      {/* Background Elements */}
      <div>
        {/* Decorative orbs - styled in CSS */}
        <div className="floating-element"></div>
        <div className="floating-element"></div>
        <div className="floating-element"></div>
      </div>

      {/* Main Content */}
      <div className="login-container">
        <div className="login-content-wrapper">
          {/* Header Section */}
          <div className="login-logo">
            {/* Logo */}
            <div className="logo-container">
              <img
                src="/Shelfquest_logo.png"
                alt="ShelfQuest"
                className="logo-image"
                width="120"
                height="120"
              />
            </div>

            {/* Brand Text */}
            <h1 className="brand-title">ShelfQuest</h1>
            <p className="brand-subtitle">Your Digital Bookshelf</p>
          </div>

          {/* Login Card */}
          <Card className="login-card-enhanced login-card">
            <div className="login-card-content">
              {/* Form Header */}
              <div className="login-form-header">
                <h2 className="login-form-title">
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="login-form-subtitle">
                  {isSignUp
                    ? 'Join thousands of book lovers'
                    : 'Sign in to continue your reading journey'
                  }
                </p>
              </div>
              
              {/* Error Message */}
              {error && (
                <div className="error-message">
                  <p className="error-text">{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="login-form" data-testid="login-form">
                {isSignUp && (
                  <div className="login-field">
                    <TextField
                      label="Full Name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={isLoading}
                      className="w-full"
                      data-testid="name-input"
                    />
                  </div>
                )}

                <div className="login-field">
                  <TextField
                    label="Email Address"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="w-full"
                    data-testid="email-input"
                  />
                </div>

                <div className="login-field">
                  <TextField
                    label="Password"
                    type="password"
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="w-full"
                    data-testid="password-input"
                  />
                </div>

                {isSignUp && (
                  <div className="login-field">
                    <TextField
                      label="Confirm Password"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="w-full"
                      data-testid="confirm-password-input"
                    />
                  </div>
                )}

                {/* 👇 ADD THIS NEW CODE - Forgot Password Link 👇 */}
                {!isSignUp && (
                  <div className="forgot-password-container">
                  <Link 
                    to="/reset-password" 
                    className="forgot-password-link"
                    tabIndex={isLoading ? -1 : 0}
                  >
                    Forgot password?
                  </Link>
                  </div>
                )}
                
                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="filled"
                  className="login-button-primary"
                  disabled={isLoading}
                  data-testid="login-button"
                >
                  {isLoading
                    ? (
                      <div className="loading-content">
                        <div className="loading-spinner"></div>
                        <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
                      </div>
                    )
                    : (isSignUp ? 'Create Account' : 'Sign In')
                  }
                </Button>
              </form>

              {/* Divider */}
              <div className="login-divider">
                <div className="divider-enhanced">
                  <div className="divider-content">
                    <span className="divider-text">OR</span>
                  </div>
                </div>
              </div>

              {/* Secondary Actions */}
              <div className="secondary-actions">
                <Button
                  type="button"
                  variant="outlined"
                  className="secondary-button"
                  onClick={toggleMode}
                  disabled={isLoading}
                  data-testid="toggle-auth-mode"
                >
                  {isSignUp
                    ? 'Already have an account? Sign In'
                    : 'New to ShelfQuest? Create Account'
                  }
                </Button>

              </div>
            </div>
          </Card>

          {/* Footer */}
          <div className="login-footer">
            <p className="login-footer-text">
              By continuing, you agree to our{' '}
              <Link to="/legal/terms-of-service" className="footer-link">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/legal/privacy-policy" className="footer-link">Privacy Policy</Link>
              {' '}•{' '}
              <Link to="/contact" className="footer-link">Contact Us</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
