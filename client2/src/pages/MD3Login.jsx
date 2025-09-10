import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MD3Card, MD3TextField, MD3Button, MD3Checkbox } from '../components/Material3';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Sun, Moon, Monitor } from 'lucide-react';

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
    <div style={{
      position: 'fixed',
      top: '1rem',
      right: '1rem',
      display: 'flex',
      gap: '8px',
      background: actualTheme === 'dark' ? '#1e293b' : '#ffffff',
      borderRadius: '12px',
      padding: '4px',
      border: `1px solid ${actualTheme === 'dark' ? '#334155' : '#e5e7eb'}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <button
        onClick={() => setTheme('light')}
        style={{
          padding: '8px',
          borderRadius: '8px',
          border: 'none',
          background: actualTheme === 'light' ? '#6750a4' : 'transparent',
          color: actualTheme === 'light' ? '#ffffff' : actualTheme === 'dark' ? '#f1f5f9' : '#374151',
          cursor: 'pointer'
        }}
      >
        <Sun size={16} />
      </button>
      <button
        onClick={() => setTheme('dark')}
        style={{
          padding: '8px',
          borderRadius: '8px',
          border: 'none',
          background: actualTheme === 'dark' ? '#6750a4' : 'transparent',
          color: actualTheme === 'dark' ? '#ffffff' : '#374151',
          cursor: 'pointer'
        }}
      >
        <Moon size={16} />
      </button>
      <button
        onClick={() => setTheme('system')}
        style={{
          padding: '8px',
          borderRadius: '8px',
          border: 'none',
          background: 'transparent',
          color: actualTheme === 'dark' ? '#f1f5f9' : '#374151',
          cursor: 'pointer'
        }}
      >
        <Monitor size={16} />
      </button>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      background: actualTheme === 'dark' 
        ? 'radial-gradient(ellipse at center, #1e293b 0%, #0f172a 100%)'
        : 'radial-gradient(ellipse at center, #f8fafc 0%, #ffffff 100%)'
    }}>
      <ThemeToggle />
      
      <MD3Card style={{
        width: '100%',
        maxWidth: '400px',
        padding: '32px',
        background: actualTheme === 'dark' ? '#1e293b' : '#ffffff'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <img 
            src="/literatiLOGO.png" 
            alt="Literati" 
            style={{ 
              height: '80px', 
              width: 'auto',
              marginBottom: '16px',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
            }}
          />
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '500',
            color: actualTheme === 'dark' ? '#f1f5f9' : '#1f2937',
            marginBottom: '8px',
            textAlign: 'center'
          }}>
            Welcome to Literati
          </h1>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '400',
            color: actualTheme === 'dark' ? '#94a3b8' : '#6b7280',
            margin: 0,
            textAlign: 'center'
          }}>
            Sign in to continue
          </h2>
        </div>

        {/* Error Alert */}
        {formError && (
          <div style={{
            padding: '12px',
            marginBottom: '16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#dc2626',
            fontSize: '14px'
          }}>
            {formError}
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div style={{
            padding: '12px',
            marginBottom: '16px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            color: '#16a34a',
            fontSize: '14px'
          }}>
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MD3Checkbox
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={submitting}
            />
            <span style={{
              fontSize: '14px',
              color: actualTheme === 'dark' ? '#e2e8f0' : '#374151'
            }}>
              Remember me
            </span>
          </div>

          <MD3Button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              backgroundColor: '#6750a4',
              color: '#ffffff'
            }}
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </MD3Button>

          <div style={{ textAlign: 'center' }}>
            <Link 
              to="/forgot-password"
              style={{
                color: '#6750a4',
                textDecoration: 'none',
                fontSize: '14px'
              }}
            >
              Forgot your password?
            </Link>
          </div>
        </form>

        <div style={{
          margin: '24px 0',
          textAlign: 'center',
          position: 'relative'
        }}>
          <div style={{
            height: '1px',
            background: actualTheme === 'dark' ? '#334155' : '#e5e7eb'
          }} />
          <span style={{
            position: 'absolute',
            top: '-10px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: actualTheme === 'dark' ? '#1e293b' : '#ffffff',
            padding: '0 16px',
            fontSize: '14px',
            color: actualTheme === 'dark' ? '#94a3b8' : '#6b7280'
          }}>
            or
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <MD3Button
            onClick={() => console.log('TODO: Sign in with Google')}
            disabled={submitting}
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              color: actualTheme === 'dark' ? '#f1f5f9' : '#374151',
              border: `1px solid ${actualTheme === 'dark' ? '#334155' : '#e5e7eb'}`
            }}
          >
            Sign in with Google
          </MD3Button>

          <MD3Button
            onClick={() => console.log('TODO: Sign in with Facebook')}
            disabled={submitting}
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              color: actualTheme === 'dark' ? '#f1f5f9' : '#374151',
              border: `1px solid ${actualTheme === 'dark' ? '#334155' : '#e5e7eb'}`
            }}
          >
            Sign in with Facebook
          </MD3Button>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <span style={{
              fontSize: '14px',
              color: actualTheme === 'dark' ? '#94a3b8' : '#6b7280'
            }}>
              Don't have an account?{' '}
              <Link 
                to="/signup"
                style={{
                  color: '#6750a4',
                  textDecoration: 'none',
                  fontWeight: '500'
                }}
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