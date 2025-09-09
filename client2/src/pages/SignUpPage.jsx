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

import AppTheme from '../theme/AppTheme';
import ColorModeSelect from '../theme/ColorModeSelect';
import { SitemarkIcon } from '../components/CustomIcons';
import { useAuth } from '../contexts/AuthContext';

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: { maxWidth: '520px' },
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  ...theme.applyStyles?.('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

const PageContainer = styled(Stack)(({ theme }) => ({
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

export default function SignUpPage(props) {
  const navigate = useNavigate();
  const auth = useAuth();

  // form state
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [acceptedTos, setAcceptedTos] = React.useState(false);

  // ui state
  const [isLoading, setIsLoading] = React.useState(false);

  // field errors + global error
  const [nameError, setNameError] = React.useState('');
  const [emailError, setEmailError] = React.useState('');
  const [passwordError, setPasswordError] = React.useState('');
  const [confirmError, setConfirmError] = React.useState('');
  const [formError, setFormError] = React.useState('');

  // success snackbar
  const [snack, setSnack] = React.useState({ open: false, message: '', severity: 'success' });

  const validate = React.useCallback(() => {
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
        setSnack({
          open: true,
          message: `Welcome to Literati${result.user?.name ? `, ${result.user.name}` : ''}!`,
          severity: 'success',
        });
        setTimeout(() => navigate('/dashboard', { replace: true }), 300);
      } else {
        setFormError(result?.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setFormError(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <PageContainer direction="column" justifyContent="space-between">
        <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />

        <Card variant="outlined">
          <SitemarkIcon />
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
          >
            Create your account
          </Typography>

          {/* Inline Alert for actionable form errors */}
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
              <FormLabel htmlFor="fullName">Full name</FormLabel>
              <TextField
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                placeholder="Jane Doe"
                autoFocus
                required
                fullWidth
                variant="outlined"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={!!nameError}
                helperText={nameError}
                disabled={isLoading}
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="email">Email</FormLabel>
              <TextField
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                fullWidth
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!emailError}
                helperText={emailError}
                disabled={isLoading}
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="password">Password</FormLabel>
              <TextField
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                required
                fullWidth
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!passwordError}
                helperText={passwordError}
                disabled={isLoading}
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="confirmPassword">Confirm password</FormLabel>
              <TextField
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                fullWidth
                variant="outlined"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={!!confirmError}
                helperText={confirmError}
                disabled={isLoading}
              />
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox
                  checked={acceptedTos}
                  onChange={(e) => setAcceptedTos(e.target.checked)}
                  color="primary"
                  disabled={isLoading}
                />
              }
              label={
                <Typography variant="body2">
                  I agree to the{' '}
                  <Link href="#" underline="hover">Terms of Service</Link> and{' '}
                  <Link href="#" underline="hover">Privacy Policy</Link>.
                </Typography>
              }
            />

            <Button type="submit" fullWidth variant="contained" disabled={isLoading}>
              {isLoading ? 'Creating account…' : 'Create account'}
            </Button>

            <Typography sx={{ textAlign: 'center' }}>
              Already have an account?{' '}
              <Link component={RouterLink} to="/login" variant="body2" sx={{ alignSelf: 'center' }}>
                Sign in
              </Link>
            </Typography>
          </Box>

          <Divider sx={{ my: 1.5 }}>or</Divider>
        </Card>

        {/* Success snackbar */}
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
      </PageContainer>
    </AppTheme>
  );
}
