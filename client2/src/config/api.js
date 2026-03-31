// src/config/api.js - UNIFIED WITH CENTRALIZED CONFIGURATION
import axios from 'axios';
import environmentConfig from './environment.js';

// Normalize environment configuration to avoid crashes in tests where
// partial mocks are used. This keeps axios happy even when optional
// helpers aren't provided by the mock implementation.
const apiUrl = environmentConfig?.apiUrl || 'http://localhost:5000';
const apiTimeout = environmentConfig?.apiTimeout ?? 10000;
const defaultHeaders = environmentConfig?.getDefaultHeaders
  ? environmentConfig.getDefaultHeaders()
  : { 'Content-Type': 'application/json' };
const tokenStorageKey = environmentConfig?.getTokenKey
  ? environmentConfig.getTokenKey()
  : 'shelfquest_token';

// Create axios instance with base configuration, falling back to a
// lightweight stub when axios.create is unavailable (e.g. when axios is
// mocked incorrectly).
let API;
try {
  if (axios?.create) {
    API = axios.create({
      baseURL: apiUrl,
      timeout: apiTimeout,
      headers: defaultHeaders,
      withCredentials: true, // Send cookies with all requests
    });
  }
} catch {
  // axios.create failed, will use fallback
}

// Fallback stub for test environments
if (!API) {
  API = {
    defaults: { baseURL: apiUrl, headers: defaultHeaders },
    interceptors: { request: { use: () => {} }, response: { use: () => {} } },
    get: () => Promise.resolve({ data: null }),
    post: () => Promise.resolve({ data: {} }),
    put: () => Promise.resolve({ data: {} }),
    patch: () => Promise.resolve({ data: {} }),
    delete: () => Promise.resolve({ data: {} }),
    BASE_URL: apiUrl,
  };
}

// Add BASE_URL property for backward compatibility
if (API && !API.BASE_URL) {
  API.BASE_URL = apiUrl;
}

// Request interceptor:
// Keep cookie-first auth, but add Bearer fallback for browsers/environments
// where cross-site cookies are blocked (e.g., Safari ITP).
API.interceptors.request.use(
  (config) => {
    try {
      const fallbackToken = localStorage.getItem(tokenStorageKey);
      if (fallbackToken) {
        config.headers = config.headers || {};
        if (!config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${fallbackToken}`;
        }
      }
    } catch {
      // Ignore storage access failures
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Token refresh state — mutex prevents concurrent refresh attempts
let refreshPromise = null;

async function refreshAccessToken() {
  // If a refresh is already in progress, piggyback on it
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const refreshToken = localStorage.getItem('shelfquest_refresh_token');
      const body = refreshToken ? JSON.stringify({ refreshToken }) : undefined;

      const response = await fetch(`${apiUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (response.ok) {
        const data = await response.json();
        // Persist new tokens to localStorage (Bearer fallback)
        if (data.token) localStorage.setItem(tokenStorageKey, data.token);
        if (data.refreshToken) localStorage.setItem('shelfquest_refresh_token', data.refreshToken);
        if (data.user) localStorage.setItem('shelfquest_user', JSON.stringify(data.user));
        console.warn('✅ [API] Token refresh successful');
        return true;
      }
      console.warn('❌ [API] Token refresh failed:', response.status);
      return false;
    } catch (err) {
      console.warn('❌ [API] Token refresh error:', err.message);
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Response interceptor — auto-refresh on 401 for ALL API calls
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config || {};

    // Auto-refresh on 401, but only once per request (_retry flag prevents loops)
    if (status === 401 && !originalRequest._retry) {
      // Skip refresh for the refresh endpoint itself
      if (originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      console.warn('⚠️ [API] 401 Unauthorized:', originalRequest.url, '→ attempting token refresh');

      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Update the Authorization header with the new token
        const newToken = localStorage.getItem(tokenStorageKey);
        if (newToken) {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        // Retry the original request
        return API(originalRequest);
      }

      // Refresh failed — clear auth state so UI can react
      console.warn('❌ [API] Refresh failed → session expired');
      localStorage.removeItem(tokenStorageKey);
      localStorage.removeItem('shelfquest_refresh_token');
      localStorage.removeItem('shelfquest_user');
    } else if (status === 403) {
      console.warn('⚠️ [API] 403 Forbidden:', originalRequest.url);
    }

    // Suppress 404 errors for optional gamification endpoints
    if (status === 404 && originalRequest?.url?.includes('/gamification/')) {
      console.warn(`ℹ️ [API] Gamification endpoint not available: ${originalRequest.url} - using local storage fallback`);
    }

    return Promise.reject(error);
  }
);

// 🔧 NEW: Gamification API object with notes functionality
export const gamificationAPI = {
  // Create a note
  createNote: async (token, noteData) => {
    try {
      const { book_id, ...data } = noteData;
      
      // Convert frontend field names to backend expected format
      const backendData = {
        content: data.note || data.content, // Handle both field names
        type: data.type || 'note',
        page: data.page_number ? parseInt(data.page_number) : null,
        position: data.position,
        color: data.color,
        tags: data.tags || []
      };

      const response = await API.post(`/notes/book/${book_id}`, backendData);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to create note:', error);
      throw new Error(error.response?.data?.error || 'Failed to create note');
    }
  },

  // Get notes for a book
  getNotes: async (token, bookId) => {
    try {
      if (!bookId) {
        return [];
      }
      
      const response = await API.get(`/notes/book/${bookId}`);
      return response.data || [];
    } catch (error) {
      console.error('❌ Failed to fetch notes:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch notes');
    }
  },

  // Update a note
  updateNote: async (token, noteId, noteData) => {
    try {
      const backendData = {
        content: noteData.note || noteData.content,
        type: noteData.type || 'note',
        page: noteData.page_number ? parseInt(noteData.page_number) : null,
        position: noteData.position,
        color: noteData.color,
        tags: noteData.tags || []
      };

      const response = await API.put(`/notes/${noteId}`, backendData);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to update note:', error);
      throw new Error(error.response?.data?.error || 'Failed to update note');
    }
  },

  // Delete a note
  deleteNote: async (token, noteId) => {
    try {
      await API.delete(`/notes/${noteId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to delete note:', error);
      throw new Error(error.response?.data?.error || 'Failed to delete note');
    }
  },

  // Track gamification actions
  trackAction: async (token, action, data) => {
    try {
      const response = await API.post('/api/gamification/actions', {
        action,
        data,
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      console.error('❌ Failed to track action:', error);
      // Don't throw error for tracking - fail silently
      return null;
    }
  },

  // Get gamification stats
  getStats: async () => {
    try {
      const response = await API.get('/api/gamification/stats');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch stats:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch stats');
    }
  },

  // Get achievements
  getAchievements: async () => {
    try {
      const response = await API.get('/api/gamification/achievements');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch achievements:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch achievements');
    }
  },

  // Get goals
  getGoals: async () => {
    try {
      const response = await API.get('/api/gamification/goals');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch goals:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch goals');
    }
  }
};

export default API;
