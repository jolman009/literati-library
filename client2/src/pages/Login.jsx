import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/Material3/Card';
import TextField from '../components/Material3/TextField';
import Button from '../components/Material3/Button';

const Login = () => {
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
    <div className="min-h-screen bg-surface relative overflow-hidden login-background">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Decorative Geometric Shapes */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/10 blur-3xl floating-element"></div>
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-secondary/10 blur-3xl floating-element"></div>
        <div className="absolute top-1/3 -right-16 w-32 h-32 rounded-full bg-tertiary/15 blur-2xl floating-element"></div>
        
        {/* Floating Book Icons */}
        <div className="absolute top-20 left-10 opacity-10 floating-element">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-primary">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
          </svg>
        </div>
        <div className="absolute bottom-20 right-16 opacity-10 floating-element">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-secondary">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
        <div className="absolute top-2/3 left-16 opacity-10 floating-element">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="text-tertiary">
            <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-8 login-container">
        <div className="w-full max-w-md">
          {/* Header Section */}
          <div className="text-center mb-8 login-logo">
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-3xl logo-container">
              <svg width="40" height="40" viewBox="0 0 100 100" className="text-primary">
                {/* Literati Feather Logo */}
                <path 
                  d="M20 20 L20 80 L40 80 L40 40 L60 20 C70 10, 80 15, 85 25 C90 35, 85 45, 75 50 L60 60 L80 60 C85 60, 90 65, 90 70 C90 75, 85 80, 80 80 L40 80" 
                  fill="currentColor" 
                  className="drop-shadow-sm"
                />
              </svg>
            </div>
            
            {/* Brand Text */}
            <h1 className="text-4xl font-bold text-on-surface mb-2 tracking-tight">
              Literati
            </h1>
            <p className="text-lg text-on-surface-variant font-medium">
              Your Digital Bookshelf
            </p>
          </div>

          {/* Login Card */}
          <Card className="login-card-enhanced shadow-2xl login-card">
            <div className="p-8">
              {/* Form Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-on-surface mb-2">
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="text-on-surface-variant">
                  {isSignUp 
                    ? 'Join thousands of book lovers' 
                    : 'Sign in to continue your reading journey'
                  }
                </p>
              </div>
              
              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 rounded-xl error-message">
                  <p className="text-sm text-error text-center font-medium">{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {isSignUp && (
                  <div className="space-y-2 login-field">
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
                
                <div className="space-y-2 login-field">
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
                
                <div className="space-y-2 login-field">
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
                  <div className="space-y-2 login-field">
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
                  className="w-full h-14 text-lg font-semibold login-button-primary" 
                  disabled={isLoading}
                >
                  {isLoading 
                    ? (
                      <div className="flex items-center justify-center space-x-3">
                        <div className="loading-spinner"></div>
                        <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
                      </div>
                    )
                    : (isSignUp ? 'Create Account' : 'Sign In')
                  }
                </Button>
              </form>

              {/* Divider */}
              <div className="my-8">
                <div className="relative divider-enhanced">
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-surface-container/80 text-on-surface-variant font-medium">
                      OR
                    </span>
                  </div>
                </div>
              </div>

              {/* Secondary Actions */}
              <div className="space-y-4">
                <Button
                  type="button"
                  variant="outlined"
                  className="w-full h-12 font-medium"
                  onClick={toggleMode}
                  disabled={isLoading}
                >
                  {isSignUp 
                    ? 'Already have an account? Sign In' 
                    : 'New to Literati? Create Account'
                  }
                </Button>

                {!isSignUp && (
                  <Button
                    type="button"
                    variant="text"
                    className="w-full h-12 font-medium text-primary"
                    onClick={handleDemoLogin}
                    disabled={isLoading}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
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
          <div className="text-center mt-8">
            <p className="text-sm text-on-surface-variant">
              By continuing, you agree to our{' '}
              <a href="#" className="text-primary font-medium footer-link">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-primary font-medium footer-link">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;