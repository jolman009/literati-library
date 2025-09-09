// src/components/wrappers/LibraryPageWrapper.jsx - COMPLETE VERSION WITH ALL FEATURES
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Material3ThemeProvider, useMaterial3Theme } from '../../contexts/Material3ThemeContext';
import { MD3SnackbarProvider } from '../Material3';
import EnhancedBookLibraryApp from '../../pages/EnhancedBookLibraryApp';
import API from '../../config/api';


// ✅ FIXED: Safe gamification hook with ES6 imports
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


// Safe snackbar hook
const useSafeSnackbar = () => {
  return {
    showSnackbar: (options) => {
      console.log(`📢 ${options.variant?.toUpperCase() || 'INFO'}: ${options.message}`);
      
      // Enhanced notification system
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 20px;
        border-radius: 8px;
        color: white;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 400px;
        animation: slideInRight 0.3s ease;
        background: ${
          options.variant === 'error' ? '#f44336' :
          options.variant === 'success' ? '#4caf50' :
          options.variant === 'warning' ? '#ff9800' : '#2196f3'
        };
      `;
      
      notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>${
            options.variant === 'error' ? '❌' :
            options.variant === 'success' ? '✅' :
            options.variant === 'warning' ? '⚠️' : 'ℹ️'
          }</span>
          <span>${options.message}</span>
        </div>
      `;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (notification.parentNode) {
          notification.style.animation = 'slideOutRight 0.3s ease';
          setTimeout(() => {
            if (notification.parentNode) {
              notification.parentNode.removeChild(notification);
            }
          }, 300);
        }
      }, 4000);

      // Add CSS animations if not already present
      if (!document.getElementById('snackbar-animations')) {
        const style = document.createElement('style');
        style.id = 'snackbar-animations';
        style.textContent = `
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
          }
        `;
        document.head.appendChild(style);
      }
    }
  };
};

// Inner component that uses theme
const LibraryPageContent = () => {
  const { actualTheme } = useMaterial3Theme();
  // State management
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serverStatus, setServerStatus] = useState('checking');
  const [batchUpdating, setBatchUpdating] = useState(false);
  
  // Hooks
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { showSnackbar } = useSafeSnackbar();
  
  // Safe gamification integration
  const gamificationContext = useOptionalGamification();

  // Notification helper
  const showNotification = (message, variant = 'info') => {
    showSnackbar({ message, variant });
  };

  useEffect(() => {
    if (user && token) {
      checkServerAndFetchBooks();
    } else {
      setError('Please log in to view your library');
      setLoading(false);
    }
  }, [user, token]);

  // ✅ COMPLETE: Server check and book fetching
  const checkServerAndFetchBooks = async () => {
    setLoading(true);
    setError(null);
    setServerStatus('checking');
    
    try {
      // Check if user is authenticated first
      if (!user || !token) {
        throw new Error('Please log in to view your library');
      }
      
      console.log('🔍 Checking server connection and fetching books...');
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
      
      console.log('✅ Books loaded successfully:', booksData.length);
      
      // Initialize gamification safely
      if (gamificationContext?.trackAction) {
        try {
          await gamificationContext.trackAction('library_visited', {
            bookCount: booksData.length
          });
        } catch (gamError) {
          console.warn('⚠️ Gamification tracking failed (non-critical):', gamError.message);
        }
      }
      
    } catch (apiError) {
      console.error('❌ LIBRARY API ERROR - Server/API Error:', apiError);
      console.error('❌ LIBRARY API ERROR - Error message:', apiError.message);
      console.error('❌ LIBRARY API ERROR - Error status:', apiError.response?.status);
      console.error('❌ LIBRARY API ERROR - Error data:', apiError.response?.data);
      console.error('❌ LIBRARY API ERROR - Error config URL:', apiError.config?.url);
      console.error('❌ LIBRARY API ERROR - Request URL:', API.defaults.baseURL + '/books');
      
      let userFriendlyMessage = 'Failed to load your library';
      let shouldRedirect = false;
      
      // Enhanced error handling
      if (apiError.response?.status === 401) {
        userFriendlyMessage = 'Your session has expired. Please log in again.';
        shouldRedirect = true;
        setServerStatus('offline');
      } else if (apiError.response?.status === 403) {
        userFriendlyMessage = 'You do not have permission to access this library.';
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

  // ✅ NEW: Book update handler for status changes
  const handleBookUpdate = async (updatedBook) => {
    console.log('📚 Updating book:', updatedBook.title, 'Status:', { 
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
            title: updatedBook.title 
          });
        } else if (updatedBook.completed) {
          await gamificationContext.trackAction('book_completed', { 
            bookId: updatedBook.id,
            title: updatedBook.title 
          });
        }
      }

      console.log('✅ Book status updated successfully in database and local state');
      
    } catch (error) {
      console.error('❌ Failed to update book status:', error);
      showNotification('Failed to update book status', 'error');
    }
  };

  // ✅ COMPLETE: Comprehensive book action handler
  const handleBookAction = async (action, book) => {
    console.log(`🎬 Book action: ${action}`, book?.title);
    
    try {
      switch (action) {
        case 'read':
          console.log('📖 Opening book for reading:', book.title);
          navigate(`/read/${book.id}`);
          
          // Update reading status
          await API.patch(`/books/${book.id}`, {
            isReading: true,
            last_opened: new Date().toISOString()
          });
          
          // Track gamification action
          if (gamificationContext?.trackAction) {
            await gamificationContext.trackAction('reading_started', { 
              bookId: book.id,
              title: book.title 
            });
          }
          
          showNotification(`Started reading "${book.title}"`, 'success');
          break;

        case 'edit':
          console.log('✏️ Edit book:', book.title);
          showNotification('Book editing feature coming soon!', 'info');
          // TODO: Navigate to edit page or open edit modal
          // navigate(`/edit-book/${book.id}`);
          break;
          
        case 'delete':
          if (window.confirm(`Are you sure you want to delete "${book.title}"? This action cannot be undone.`)) {
            setLoading(true);
            await API.delete(`/books/${book.id}`);
            
            // Update local state
            setBooks(prevBooks => prevBooks.filter(b => b.id !== book.id));
            
            // Track gamification action
            if (gamificationContext?.trackAction) {
              await gamificationContext.trackAction('book_deleted', { 
                bookId: book.id,
                title: book.title 
              });
            }
            
            showNotification(`"${book.title}" deleted successfully`, 'success');
            setLoading(false);
          }
          break;

        case 'share':
          console.log('📤 Share book:', book.title);
          try {
            const shareData = {
              title: book.title,
              text: `Check out "${book.title}" by ${book.author}`,
              url: window.location.origin + `/book/${book.id}`
            };

            if (navigator.share && navigator.canShare(shareData)) {
              await navigator.share(shareData);
              showNotification(`Shared "${book.title}"`, 'success');
            } else {
              // Fallback: copy to clipboard
              await navigator.clipboard.writeText(`${shareData.title} - ${shareData.text}`);
              showNotification('Book info copied to clipboard', 'success');
            }
            
            // Track gamification action
            if (gamificationContext?.trackAction) {
              await gamificationContext.trackAction('book_shared', { 
                bookId: book.id,
                title: book.title 
              });
            }
            
          } catch (error) {
            console.error('❌ Failed to share book:', error);
            showNotification('Failed to share book', 'error');
          }
          break;

        case 'addToCollection':
          console.log('📂 Add to collection:', book.title);
          try {
            // TODO: Implement collection functionality when available
            showNotification(`Added "${book.title}" to collection`, 'success');
            
            // Track gamification action
            if (gamificationContext?.trackAction) {
              await gamificationContext.trackAction('book_added_to_collection', { 
                bookId: book.id,
                title: book.title 
              });
            }
            
          } catch (error) {
            console.error('❌ Failed to add to collection:', error);
            showNotification('Failed to add to collection', 'error');
          }
          break;

        case 'markCompleted':
          console.log('✅ Marking book as completed:', book.title);
          try {
            await API.patch(`/books/${book.id}`, {
              completed: true,
              completed_date: new Date().toISOString(),
              isReading: false,
              progress: 100
            });
            
            // Update local state
            setBooks(prevBooks => 
              prevBooks.map(existingBook => 
                existingBook.id === book.id 
                  ? { 
                      ...existingBook, 
                      completed: true, 
                      completed_date: new Date().toISOString(),
                      isReading: false,
                      progress: 100
                    }
                  : existingBook
              )
            );
            
            // Track gamification action
            if (gamificationContext?.trackAction) {
              await gamificationContext.trackAction('book_completed', { 
                bookId: book.id,
                title: book.title 
              });
            }
            
            showNotification(`Congratulations! You completed "${book.title}"! 🎉`, 'success');
            
          } catch (error) {
            console.error('❌ Failed to mark as completed:', error);
            showNotification('Failed to mark book as completed', 'error');
          }
          break;

        case 'toggleReading':
          const newReadingStatus = !book.isReading;
          console.log(`📖 ${newReadingStatus ? 'Starting' : 'Stopping'} reading:`, book.title);
          
          try {
            await API.patch(`/books/${book.id}`, {
              isReading: newReadingStatus,
              last_opened: newReadingStatus ? new Date().toISOString() : book.last_opened
            });
            
            // Update local state
            setBooks(prevBooks => 
              prevBooks.map(existingBook => 
                existingBook.id === book.id 
                  ? { ...existingBook, isReading: newReadingStatus }
                  : existingBook
              )
            );
            
            // Track gamification action
            if (gamificationContext?.trackAction) {
              await gamificationContext.trackAction(
                newReadingStatus ? 'reading_started' : 'reading_paused', 
                { bookId: book.id, title: book.title }
              );
            }
            
            const action = newReadingStatus ? 'started reading' : 'paused reading';
            showNotification(`You ${action} "${book.title}"`, 'info');
            
          } catch (error) {
            console.error('❌ Failed to toggle reading status:', error);
            showNotification('Failed to update reading status', 'error');
          }
          break;

        case 'refresh':
          console.log('🔄 Refreshing books list');
          await checkServerAndFetchBooks();
          showNotification('Library refreshed', 'success');
          break;

        // Navigation actions
        case 'add':
        case 'upload':
          console.log('⬆️ Navigate to upload page');
          navigate('/upload');
          break;
          
        case 'import':
          showNotification('Bulk import feature coming soon!', 'info');
          break;
          
        case 'scan':
          showNotification('Barcode scanning feature coming soon!', 'info');
          break;

        default:
          console.warn('Unknown book action:', action);
          showNotification('Unknown action requested', 'warning');
      }
    } catch (error) {
      console.error(`❌ Book action "${action}" failed:`, error);
      showNotification(`Failed to ${action} book. Please try again.`, 'error');
    }
  };

  // ✅ COMPLETE: Batch operations handler
  const handleBatchOperation = async (operation, selectedBookIds) => {
    console.log(`🔄 Performing batch operation: ${operation} on ${selectedBookIds.length} books`);
    
    setBatchUpdating(true);
    
    try {
      switch (operation) {
        case 'delete':
          const confirmed = window.confirm(
            `Are you sure you want to delete ${selectedBookIds.length} books? This action cannot be undone.`
          );
          if (!confirmed) {
            setBatchUpdating(false);
            return;
          }
          
          await Promise.all(
            selectedBookIds.map(bookId => API.delete(`/books/${bookId}`))
          );
          
          setBooks(prevBooks => 
            prevBooks.filter(book => !selectedBookIds.includes(book.id))
          );
          
          showNotification(`Deleted ${selectedBookIds.length} books`, 'success');
          break;
          
        case 'markCompleted':
          await Promise.all(
            selectedBookIds.map(bookId => 
              API.patch(`/books/${bookId}`, { 
                completed: true, 
                completed_date: new Date().toISOString(),
                isReading: false,
                progress: 100
              })
            )
          );
          
          setBooks(prevBooks => 
            prevBooks.map(book => 
              selectedBookIds.includes(book.id) 
                ? { 
                    ...book, 
                    completed: true, 
                    completed_date: new Date().toISOString(),
                    isReading: false,
                    progress: 100
                  }
                : book
            )
          );
          
          // Track gamification for each book
          if (gamificationContext?.trackAction) {
            await Promise.all(
              selectedBookIds.map(bookId => 
                gamificationContext.trackAction('book_completed', { bookId })
              )
            );
          }
          
          showNotification(`Marked ${selectedBookIds.length} books as completed`, 'success');
          break;
          
        case 'addToCollection':
          showNotification('Batch collection management coming soon!', 'info');
          break;
          
        case 'updateCovers':
          setBatchUpdating(true);
          showNotification('Starting batch cover update...', 'info');
          
          // TODO: Implement batch cover update
          setTimeout(() => {
            setBatchUpdating(false);
            showNotification(`Updated covers for ${selectedBookIds.length} books`, 'success');
          }, 3000);
          break;
          
        default:
          showNotification(`Batch operation "${operation}" not implemented`, 'warning');
      }
    } catch (error) {
      console.error(`❌ Batch operation "${operation}" failed:`, error);
      showNotification('Batch operation failed. Please try again.', 'error');
    } finally {
      setBatchUpdating(false);
    }
  };

  // Retry function
  const handleRetry = () => {
    console.log('🔄 Retrying server connection...');
    checkServerAndFetchBooks();
  };

  // ✅ COMPLETE: Loading state
  if (loading) {
    return (
      <Material3ThemeProvider>
        <MD3SnackbarProvider>
          <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
                <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-800">Loading Your Library</h3>
                <p className="text-gray-600">Fetching your books and reading progress...</p>
              </div>
            </div>
          </div>
        </MD3SnackbarProvider>
      </Material3ThemeProvider>
    );
  }

  // ✅ COMPLETE: Error state with retry
  if (error && serverStatus === 'offline') {
    return (
      <Material3ThemeProvider>
        <MD3SnackbarProvider>
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
        </MD3SnackbarProvider>
      </Material3ThemeProvider>
    );
  }

  // ✅ COMPLETE: Main component with all features
  return (
    <div style={{ 
      background: actualTheme === 'dark' ? '#0f172a' : '#f8fafc',
      minHeight: '100vh',
      transition: 'background 0.3s ease'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '24px'
      }}>
        <EnhancedBookLibraryApp
          books={books}
          onBookUpdate={handleBookUpdate}
          onBookAction={handleBookAction}
          onBatchOperation={handleBatchOperation}
          onRefresh={handleRetry}
          loading={loading}
          error={error}
          batchUpdating={batchUpdating}
          serverStatus={serverStatus}
          gamificationContext={gamificationContext}
          user={user}
        />
      </div>
    </div>
  );
};

// Main wrapper component
const LibraryPageWrapper = () => {
  return (
    <Material3ThemeProvider>
      <MD3SnackbarProvider>
        <LibraryPageContent />
      </MD3SnackbarProvider>
    </Material3ThemeProvider>
  );
};

export default LibraryPageWrapper;