import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMaterial3 } from '../hooks/useMaterial3';
import MD3TextField from '../components/Material3/MD3TextField';
import MD3Button from '../components/Material3/MD3Button';
import MD3Checkbox from '../components/Material3/MD3Checkbox';
import GoogleSignInButton from '../components/GoogleSignInButton';
import './SignUpV2.css';

const SignUpV2 = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [acceptedTos, setAcceptedTos] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { isDark } = useMaterial3();

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

  const isFormValid = Object.values(validation).every(v => typeof v === 'function' ? v() : v) && acceptedTos && formData.name;

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

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

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <div className={`signup-v2-container ${isDark ? 'dark' : 'light'}`}>
      <div className="signup-card">
        <div className="signup-header">
          <div className="signup-logo-container">
            <div className="signup-logo-wrapper">
              <img src="/ShelfQuest_logo_v2.png" alt="ShelfQuest Logo" className="signup-logo-img" />
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

        <form onSubmit={handleSignUp} className="signup-form" data-testid="register-form">
          <MD3TextField label="Full Name" value={formData.name} onChange={e => updateField('name', e.target.value)} required fullWidth data-testid="name-input" />
          <MD3TextField label="Email Address" type="email" value={formData.email} onChange={e => updateField('email', e.target.value)} required fullWidth data-testid="email-input" />
          
          <MD3TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={e => updateField('password', e.target.value)}
            required
            fullWidth
            data-testid="password-input"
            trailingIcon={<span className="material-symbols-outlined password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'visibility' : 'visibility_off'}</span>}
          />

          <MD3TextField label="Confirm Password" type="password" value={formData.confirmPassword} onChange={e => updateField('confirmPassword', e.target.value)} required fullWidth data-testid="confirm-password-input" />

          <div className="password-requirements" data-testid="password-strength-error">
            <Requirement label="8+ characters" met={validation.length} />
            <Requirement label="Upper, Lower, & Number" met={validation.upper && validation.lower && validation.number} />
            <Requirement label="Special character" met={validation.special} />
            <Requirement label="No email username" met={validation.noUsername()} />
            <Requirement label="Passwords match" met={validation.match} />
          </div>

          <MD3Checkbox checked={acceptedTos} onChange={e => setAcceptedTos(e.target.checked)} label="I agree to the Terms and Privacy Policy" />

          {error && <div style={{ color: 'var(--md-sys-color-error)', fontSize: '0.8rem', textAlign: 'center' }} data-testid="signup-error">{error}</div>}

          <MD3Button type="submit" variant="primary" disabled={loading || !isFormValid} data-testid="register-button">
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
  );
};

const Requirement = ({ label, met }) => (
  <div className={`requirement-item ${met ? 'met' : 'unmet'}`}>
    <span>{met ? '✓' : '○'}</span>
    <span>{label}</span>
  </div>
);

export default SignUpV2;