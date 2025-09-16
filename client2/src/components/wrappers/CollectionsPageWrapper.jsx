// src/components/wrappers/CollectionsPageWrapper.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Material3ThemeProvider, useMaterial3Theme } from '../../contexts/Material3ThemeContext';
import { MD3SnackbarProvider, useSnackbar } from '../Material3';
import EnhancedCollectionsPage from '../../pages/subpages/EnhancedCollectionsPage';
import API from '../../config/api';

// Safe gamification hook
const useOptionalGamification = () => {
  const [gamificationContext, setGamificationContext] = useState({
    trackAction: async (action, data) => {
      console.log(`🎯 Gamification action: ${action}`, data);
      return Promise.resolve();
    },
    stats: { level: 1, points: 0, streak: 0, totalReadingTime: 0 },
    achievements: [],
    goals: [],
    loading: false
  });

  useEffect(() => {
    const loadGamification = async () => {
      try {
        // Use dynamic import instead of require()
        const module = await import('../../contexts/GamificationContext');
        console.log('✅ Gamification module loaded successfully');
        // Note: We can't call useGamification here since hooks must be called in component scope
        // The gamification will be handled by the parent component that provides the context
      } catch (error) {
        console.log('⚠️ Gamification not available:', error.message);
      }
    };

    loadGamification();
  }, []);

  return gamificationContext;
};

// Inner component that uses theme and snackbar
const CollectionsPageContent = () => {
  const { actualTheme } = useMaterial3Theme();
  const { showSnackbar } = useSnackbar();

  // State management
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serverStatus, setServerStatus] = useState('checking');

  // Hooks
  const { user, token } = useAuth();
  const navigate = useNavigate();

  // Safe gamification integration
  const gamificationContext = useOptionalGamification();

  // Notification helper
  const showNotification = (message, variant = 'info') => {
    showSnackbar({ message, variant });
  };

  useEffect(() => {
    if (user && token) {
      fetchBooks();
    } else {
      setError('Please log in to view your collections');
      setLoading(false);
    }
  }, [user, token]);

  // Fetch books data - same source as Dashboard
  const fetchBooks = async () => {
    setLoading(true);
    setError(null);
    setServerStatus('checking');

    try {
      // Check if user is authenticated first
      if (!user || !token) {
        throw new Error('Please log in to view your collections');
      }

      console.log('🔍 Fetching books for collections page...');
      console.log('🔍 API base URL:', API.defaults.baseURL);
      console.log('🔍 Making request to:', `${API.defaults.baseURL}/books`);
      console.log('🔍 User authenticated:', !!user, 'Token present:', !!token);

      const response = await API.get('/books', { timeout: 30000 });

      // Success - handle both direct array and structured response
      let booksData = [];
      if (Array.isArray(response.data)) {
        // Direct array response (some environments)
        booksData = response.data;
      } else if (Array.isArray(response.data.books)) {
        // Structured response with {books: Array} (most common)
        booksData = response.data.books;
      } else {
        console.warn('Unexpected API response format:', response.data);
        booksData = [];
      }
      setBooks(booksData);
      setError(null);
      setServerStatus('online');

      console.log('✅ Books loaded successfully for collections:', booksData.length);
      console.log('📖 Currently reading books:', booksData.filter(b => b.is_reading).length);

      // Track collections page visit
      if (gamificationContext?.trackAction) {
        try {
          await gamificationContext.trackAction('collections_visited', {
            bookCount: booksData.length,
            currentlyReading: booksData.filter(b => b.is_reading).length
          });
        } catch (gamError) {
          console.warn('⚠️ Gamification tracking failed (non-critical):', gamError.message);
        }
      }

    } catch (apiError) {
      console.error('❌ COLLECTIONS API ERROR - Server/API Error:', apiError);
      console.error('❌ COLLECTIONS API ERROR - Error message:', apiError.message);
      console.error('❌ COLLECTIONS API ERROR - Error status:', apiError.response?.status);
      console.error('❌ COLLECTIONS API ERROR - Error data:', apiError.response?.data);

      let userFriendlyMessage = 'Failed to load your collections';
      let shouldRedirect = false;

      // Enhanced error handling
      if (apiError.response?.status === 401) {
        userFriendlyMessage = 'Your session has expired. Please log in again.';
        shouldRedirect = true;
        setServerStatus('offline');
      } else if (apiError.response?.status === 403) {
        userFriendlyMessage = 'You do not have permission to access collections.';
        setServerStatus('offline');
      } else if (apiError.response?.status === 500) {
        userFriendlyMessage = 'Server error. Please try again later.';
        setServerStatus('offline');
      } else if (apiError.code === 'NETWORK_ERROR' ||
                 apiError.message?.includes('Failed to fetch') ||
                 apiError.code === 'ERR_NETWORK' ||
                 apiError.message?.includes('Network Error')) {
        userFriendlyMessage = 'Cannot connect to server. Please check your internet connection.';
        setServerStatus('offline');
      } else if (apiError.code === 'ECONNABORTED' || apiError.message?.includes('timeout')) {
        userFriendlyMessage = 'Request timed out. Please try again.';
        setServerStatus('offline');
      }

      setError(userFriendlyMessage);
      showNotification(userFriendlyMessage, 'error');

      if (shouldRedirect) {
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  // Book update handler - ensures data consistency with Dashboard
  const handleBookUpdate = async (updatedBook) => {
    console.log('📚 Updating book from collections page:', updatedBook.title, 'Status:', {
      is_reading: updatedBook.is_reading,
      completed: updatedBook.completed
    });

    try {
      // Update book in database
      await API.patch(`/books/${updatedBook.id}`, {
        is_reading: updatedBook.is_reading,
        completed: updatedBook.completed,
        progress: updatedBook.progress || (updatedBook.completed ? 100 : updatedBook.progress),
        last_opened: updatedBook.is_reading ? new Date().toISOString() : updatedBook.last_opened,
        completed_date: updatedBook.completed ? new Date().toISOString() : null
      });

      // Update local state
      setBooks(prevBooks =>
        prevBooks.map(existingBook =>
          existingBook.id === updatedBook.id
            ? { ...existingBook, ...updatedBook }
            : existingBook
        )
      );

      // Track gamification action
      if (gamificationContext?.trackAction) {
        if (updatedBook.is_reading && !updatedBook.completed) {
          await gamificationContext.trackAction('reading_started', {
            bookId: updatedBook.id,
            title: updatedBook.title,
            source: 'collections'
          });
        } else if (updatedBook.completed) {
          await gamificationContext.trackAction('book_completed', {
            bookId: updatedBook.id,
            title: updatedBook.title,
            source: 'collections'
          });
        }
      }

      console.log('✅ Book status updated successfully from collections page');
      showNotification(
        updatedBook.completed
          ? `Marked "${updatedBook.title}" as completed! 🎉`
          : updatedBook.is_reading
            ? `Started reading "${updatedBook.title}"`
            : `Updated "${updatedBook.title}"`,
        'success'
      );

    } catch (error) {
      console.error('❌ Failed to update book status from collections:', error);
      showNotification('Failed to update book status', 'error');
    }
  };

  // Retry function
  const handleRetry = () => {
    console.log('🔄 Retrying server connection...');
    fetchBooks();
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-800">Loading Your Collections</h3>
            <p className="text-gray-600">Organizing your library into collections...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state with retry
  if (error && serverStatus === 'offline') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center space-y-8 max-w-md mx-auto p-6">
          <div className="text-8xl mb-4">📡</div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-gray-800">Connection Issue</h2>
            <p className="text-lg text-gray-600 leading-relaxed">{error}</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleRetry}
              disabled={loading}
              className="w-full px-8 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:bg-gray-400 transition-all duration-200 transform hover:scale-105 font-medium text-lg"
            >
              {loading ? 'Connecting...' : 'Try Again'}
            </button>

            <div className="text-sm text-gray-500 space-y-2">
              <p>Troubleshooting tips:</p>
              <ul className="text-left space-y-1">
                <li>• Check your internet connection</li>
                <li>• Make sure the server is running</li>
                <li>• Try refreshing the page</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main component - pass books data to EnhancedCollectionsPage
  return (
    <div style={{
      background: actualTheme === 'dark' ? '#0f172a' : '#f8fafc',
      minHeight: '100vh',
      transition: 'background 0.3s ease'
    }}>
      <EnhancedCollectionsPage
        books={books}
        onBookUpdate={handleBookUpdate}
        user={user}
        className="collections-page"
      />
    </div>
  );
};

// Main wrapper component
const CollectionsPageWrapper = () => {
  return (
    <Material3ThemeProvider>
      <MD3SnackbarProvider>
        <CollectionsPageContent />
      </MD3SnackbarProvider>
    </Material3ThemeProvider>
  );
};

export default CollectionsPageWrapper;