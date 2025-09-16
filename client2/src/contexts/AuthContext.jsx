import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';

/**
 * Storage keys (single source of truth)
 */
const TOKEN_KEY = 'literati_token';
const USER_KEY = 'literati_user';

/**
 * Resolve API base URL from Vite envs with safe fallbacks.
 * Priority:
 *  1) VITE_API_BASE_URL
 *  2) Hostname-based heuristics (optional fallback)
 *  3) http://localhost:5000
 */
function resolveApiBaseUrl() {
  const envUrl = import.meta.env?.VITE_API_BASE_URL?.trim();
  if (envUrl) return envUrl;

  const host = (typeof window !== 'undefined' && window.location?.hostname) || '';
  if (/literati\.pro$/i.test(host) || /vercel\.app$/i.test(host)) {
    // If envs were forgotten in production, fall back to your hosted API
    return 'https://library-server-m6gr.onrender.com';
  }

  // Dev fallback
  return 'http://localhost:5000';
}

const API_URL = resolveApiBaseUrl();

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
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // gate initial render
  const [error, setError] = useState(null);

  // Debug (dev only)
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log('🔗 AuthContext API_URL:', API_URL);
  }

  /**
   * Core fetch wrapper.
   * Automatically sets JSON headers and Authorization if token available.
   * Throws on non-2xx with parsed message where possible.
   */
  const makeApiCall = useCallback(
    async (endpoint, options = {}) => {
      const url = `${API_URL}${endpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      };

      // Attach token if we have one and caller didn’t override it
      if (token && !headers.Authorization) {
        headers.Authorization = `Bearer ${token}`;
      }

      const config = {
        method: options.method || 'GET',
        headers,
        body: options.body,
        credentials: options.credentials || 'include', // adjust if you don’t use cookies at all
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
    [token]
  );

  /**
   * Attempt to refresh the token using the refresh endpoint
   */
  const attemptTokenRefresh = useCallback(async () => {
    try {
      console.log('🔄 Attempting token refresh...');
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Include cookies for refresh token
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          console.log('✅ Token refresh successful');
          setToken(data.token);
          localStorage.setItem(TOKEN_KEY, data.token);
          if (data.user) {
            setUser(data.user);
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          }
          return data.token;
        }
      }

      console.warn('❌ Token refresh failed');
      return null;
    } catch (err) {
      console.warn('❌ Token refresh error:', err);
      return null;
    }
  }, []);

  /**
   * Wrap protected calls to handle token expiry centrally.
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

          // Try to refresh the token first
          const newToken = await attemptTokenRefresh();

          if (newToken) {
            // Retry the original request with the new token
            console.log('🔄 Retrying original request with new token');
            const retryOptions = {
              ...options,
              headers: {
                ...options.headers,
                'Authorization': `Bearer ${newToken}`,
              },
            };
            return await makeApiCall(endpoint, retryOptions);
          } else {
            // Refresh failed, log out
            console.warn('❌ Token refresh failed → logging out');
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setToken(null);
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
   * Bootstrap: load existing auth state from localStorage
   * Avoid aggressive verify on mount; let protected calls verify naturally.
   */
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        } catch {
          // corrupted storage → clear
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Optional explicit verification (call when you need it)
   */
  const verifyToken = useCallback(
    async (tokenToVerify) => {
      const data = await makeApiCall('/auth/profile', {
        headers: { Authorization: `Bearer ${tokenToVerify}` },
      });
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

        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);

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

        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);

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

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    setError(null);
  }, []);

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
      if (!token) return { success: false, error: 'No token available' };
      try {
        const data = await verifyToken(token);
        const updated = { ...(user || {}), ...data };
        setUser(updated);
        localStorage.setItem(USER_KEY, JSON.stringify(updated));
        return { success: true, user: updated };
      } catch (err) {
        // On failure, log out to clear bad state
        logout();
        return { success: false, error: err.message };
      }
    },
    [token, user, verifyToken, logout]
  );

  const hasRole = useCallback((role) => Boolean(user?.roles?.includes(role)), [user]);
  const clearError = useCallback(() => setError(null), []);

  const isAuthenticated = useMemo(() => Boolean(user && token), [user, token]);

  const value = useMemo(
    () => ({
      // state
      user,
      token,
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
      token,
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
