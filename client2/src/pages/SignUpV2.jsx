import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMaterial3 } from '../hooks/useMaterial3';
import MD3TextField from '../components/Material3/MD3TextField';
import MD3Button from '../components/Material3/MD3Button';
import MD3Checkbox from '../components/Material3/MD3Checkbox';
import GoogleSignInButton from '../components/GoogleSignInButton';
import AuthBrandPanel from './AuthBrandPanel';
import './SignUpV2.css';

const SignUpV2 = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [acceptedTos, setAcceptedTos] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { isDark, theme, toggleTheme } = useMaterial3();

  // Unified validation engine
  const validation = {
    length: formData.password.length >= 8,
    upper: /[A-Z]/.test(formData.password),
    lower: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
    match: formData.password === formData.confirmPassword && formData.confirmPassword !== '',
    noUsername: () => {
      if (!formData.email || !formData.email.includes('@')) return true;
      const username = formData.email.split('@')[0].toLowerCase();
      if (username.length < 3) return true;
      return !formData.password.toLowerCase().includes(username);
    }
  };

  const passwordMeetsRequirements =
    validation.length && validation.upper && validation.lower && validation.number && validation.special;

  // Compute field-level errors. The submit button is NOT disabled — instead we
  // surface per-field errors on submit/blur so users (and the E2E suite) get
  // actionable feedback. Terms acceptance remains a hard requirement.
  const validate = () => {
    const next = {};
    if (!formData.name.trim()) next.name = 'Full name is required';
    if (!formData.email.trim()) next.email = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) next.email = 'Enter a valid email address';
    if (!formData.password) next.password = 'Password is required';
    else if (!passwordMeetsRequirements) next.password = 'Password does not meet the requirements below';
    else if (!validation.match) next.password = 'Passwords do not match';
    if (!acceptedTos) next.tos = 'Please accept the Terms and Privacy Policy to continue';
    return next;
  };

  // Real-time validation for a single field on blur.
  const validateField = (field) => {
    const next = validate();
    setErrors(prev => ({ ...prev, [field]: next[field] }));
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      setLoading(true);
      setError('');
      await register(formData.email, formData.password, formData.name);
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear a field's error as the user corrects it.
    setErrors(prev => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  return (
    <div className={`auth-v2-layout ${isDark ? 'dark' : 'light'}`}>
      <AuthBrandPanel
        theme={theme}
        toggleTheme={toggleTheme}
        headline="Start your reading quest."
        subcopy="Create your shelf, set a goal, and let your AI mentor guide every chapter."
      />

      <div className="auth-form-pane signup-v2-container">
        <div className="signup-card">
        <div className="signup-header">
          <div className="signup-logo-container">
            <div className="signup-logo-wrapper">
              <img src="/ShelfQuest_logo_v3.png" alt="ShelfQuest Logo" className="signup-logo-img" />
            </div>
          </div>
          <h1>Create Account</h1>
          <p style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>Join ShelfQuest Digital Library today</p>
        </div>

        <GoogleSignInButton
          text="signup_with"
          onSuccess={async (credential) => {
            try {
              setError('');
              setLoading(true);
              const result = await loginWithGoogle(credential);
              if (result.success) {
                navigate('/dashboard');
              } else {
                setError(result.error || 'Google sign-up failed. Please try again.');
              }
            } catch (err) {
              setError('Google sign-up failed. Please try again.');
            } finally {
              setLoading(false);
            }
          }}
          onError={() => setError('Google sign-up failed. Please try again.')}
        />

        <div className="auth-divider">
          <span>or</span>
        </div>

        <form onSubmit={handleSignUp} className="signup-form" data-testid="register-form" noValidate>
          <MD3TextField label="Full Name" value={formData.name} onChange={e => updateField('name', e.target.value)} onBlur={() => validateField('name')} required fullWidth data-testid="name-input" aria-label="Full Name" />
          {errors.name && <div role="alert" className="field-error" data-testid="name-error" style={{ color: 'var(--md-sys-color-error)', fontSize: '0.75rem' }}>{errors.name}</div>}

          <MD3TextField label="Email Address" type="email" value={formData.email} onChange={e => updateField('email', e.target.value)} onBlur={() => validateField('email')} required fullWidth data-testid="email-input" aria-label="Email Address" />
          {errors.email && <div role="alert" className="field-error" data-testid="email-error" style={{ color: 'var(--md-sys-color-error)', fontSize: '0.75rem' }}>{errors.email}</div>}

          <MD3TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={e => updateField('password', e.target.value)}
            onBlur={() => validateField('password')}
            required
            fullWidth
            data-testid="password-input"
            aria-label="Password"
            trailingIcon={<span className="material-symbols-outlined password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'visibility' : 'visibility_off'}</span>}
          />
          {errors.password && <div role="alert" className="field-error" data-testid="password-error" style={{ color: 'var(--md-sys-color-error)', fontSize: '0.75rem' }}>{errors.password}</div>}

          <MD3TextField label="Confirm Password" type="password" value={formData.confirmPassword} onChange={e => updateField('confirmPassword', e.target.value)} onBlur={() => validateField('password')} required fullWidth data-testid="confirm-password-input" aria-label="Confirm Password" />

          <div className="password-requirements" data-testid="password-strength-error">
            <Requirement label="8+ characters" met={validation.length} />
            <Requirement label="Upper, Lower, & Number" met={validation.upper && validation.lower && validation.number} />
            <Requirement label="Special character" met={validation.special} />
            <Requirement label="No email username" met={validation.noUsername()} />
            <Requirement label="Passwords match" met={validation.match} />
          </div>

          <MD3Checkbox
            checked={acceptedTos}
            onChange={e => { setAcceptedTos(e.target.checked); setErrors(prev => ({ ...prev, tos: undefined })); }}
            label="I agree to the Terms and Privacy Policy"
            data-testid="tos-checkbox"
          />
          {errors.tos && <div role="alert" className="field-error" data-testid="tos-error" style={{ color: 'var(--md-sys-color-error)', fontSize: '0.75rem' }}>{errors.tos}</div>}

          {error && <div role="alert" style={{ color: 'var(--md-sys-color-error)', fontSize: '0.8rem', textAlign: 'center' }} data-testid="signup-error">{error}</div>}

          <MD3Button type="submit" variant="primary" disabled={loading} data-testid="register-button" aria-label="Create account">
            {loading ? 'Creating Account...' : 'Sign Up'}
          </MD3Button>
        </form>

        <div className="signup-footer">
          <p style={{ fontSize: '0.875rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
            Already have an account? <Link to="/login" className="signup-link">Sign In</Link>
          </p>
        </div>
        </div>
      </div>
    </div>
  );
};

const Requirement = ({ label, met }) => (
  <div className={`requirement-item ${met ? 'met' : 'unmet'}`}>
    <span>{met ? '✓' : '○'}</span>
    <span>{label}</span>
  </div>
);

export default SignUpV2;