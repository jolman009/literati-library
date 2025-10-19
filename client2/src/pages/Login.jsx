import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

    console.log('🔐 Attempting login/signup:', { email, isSignUp });

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
        console.log('🔐 Calling auth.login...');
        const result = await auth.login(email, password);
        console.log('🔐 Login result:', result);

        if (result.success) {
          console.log('✅ Login successful, navigating to dashboard');
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

  const handleDemoLogin = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      const result = await auth.login('demo@example.com', 'Demo123456!');
      
      if (result.success) {
        navigate('/dashboard', { replace: true });
      } else {
        setError('Demo login failed. Please try again.');
      }
    } catch (err) {
      setError('Demo login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
              <svg width="40" height="40" viewBox="0 0 100 100" className="logo-svg">
                <path
                  d="M20 20 L20 80 L40 80 L40 40 L60 20 C70 10, 80 15, 85 25 C90 35, 85 45, 75 50 L60 60 L80 60 C85 60, 90 65, 90 70 C90 75, 85 80, 80 80 L40 80"
                  fill="currentColor"
                />
              </svg>
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
              <form onSubmit={handleSubmit} className="login-form">
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
                    />
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="filled"
                  className="login-button-primary"
                  disabled={isLoading}
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
                >
                  {isSignUp
                    ? 'Already have an account? Sign In'
                    : 'New to ShelfQuest? Create Account'
                  }
                </Button>

                {!isSignUp && (
                  <Button
                    type="button"
                    variant="text"
                    className="secondary-button"
                    onClick={handleDemoLogin}
                    disabled={isLoading}
                  >
                    <div className="demo-button-content">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="demo-icon">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      <span>Try Demo Account</span>
                    </div>
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Footer */}
          <div className="login-footer">
            <p className="login-footer-text">
              By continuing, you agree to our{' '}
              <a href="#" className="footer-link">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="footer-link">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;