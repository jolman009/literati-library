import * as React from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CssBaseline from '@mui/material/CssBaseline';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { styled } from '@mui/material/styles';

import ForgotPassword from '../components/ForgotPassword';
import AppTheme from '../theme/AppTheme';
import ColorModeSelect from '../theme/ColorModeSelect';
import { GoogleIcon, FacebookIcon, SitemarkIcon } from '../components/CustomIcons';
import { useAuth } from '../contexts/AuthContext';

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: { maxWidth: '450px' },
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  ...theme.applyStyles?.('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  height: 'calc((1 - var(--template-frame-height, 0)) * 100dvh)',
  minHeight: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: { padding: theme.spacing(4) },
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage:
      'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
    ...(theme.applyStyles
      ? theme.applyStyles('dark', {
          backgroundImage:
            'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
        })
      : {}),
  },
}));

export default function MD3Login(props) {
  const navigate = useNavigate();
  const auth = useAuth();

  // form fields
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  // field errors
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');

  // global page error (shown as Alert)
  const [formError, setFormError] = React.useState('');

  // success/info snackbar
  const [snack, setSnack] = React.useState({ open: false, message: '', severity: 'success' });

  const [openForgot, setOpenForgot] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const validateInputs = React.useCallback(() => {
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
        setSnack({
          open: true,
          message: `Welcome back${result.user?.name ? `, ${result.user.name}` : ''}!`,
          severity: 'success',
        });
        // small delay to let the snackbar render, then navigate
        setTimeout(() => navigate('/dashboard', { replace: true }), 250);
      } else {
        setFormError(result?.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      setFormError(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <SignInContainer direction="column" justifyContent="space-between">
        <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
        <Card variant="outlined">
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
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
            <Typography
              component="h1"
              variant="h4"
              sx={{ fontSize: 'clamp(1.75rem, 8vw, 2rem)', fontWeight: 500 }}
            >
              Welcome to Literati
            </Typography>
          </Box>
          <Typography
            component="h2"
            variant="h5"
            sx={{ width: '100%', fontSize: 'clamp(1.25rem, 6vw, 1.5rem)', textAlign: 'center', mb: 2 }}
          >
            Sign in to continue
          </Typography>

          {/* Inline alert for actionable errors */}
          {formError && (
            <Alert
              severity="error"
              variant="filled"
              sx={{ mb: 1, borderRadius: 2 }}
              onClose={() => setFormError('')}
            >
              {formError}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 2 }}
          >
            <FormControl>
              <FormLabel htmlFor="email">Email</FormLabel>
              <TextField
                id="email"
                name="email"
                type="email"
                placeholder="your@email.com"
                autoComplete="email"
                autoFocus
                required
                fullWidth
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={emailError}
                helperText={emailErrorMessage}
                color={emailError ? 'error' : 'primary'}
                disabled={submitting}
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="password">Password</FormLabel>
              <TextField
                id="password"
                name="password"
                type="password"
                placeholder="••••••"
                autoComplete="current-password"
                required
                fullWidth
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={passwordError}
                helperText={passwordErrorMessage}
                color={passwordError ? 'error' : 'primary'}
                disabled={submitting}
              />
            </FormControl>

            <FormControlLabel
              control={<Checkbox value="remember" color="primary" disabled={submitting} />}
              label="Remember me"
            />

            <ForgotPassword open={openForgot} handleClose={() => setOpenForgot(false)} />

            <Button type="submit" fullWidth variant="contained" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>

            <Link
              component="button"
              type="button"
              onClick={() => setOpenForgot(true)}
              variant="body2"
              sx={{ alignSelf: 'center' }}
            >
              Forgot your password?
            </Link>
          </Box>

          <Divider>or</Divider>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => console.log('TODO: Sign in with Google')}
              startIcon={<GoogleIcon />}
              disabled={submitting}
            >
              Sign in with Google
            </Button>

            <Button
              fullWidth
              variant="outlined"
              onClick={() => console.log('TODO: Sign in with Facebook')}
              startIcon={<FacebookIcon />}
              disabled={submitting}
            >
              Sign in with Facebook
            </Button>

            <Typography sx={{ textAlign: 'center' }}>
              Don&apos;t have an account?{' '}
              <Link component={RouterLink} to="/signup" variant="body2" sx={{ alignSelf: 'center' }}>
                Sign up
              </Link>
            </Typography>
          </Box>
        </Card>

        {/* Success / info snackbar */}
        <Snackbar
          open={snack.open}
          autoHideDuration={2500}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnack((s) => ({ ...s, open: false }))}
            severity={snack.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snack.message}
          </Alert>
        </Snackbar>
      </SignInContainer>
    </AppTheme>
  );
}
