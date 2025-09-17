// src/config/api.js - FIXED VERSION WITH NOTES SUPPORT
import axios from 'axios';

// Determine API URL based on environment variables and build mode
const getApiUrl = () => {
  // Always prefer environment variable if available
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // Fallback to hostname detection for backwards compatibility
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }

  // Default to production API for any other domain
  return 'https://library-server-m6gr.onrender.com';
};

// Create axios instance with base configuration
const API = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('literati_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.warn('⚠️ 401 Unauthorized - Token may be expired:', error.config.url);
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

      const response = await API.post(`/books/${book_id}/notes`, backendData);
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
      
      const response = await API.get(`/books/${bookId}/notes`);
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
      const response = await API.post('/gamification/actions', {
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
  getStats: async (token) => {
    try {
      const response = await API.get('/gamification/stats');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch stats:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch stats');
    }
  },

  // Get achievements
  getAchievements: async (token) => {
    try {
      const response = await API.get('/gamification/achievements');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch achievements:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch achievements');
    }
  },

  // Get goals
  getGoals: async (token) => {
    try {
      const response = await API.get('/gamification/goals');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch goals:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch goals');
    }
  }
};

export default API;