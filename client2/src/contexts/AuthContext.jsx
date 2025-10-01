import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import environmentConfig from '../config/environment.js';

/**
 * Storage keys (single source of truth) - Using centralized config
 * NOTE: Tokens are now stored in HttpOnly cookies for security.
 * Only user data is kept in localStorage for quick access.
 */
const USER_KEY = 'literati_user';

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
  // State
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // gate initial render
  const [error, setError] = useState(null);

  // Note: We no longer store token in state since it's in HttpOnly cookies
  // The browser automatically includes it in requests via credentials: 'include'

  // Debug (dev only)
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log('🔗 AuthContext API_URL:', API_URL);
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
      const headers = {
        'Content-Type': 'application/json',
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
      } catch (networkErr) {
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
   */
  const attemptTokenRefresh = useCallback(async () => {
    try {
      console.log('🔄 Attempting token refresh via cookies...');
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Include HttpOnly cookies (refresh token)
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Token refresh successful - new cookies set automatically');

        // Update user data if provided
        if (data.user) {
          setUser(data.user);
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        }

        // Return true to indicate success (no need to return token - it's in cookies)
        return true;
      }

      console.warn('❌ Token refresh failed');
      return false;
    } catch (err) {
      console.warn('❌ Token refresh error:', err);
      return false;
    }
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
          /Token verification failed/i.test(msg);

        if (expired) {
          console.warn('🔄 Token expired/invalid → attempting refresh');

          // Try to refresh the token via cookies
          const refreshSuccess = await attemptTokenRefresh();

          if (refreshSuccess) {
            // Retry the original request - new cookies are automatically included
            console.log('🔄 Retrying original request with refreshed cookies');
            return await makeApiCall(endpoint, options);
          } else {
            // Refresh failed, log out
            console.warn('❌ Token refresh failed → logging out');
            localStorage.removeItem(USER_KEY);
            setUser(null);
            throw new Error('Your session has expired. Please log in again.');
          }
        }
        throw err;
      }
    },
    [makeApiCall, attemptTokenRefresh]
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

  /**
   * Optional explicit verification (call when you need it)
   * Now uses cookie-based authentication automatically
   */
  const verifyToken = useCallback(
    async () => {
      const data = await makeApiCall('/auth/profile');
      return data;
    },
    [makeApiCall]
  );

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

        console.log('✅ Registration successful - using HttpOnly cookie authentication');
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

        // Tokens are set as HttpOnly cookies by the server
        // We only need to store user data in localStorage
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        setUser(data.user);

        console.log('✅ Login successful - using HttpOnly cookie authentication');
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
      console.log('✅ Logout successful - cookies cleared on server');
    } catch (err) {
      console.warn('⚠️ Logout API call failed, clearing local state anyway:', err);
    } finally {
      // Always clear local state, even if API call fails
      localStorage.removeItem(USER_KEY);
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
        await makeApiCall('/auth/reset-password', {
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

  const value = useMemo(
    () => ({
      // state
      user,
      loading,
      error,
      isAuthenticated,

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
          borderTop: '3px solid #6750a4', borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: '#6750a4' }}>Loading…</p>
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
