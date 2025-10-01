import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MD3Card, MD3TextField, MD3Button, MD3Checkbox } from '../components/Material3';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Sun, Moon, Monitor } from 'lucide-react';

const SignUpPage = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const { actualTheme, setTheme } = useMaterial3Theme();

  // form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTos, setAcceptedTos] = useState(false);

  // ui state
  const [isLoading, setIsLoading] = useState(false);

  // field errors + global error
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [formError, setFormError] = useState('');

  // success message
  const [successMessage, setSuccessMessage] = useState('');

  const validate = useCallback(() => {
    let ok = true;

    // reset
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmError('');
    setFormError('');

    if (!name.trim()) {
      setNameError('Name is required.');
      ok = false;
    }

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address.');
      ok = false;
    }

    if (!password || password.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      ok = false;
    }

    if (confirmPassword !== password) {
      setConfirmError('Passwords do not match.');
      ok = false;
    }

    if (!acceptedTos) {
      setFormError('You must accept the Terms to continue.');
      ok = false;
    }

    return ok;
  }, [name, email, password, confirmPassword, acceptedTos]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth?.register) return;

    if (!validate()) return;

    setIsLoading(true);
    try {
      const result = await auth.register(email, password, name);
      if (result?.success) {
        setSuccessMessage(`Welcome to Literati${result.user?.name ? `, ${result.user.name}` : ''}!`);
        setTimeout(() => navigate('/dashboard', { replace: true }), 1000);
      } else {
        setFormError(result?.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setFormError(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
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
        maxWidth: '480px',
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
              height: '60px', 
              width: 'auto',
              marginBottom: '16px',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
            }}
          />
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: '500',
            color: actualTheme === 'dark' ? '#f1f5f9' : '#1f2937',
            margin: 0,
            textAlign: 'center'
          }}>
            Create your account
          </h1>
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
            label="Full name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!nameError}
            helperText={nameError}
            disabled={isLoading}
            required
            autoFocus
          />

          <MD3TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!emailError}
            helperText={emailError}
            disabled={isLoading}
            required
          />

          <MD3TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!passwordError}
            helperText={passwordError}
            disabled={isLoading}
            required
          />

          <MD3TextField
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={!!confirmError}
            helperText={confirmError}
            disabled={isLoading}
            required
          />

          <div style={{
            display: 'flex',
            alignItems: 'center',  // Changed from flex-start to center
            gap: '12px',
            marginTop: '4px',
            marginBottom: '4px'
          }}>
            <div
              onClick={() => !isLoading && setAcceptedTos(!acceptedTos)}
              style={{
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <MD3Checkbox
                checked={acceptedTos}
                onChange={(e) => setAcceptedTos(e.target.checked)}
                disabled={isLoading}
              />
            </div>
            <span style={{
              fontSize: '14px',
              color: actualTheme === 'dark' ? '#e2e8f0' : '#374151',
              lineHeight: '1.5'
            }}>
              I agree to the{' '}
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                style={{ color: '#6750a4', textDecoration: 'none' }}
              >
                Terms of Service
              </a>
              {' '}and{' '}
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                style={{ color: '#6750a4', textDecoration: 'none' }}
              >
                Privacy Policy
              </a>.
            </span>
          </div>

          <MD3Button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              backgroundColor: '#6750a4',
              color: '#ffffff'
            }}
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </MD3Button>

          <div style={{ textAlign: 'center' }}>
            <span style={{
              fontSize: '14px',
              color: actualTheme === 'dark' ? '#94a3b8' : '#6b7280'
            }}>
              Already have an account?{' '}
              <Link 
                to="/login"
                style={{
                  color: '#6750a4',
                  textDecoration: 'none',
                  fontWeight: '500'
                }}
              >
                Sign in
              </Link>
            </span>
          </div>
        </form>
      </MD3Card>
    </div>
  );
};

export default SignUpPage;