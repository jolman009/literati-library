import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import environmentConfig from '../config/environment.js';
import { syncPendingNotes } from '../utils/noteSyncUtil.js';
import { useSnackbar } from '../components/Material3';
import { useNavigate } from 'react-router-dom';

/**
 * Storage keys (single source of truth) - Using centralized config
 * NOTE: Tokens are now stored in HttpOnly cookies for security.
 * Only user data is kept in localStorage for quick access.
 */
const USER_KEY = 'shelfquest_user';

/**
 * Mutex to prevent concurrent refresh attempts
 * This is critical for avoiding token family breach detection false positives
 * When multiple requests fail simultaneously, they'll all wait for the same refresh
 */
let refreshPromise = null;

/**
 * Use centralized environment configuration for API URL
 * This ensures consistency across the application and proper environment handling
 */
const API_URL = environmentConfig.apiUrl;

/**
 * Context
 */
const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();
  // State
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // gate initial render
  const [error, setError] = useState(null);

  // Note: We no longer store token in state since it's in HttpOnly cookies
  // The browser automatically includes it in requests via credentials: 'include'

  // Debug (dev only)
  if (import.meta.env.DEV) {
     
    console.warn('🔗 AuthContext API_URL:', API_URL);
  }

  /**
   * Core fetch wrapper.
   * Now uses HttpOnly cookies for authentication.
   * No need to manually attach Authorization header - cookies are sent automatically.
   * Throws on non-2xx with parsed message where possible.
   */
  const makeApiCall = useCallback(
    async (endpoint, options = {}) => {
      const url = `${API_URL}${endpoint}`;
      // Include Authorization header when a token exists (fallback),
      // but rely on HttpOnly cookies as the primary auth mechanism
      const baseHeaders = environmentConfig.getAuthHeaders();
      const headers = {
        'Content-Type': 'application/json',
        ...baseHeaders,
        ...(options.headers || {}),
      };

      const config = {
        method: options.method || 'GET',
        headers,
        body: options.body,
        credentials: 'include', // CRITICAL: Send cookies with every request
        signal: options.signal,
      };

      let res;
      try {
        res = await fetch(url, config);
      } catch {
        throw new Error('Network error. Please check your connection.');
      }

      let data = null;
      const isJson = res.headers.get('content-type')?.includes('application/json');
      if (isJson) {
        try {
          data = await res.json();
        } catch {
          // ignore parse error, fallback below
        }
      } else {
        // for non-JSON responses, try text
        try {
          data = await res.text();
        } catch {
          // ignore
        }
      }

      if (!res.ok) {
        const message =
          (data && (data.error || data.message)) ||
          `Request failed (${res.status})`;
        throw new Error(message);
      }

      return data;
    },
    [] // No dependencies - cookies handled automatically
  );

  /**
   * Attempt to refresh the token using the refresh endpoint
   * Uses HttpOnly cookies - refresh token is automatically sent by browser
   *
   * CRITICAL: Uses mutex pattern to prevent concurrent refresh attempts
   * This prevents token family breach detection false positives
   */
  const attemptTokenRefresh = useCallback(async () => {
    // If refresh is already in progress, wait for it
    if (refreshPromise) {
      console.warn('🔄 [AUTH] Refresh already in progress, waiting for existing refresh...');
      return await refreshPromise;
    }

    // Create new refresh promise with mutex protection
    refreshPromise = (async () => {
      try {
        console.warn('🔄 [AUTH] Initiating token refresh via HttpOnly cookies...');
        const refreshStartTime = Date.now();

        const response = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include', // Include HttpOnly cookies (refresh token)
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const refreshDuration = Date.now() - refreshStartTime;

        if (response.ok) {
          const data = await response.json();
          console.warn(`✅ [AUTH] Token refresh successful (${refreshDuration}ms) - new cookies set by server`);

          // Update user data if provided
          if (data.user) {
            setUser(data.user);
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
            console.warn('    ↳ User data updated in state and localStorage');
          }

          // If server returns token in body for backward compatibility, update localStorage
          if (data?.token) {
            try {
              localStorage.setItem(environmentConfig.getTokenKey(), data.token);
              console.warn('    ↳ Token updated in localStorage (fallback for header auth)');
            } catch (e) {
              console.warn('    ⚠️ Could not update localStorage token:', e.message);
            }
          }

          // Return true to indicate success
          return true;
        }

        console.warn(`❌ [AUTH] Token refresh failed (${refreshDuration}ms): ${response.status} ${response.statusText}`);
        return false;
      } catch (err) {
        console.error('❌ [AUTH] Token refresh error:', err.message);
        return false;
      } finally {
        // Clear the mutex after completion (success or failure)
        console.warn('🔓 [AUTH] Refresh mutex released');
        refreshPromise = null;
      }
    })();

    // Wait for and return the refresh promise
    return await refreshPromise;
  }, []);

  /**
   * Wrap protected calls to handle token expiry centrally.
   * Automatically refreshes tokens using HttpOnly cookies.
   */
  const makeAuthenticatedApiCall = useCallback(
    async (endpoint, options = {}) => {
      try {
        return await makeApiCall(endpoint, options);
      } catch (err) {
        const msg = String(err?.message || '');
        const expired =
          msg.includes('401') ||
          msg.includes('403') ||
          /jwt\s*expired/i.test(msg) ||
          /TokenExpiredError/i.test(msg) ||
          /Token verification failed/i.test(msg) ||
          /Access token required/i.test(msg) ||
          /NO_TOKEN/i.test(msg) ||
          /INVALID_TOKEN/i.test(msg);

        if (expired) {
          console.warn('🔄 Token expired/invalid → attempting refresh');

          // Try to refresh the token via cookies
          const refreshSuccess = await attemptTokenRefresh();

          if (refreshSuccess) {
            // Retry the original request - new cookies are automatically included
            console.warn('🔄 Retrying original request with refreshed cookies');
            return await makeApiCall(endpoint, options);
          } else {
            // Refresh failed, prompt re-login
            console.warn('❌ Token refresh failed → prompting re-login');
            try {
              showSnackbar({
                message: 'Session expired. Please sign in again.',
                variant: 'warning',
                duration: 5000,
                position: 'top-center',
                action: (
                  <button className="md3-snackbar__action-button" onClick={() => navigate('/login')}>
                    Sign in
                  </button>
                )
              });
            } catch {
              // Silently ignore snackbar errors
            }
            localStorage.removeItem(USER_KEY);
            setUser(null);
            throw new Error('Your session has expired. Please log in again.');
          }
        }
        throw err;
      }
    },
    [makeApiCall, attemptTokenRefresh, navigate, showSnackbar]
  );

  /**
   * Bootstrap: load existing user data from localStorage
   * Tokens are in HttpOnly cookies, so we only need to restore user info.
   * If cookies are present, the user is logged in; if not, first API call will fail.
   */
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(USER_KEY);

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          // corrupted storage → clear
          localStorage.removeItem(USER_KEY);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Listen for global refresh failures (from axios paths) and prompt re-login
  useEffect(() => {
    const handler = () => {
      try {
        showSnackbar({
          message: 'Session expired. Please sign in again.',
          variant: 'warning',
          duration: 5000,
          position: 'top-center',
          action: (
            <button className="md3-snackbar__action-button" onClick={() => navigate('/login')}>
              Sign in
            </button>
          )
        });
      } catch {
        // Silently ignore snackbar errors
      }
    };
    window.addEventListener('auth-refresh-failed', handler);
    return () => window.removeEventListener('auth-refresh-failed', handler);
  }, [showSnackbar, navigate]);

  /**
   * Optional explicit verification (call when you need it)
   * Uses simple makeApiCall to avoid triggering auto-refresh
   * This is a CHECK operation, not a refresh operation
   */
  const verifyToken = useCallback(
    async () => {
      console.warn('🔍 [AUTH] Verifying token validity...');
      const data = await makeApiCall('/auth/profile');
      console.warn('✅ [AUTH] Token verification successful');
      return data;
    },
    [makeApiCall]
  );

  // Verify cookie/header session after restoring user from storage
  useEffect(() => {
    let cancelled = false;

    const verifyIfNeeded = async () => {
      if (!user) {
        console.warn('ℹ️ [AUTH] No user in state, skipping verification');
        setLoading(false);
        return;
      }

      console.warn('🔍 [AUTH] User found in localStorage, verifying session...');

      // Get dev header auth setting
      const devHeaderAuth = typeof environmentConfig.shouldUseDevHeaderAuth === 'function'
        ? environmentConfig.shouldUseDevHeaderAuth()
        : false;

      // In production OR when dev header auth is disabled: rely on cookies only
      // In dev with header auth enabled: check if token exists as fallback
      if (import.meta.env.DEV && devHeaderAuth) {
        let hasToken = false;
        try {
          hasToken = !!localStorage.getItem(environmentConfig.getTokenKey());
        } catch (e) {
          console.warn('⚠️ [AUTH] Could not check localStorage for token:', e.message);
        }

        // Only log out if BOTH conditions are true:
        // 1. Dev header auth is enabled
        // 2. No token in localStorage AND verification fails
        if (!hasToken) {
          console.warn('🔧 [AUTH] Dev header auth enabled but no token in localStorage');
          console.warn('    ↳ Attempting cookie-based verification anyway...');

          // Try to verify with cookies first
          try {
            setLoading(true);
            await verifyToken();
            console.warn('✅ [AUTH] Cookie verification successful despite missing header token');
            if (!cancelled) setLoading(false);
            return;
          } catch {
            // Both cookie AND header auth failed
            if (!cancelled) {
              console.warn('❌ [AUTH] Both cookie and header auth failed in dev mode');
              console.warn('    ↳ Clearing session and prompting sign-in');

              try {
                showSnackbar({
                  message: 'Session expired. Please sign in again.',
                  variant: 'warning',
                  duration: 5000,
                  position: 'top-center',
                  action: (
                    <button className="md3-snackbar__action-button" onClick={() => navigate('/login')}>
                      Sign in
                    </button>
                  )
                });
              } catch (snackbarErr) {
                console.warn('⚠️ [AUTH] Could not show snackbar:', snackbarErr.message);
              }

              localStorage.removeItem(USER_KEY);
              setUser(null);
            }
            if (!cancelled) setLoading(false);
            return;
          }
        } else {
          console.warn('✓ [AUTH] Dev header auth: token found in localStorage');
        }
      }

      // Normal verification flow (cookie-based, works in all modes)
      try {
        setLoading(true);
        await verifyToken();
        console.warn('✅ [AUTH] Session verification complete');
      } catch (err) {
        if (!cancelled) {
          console.warn('❌ [AUTH] Token verification failed, clearing user:', err.message);
          localStorage.removeItem(USER_KEY);
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    verifyIfNeeded();
    return () => { cancelled = true; };
  }, [user, verifyToken, showSnackbar, navigate]);

  /**
   * Auth actions
   */
  const register = useCallback(
    async (email, password, name) => {
      setLoading(true);
      setError(null);
      try {
        const data = await makeApiCall('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, password, name }),
        });

        // Tokens are set as HttpOnly cookies by the server
        // We only need to store user data in localStorage
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        setUser(data.user);

        console.warn('✅ Registration successful - using HttpOnly cookie authentication');
        return { success: true, user: data.user };
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [makeApiCall]
  );

  const login = useCallback(
    async (email, password) => {
      setLoading(true);
      setError(null);
      try {
        const data = await makeApiCall('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });

        // Store token in localStorage for Authorization header (cross-domain support)
        // Server also sets HttpOnly cookies as fallback
        if (data.token) {
          localStorage.setItem(environmentConfig.getTokenKey(), data.token);
        }

        // Store user data
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        setUser(data.user);

        // Track daily login for gamification (once per day)
        try {
          const lastLogin = localStorage.getItem('lastDailyLogin');
          const today = new Date().toDateString();

          if (lastLogin !== today) {
            // Mark as logged in today
            localStorage.setItem('lastDailyLogin', today);

            // Dispatch event for gamification context to pick up
            window.dispatchEvent(new CustomEvent('dailyLoginTracked', {
              detail: {
                userId: data.user.id,
                timestamp: new Date().toISOString(),
                date: today
              }
            }));

            console.warn('✅ Daily login tracked - 10 points will be awarded');
          } else {
            console.warn('ℹ️ Already logged in today - no additional points');
          }
        } catch (loginTrackError) {
          console.warn('Failed to track daily login:', loginTrackError);
          // Don't fail login if tracking fails
        }

        // Sync any pending notes that were saved locally while offline/logged out
        try {
          const syncResults = await syncPendingNotes();

          if (syncResults.synced > 0) {
            console.warn(`✅ Synced ${syncResults.synced} pending notes after login`);

            // Dispatch event so UI can show notification
            window.dispatchEvent(new CustomEvent('pendingNotesSynced', {
              detail: {
                synced: syncResults.synced,
                failed: syncResults.failed,
                timestamp: new Date().toISOString()
              }
            }));
          }

          if (syncResults.failed > 0) {
            console.warn(`⚠️ Failed to sync ${syncResults.failed} notes - will retry later`);
          }
        } catch (syncError) {
          console.warn('Failed to sync pending notes:', syncError);
          // Don't fail login if sync fails
        }

        console.warn('✅ Login successful - token stored in localStorage');
        return { success: true, user: data.user };
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [makeApiCall]
  );

  const logout = useCallback(async () => {
    try {
      // Call backend to clear HttpOnly cookies
      await makeApiCall('/auth/logout', {
        method: 'POST',
      });
      console.warn('✅ Logout successful - cookies cleared on server');
    } catch (err) {
      console.warn('⚠️ Logout API call failed, clearing local state anyway:', err);
    } finally {
      // Always clear local state, even if API call fails
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(environmentConfig.getTokenKey());
      setUser(null);
      setError(null);
    }
  }, [makeApiCall]);

  const updateProfile = useCallback(
    async (updates) => {
      setError(null);
      try {
        const data = await makeAuthenticatedApiCall('/auth/profile', {
          method: 'PUT',
          body: JSON.stringify(updates),
        });
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
        return { success: true, user: updatedUser };
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      }
    },
    [makeAuthenticatedApiCall, user]
  );

  const changePassword = useCallback(
    async (currentPassword, newPassword) => {
      setError(null);
      try {
        await makeAuthenticatedApiCall('/auth/change-password', {
          method: 'POST',
          body: JSON.stringify({ currentPassword, newPassword }),
        });
        return { success: true };
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      }
    },
    [makeAuthenticatedApiCall]
  );

  const requestPasswordReset = useCallback(
    async (email) => {
      setError(null);
      try {
        await makeApiCall('/auth/secure/reset-password', {
          method: 'POST',
          body: JSON.stringify({ email }),
        });
        return { success: true };
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      }
    },
    [makeApiCall]
  );

  const deleteAccount = useCallback(
    async (password) => {
      setError(null);
      try {
        await makeAuthenticatedApiCall('/auth/delete-account', {
          method: 'DELETE',
          body: JSON.stringify({ password }),
        });
        // Clear local state/storage after successful deletion
        logout();
        return { success: true };
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      }
    },
    [makeAuthenticatedApiCall, logout]
  );

  const refreshUser = useCallback(
    async () => {
      try {
        const data = await verifyToken();
        const updated = { ...(user || {}), ...data };
        setUser(updated);
        localStorage.setItem(USER_KEY, JSON.stringify(updated));
        return { success: true, user: updated };
      } catch (err) {
        // On failure, log out to clear bad state
        await logout();
        return { success: false, error: err.message };
      }
    },
    [user, verifyToken, logout]
  );

  const hasRole = useCallback((role) => Boolean(user?.roles?.includes(role)), [user]);
  const clearError = useCallback(() => setError(null), []);

  // User is authenticated if we have user data (cookies handle the actual auth)
  const isAuthenticated = useMemo(() => Boolean(user), [user]);

  // Expose token for compatibility with components that still read it directly
  const token = useMemo(() => {
    try {
      return localStorage.getItem(environmentConfig.getTokenKey()) || null;
    } catch {
      return null;
    }
  }, []);

  const value = useMemo(
    () => ({
      // state
      user,
      loading,
      error,
      isAuthenticated,
      token,

      // actions
      register,
      login,
      logout,
      updateProfile,
      changePassword,
      requestPasswordReset,
      deleteAccount,
      refreshUser,
      clearError,
      hasRole,

      // utilities
      makeApiCall,
      makeAuthenticatedApiCall,
    }),
    [
      user,
      loading,
      error,
      isAuthenticated,
      token,
      register,
      login,
      logout,
      updateProfile,
      changePassword,
      requestPasswordReset,
      deleteAccount,
      refreshUser,
      clearError,
      hasRole,
      makeApiCall,
      makeAuthenticatedApiCall,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Optional HOC for protecting pages that don’t use router guards.
 */
export const withAuth = (Component) => function WithAuth(props) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100vh', flexDirection: 'column', gap: 16
      }}>
        <div style={{
          width: 40, height: 40, border: '3px solid #e0e0e0',
          borderTop: '3px solid #24A8E0', borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: '#24A8E0' }}>Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100vh', flexDirection: 'column', gap: 16, padding: 24
      }}>
        <h2>Authentication Required</h2>
        <p>Please log in to access this page.</p>
      </div>
    );
  }

  return <Component {...props} />;
};

export default AuthContext;
