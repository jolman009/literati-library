

// src/components/wrappers/LibraryPageWrapper.jsx - COMPLETE FIXED VERSION
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useGamification } from '../../contexts/GamificationContext';
import API from '../../config/api';
import EnhancedBookLibraryApp from '../EnhancedBookLibraryApp';

const LibraryPageWrapper = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serverStatus, setServerStatus] = useState('checking');
  const { user, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && token) {
      checkServerAndFetchBooks();
    } else {
      setError('Please log in to view your library');
      setLoading(false);
    }
  }, [user, token]);

  // Initialize gamification context safely
  let gamificationContext = null;
  try {
    gamificationContext = useGamification();
  } catch (error) {
    console.warn('⚠️ Gamification context not available:', error.message);
  }

  const checkServerAndFetchBooks = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Checking server connection...');
      
      // Try a simple API call instead of health endpoint
      const testResponse = await API.get('/books', { timeout: 5000 });
      
      setServerStatus('online');
      console.log('✅ Server is online');
      
      // If the test call succeeded, use its data
      setBooks(testResponse.data || []);
      
      // Initialize gamification data safely (non-blocking)
      if (gamificationContext) {
        try {
          console.log('🎯 Gamification context is available');
          // The gamification context will load its own data on mount
        } catch (gamificationError) {
          console.warn('⚠️ Gamification initialization failed (non-critical):', gamificationError.message);
          // Don't block the library page for gamification failures
        }
      }
      
      setLoading(false);
      
    } catch (error) {
      console.error('❌ Server connection failed:', error);
      
      // Only set offline status for network errors
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        setServerStatus('offline');
        setError('Cannot connect to server. Please check your internet connection.');
      } else {
        // For other errors, still try to show the library
        setServerStatus('online');
        await fetchBooks();
      }
    }
  };

  const fetchBooks = async () => {
    console.log('📚 LibraryPageWrapper: Starting to fetch books...');
    
    if (!user || !token) {
      console.log('❌ No authentication - user must log in first');
      setError('Please log in to view your library');
      setLoading(false);
      return;
    }
    
    try {
      console.log('🔍 API Base URL:', API.defaults.baseURL);
      
      const response = await API.get('/books');
      console.log('📚 Books fetched successfully:', {
        count: response.data?.length || 0,
        books: response.data?.map(book => ({ 
          id: book.id, 
          title: book.title, 
          isReading: book.isReading 
        }))
      });
      
      setBooks(response.data || []);
      setError(null);
      setServerStatus('online');
      
    } catch (error) {
      console.error('❌ Failed to fetch books:', error);
      
      let userFriendlyError = 'Failed to load your library';
      
      if (error.response?.status === 401) {
        userFriendlyError = 'Your session has expired. Please log in again.';
      } else if (error.response?.status === 403) {
        userFriendlyError = 'You do not have permission to access this library.';
      } else if (error.response?.status === 500) {
        userFriendlyError = 'Server error. Please try again later.';
      } else if (error.message.includes('Failed to fetch')) {
        userFriendlyError = 'Cannot connect to server. Please check your connection.';
        setServerStatus('offline');
      }
      
      setError(userFriendlyError);
    } finally {
      setLoading(false);
    }
  };

  // ✅ COMPLETE: Handle all book update actions
  const handleBookUpdate = async (action, book) => {
    console.log('🎬 Book action triggered:', action, book.title);
    
    switch (action) {
      case 'read':
        // ✅ FIXED: Navigate to reader with CORRECT parameter name 'id'
        console.log('📖 Opening reader for:', book.title, 'ID:', book.id);
        if (!book || !book.id) {
          console.error('Cannot open book: Invalid book or book ID', book);
          showNotification('Cannot open book: Invalid book data', 'error');
          return;
        }
        // ✅ CRITICAL FIX: Use 'id' parameter to match the route definition
        navigate(`/read/${book.id}`);
        break;
        
      // ✅ FIXED: Handle both naming conventions for reading actions
      case 'startReading':
      case 'start-reading':
        console.log('▶️ Starting to read:', book.title);
        const startResult = await updateReadingStatus(book.id, true);
        if (startResult.success) {
          // Track gamification action safely
          if (gamificationContext && gamificationContext.trackAction) {
            try {
              await gamificationContext.trackAction('start_reading', { bookId: book.id });
            } catch (error) {
              console.warn('⚠️ Gamification tracking failed (non-critical):', error.message);
            }
          }
        }
        break;
        
      case 'stopReading':
      case 'stop-reading':
        console.log('⏹️ Stopping reading:', book.title);
        const stopResult = await updateReadingStatus(book.id, false);
        if (stopResult.success) {
          // Track gamification action safely
          if (gamificationContext && gamificationContext.trackAction) {
            try {
              await gamificationContext.trackAction('stop_reading', { bookId: book.id });
            } catch (error) {
              console.warn('⚠️ Gamification tracking failed (non-critical):', error.message);
            }
          }
        }
        break;

      // ✅ COMPLETE: Cover update functionality
      case 'updateCover':
        console.log('🎨 Updating cover for:', book.title);
        try {
          // Update the local state immediately for better UX
          setBooks(prevBooks => 
            prevBooks.map(existingBook => 
              existingBook.id === book.id 
                ? { ...existingBook, cover_url: book.newCoverUrl || book.cover_url }
                : existingBook
            )
          );
          
          // If there's a new cover URL, update it on the server
          if (book.newCoverUrl) {
            await API.patch(`/books/${book.id}`, {
              cover_url: book.newCoverUrl
            });
          }
          
          showNotification(`Cover updated for "${book.title}"`, 'success');
        } catch (error) {
          console.error('❌ Failed to update cover:', error);
          showNotification('Failed to update cover. Please try again.', 'error');
          
          // Revert the optimistic update
          setBooks(prevBooks => 
            prevBooks.map(existingBook => 
              existingBook.id === book.id 
                ? { ...existingBook, cover_url: book.originalCoverUrl || existingBook.cover_url }
                : existingBook
            )
          );
        }
        break;

      // ✅ COMPLETE: Delete functionality
      case 'delete':
        console.log('🗑️ Deleting book:', book.title);
        try {
          // Show confirmation dialog (you can enhance this with a proper modal)
          const confirmed = window.confirm(`Are you sure you want to delete "${book.title}"? This action cannot be undone.`);
          
          if (!confirmed) {
            console.log('❌ User cancelled book deletion');
            return;
          }

          // Optimistically remove from UI
          setBooks(prevBooks => prevBooks.filter(b => b.id !== book.id));
          
          // Delete from server
          await API.delete(`/books/${book.id}`);
          
          showNotification(`"${book.title}" has been deleted`, 'success');
          
          // Track gamification action safely
          if (gamificationContext && gamificationContext.trackAction) {
            try {
              await gamificationContext.trackAction('book_deleted', { bookId: book.id });
            } catch (error) {
              console.warn('⚠️ Gamification tracking failed (non-critical):', error.message);
            }
          }
          
        } catch (error) {
          console.error('❌ Failed to delete book:', error);
          
          // Restore the book in UI if deletion failed
          setBooks(prevBooks => {
            const existingBook = prevBooks.find(b => b.id === book.id);
            if (!existingBook) {
              return [...prevBooks, book];
            }
            return prevBooks;
          });
          
          showNotification('Failed to delete book. Please try again.', 'error');
        }
        break;

      // ✅ COMPLETE: Download functionality
      case 'download':
        console.log('📥 Downloading book:', book.title);
        try {
          if (!book.file_url) {
            showNotification('No file available for download', 'warning');
            return;
          }

          // Create download link
          const link = document.createElement('a');
          link.href = book.file_url;
          link.download = `${book.title} - ${book.author}.${book.format || 'pdf'}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          showNotification(`Downloading "${book.title}"`, 'success');
          
          // Track gamification action safely
          if (gamificationContext && gamificationContext.trackAction) {
            try {
              await gamificationContext.trackAction('book_downloaded', { bookId: book.id });
            } catch (error) {
              console.warn('⚠️ Gamification tracking failed (non-critical):', error.message);
            }
          }
          
        } catch (error) {
          console.error('❌ Failed to download book:', error);
          showNotification('Failed to download book. Please try again.', 'error');
        }
        break;

      // ✅ COMPLETE: Edit functionality
      case 'edit':
        console.log('✏️ Editing book:', book.title);
        try {
          // TODO: Implement proper edit modal/form
          // For now, just show a placeholder
          showNotification(`Edit functionality for "${book.title}" coming soon!`, 'info');
          
          // You can navigate to an edit page:
          // navigate(`/edit-book/${book.id}`);
          
        } catch (error) {
          console.error('❌ Failed to edit book:', error);
          showNotification('Failed to open book editor.', 'error');
        }
        break;

      case 'share':
        console.log('📤 Share book:', book.title);
        try {
          // Generate shareable link (if your app supports it)
          const shareData = {
            title: book.title,
            text: `Check out "${book.title}" by ${book.author}`,
            url: window.location.origin + `/book/${book.id}` // Assuming you have a public book view
          };

          if (navigator.share && navigator.canShare(shareData)) {
            await navigator.share(shareData);
            showNotification(`Shared "${book.title}"`, 'success');
          } else {
            // Fallback: copy to clipboard
            await navigator.clipboard.writeText(`${shareData.title} - ${shareData.text}`);
            showNotification('Book info copied to clipboard', 'success');
          }
          
        } catch (error) {
          console.error('❌ Failed to share book:', error);
          showNotification('Failed to share book', 'error');
        }
        break;

      case 'addToCollection':
        console.log('📂 Add to collection:', book.title);
        try {
          // TODO: Implement collection functionality
          showNotification(`Added "${book.title}" to collection`, 'success');
          
          // Track gamification action safely
          if (gamificationContext && gamificationContext.trackAction) {
            try {
              await gamificationContext.trackAction('book_added_to_collection', { bookId: book.id });
            } catch (error) {
              console.warn('⚠️ Gamification tracking failed (non-critical):', error.message);
            }
          }
          
        } catch (error) {
          console.error('❌ Failed to add to collection:', error);
          showNotification('Failed to add to collection', 'error');
        }
        break;

      // ✅ COMPLETE: Mark as completed
      case 'markCompleted':
        console.log('✅ Marking book as completed:', book.title);
        try {
          await API.patch(`/books/${book.id}`, {
            completed: true,
            completed_date: new Date().toISOString(),
            isReading: false
          });
          
          // Update local state
          setBooks(prevBooks => 
            prevBooks.map(existingBook => 
              existingBook.id === book.id 
                ? { 
                    ...existingBook, 
                    completed: true, 
                    completed_date: new Date().toISOString(),
                    isReading: false 
                  }
                : existingBook
            )
          );
          
          showNotification(`Congratulations! You completed "${book.title}"`, 'success');
          
          // Track gamification action safely
          if (gamificationContext && gamificationContext.trackAction) {
            try {
              await gamificationContext.trackAction('book_completed', { 
                bookId: book.id,
                title: book.title 
              });
            } catch (error) {
              console.warn('⚠️ Gamification tracking failed (non-critical):', error.message);
            }
          }
          
        } catch (error) {
          console.error('❌ Failed to mark book as completed:', error);
          showNotification('Failed to mark book as completed', 'error');
        }
        break;

      // ✅ COMPLETE: Mark as unread
      case 'markUnread':
        console.log('📖 Marking book as unread:', book.title);
        try {
          await API.patch(`/books/${book.id}`, {
            completed: false,
            completed_date: null,
            isReading: false,
            progress: 0,
            current_page: 0
          });
          
          // Update local state
          setBooks(prevBooks => 
            prevBooks.map(existingBook => 
              existingBook.id === book.id 
                ? { 
                    ...existingBook, 
                    completed: false, 
                    completed_date: null,
                    isReading: false,
                    progress: 0,
                    current_page: 0
                  }
                : existingBook
            )
          );
          
          showNotification(`"${book.title}" marked as unread`, 'success');
          
        } catch (error) {
          console.error('❌ Failed to mark book as unread:', error);
          showNotification('Failed to mark book as unread', 'error');
        }
        break;
        
      default:
        console.log('❓ Unknown action:', action);
        showNotification(`Unknown action: ${action}`, 'warning');
    }
  };

  // ✅ COMPLETE: Reading status management with comprehensive error handling
  const updateReadingStatus = async (bookId, isReading) => {
    try {
      console.log(`📖 ${isReading ? 'Starting' : 'Stopping'} reading for book:`, bookId);
      
      const requestData = {
        isReading: isReading,
        last_read: isReading ? new Date().toISOString() : undefined
      };
      
      const response = await API.patch(`/books/${bookId}/reading-status`, requestData);
      
      // Update local state immediately for better UX
      setBooks(prevBooks => 
        prevBooks.map(book => 
          book.id === bookId 
            ? { 
                ...book, 
                isReading: isReading,
                last_read: isReading ? new Date().toISOString() : book.last_read 
              } 
            : book
        )
      );
      
      const bookTitle = books.find(b => b.id === bookId)?.title || 'Unknown';
      console.log(`✅ ${isReading ? 'Started' : 'Stopped'} reading: ${bookTitle}`);
      
      // Show success notification
      showNotification(
        `${isReading ? 'Started' : 'Stopped'} reading "${bookTitle}"`,
        'success'
      );
      
      return { success: true };
    } catch (error) {
      console.error(`❌ Failed to ${isReading ? 'start' : 'stop'} reading:`, error);
      
      const bookTitle = books.find(b => b.id === bookId)?.title || 'book';
      const action = isReading ? 'start reading' : 'stop reading';
      
      showNotification(
        `Failed to ${action} "${bookTitle}". Please try again.`,
        'error'
      );
      
      return { success: false, error };
    }
  };

  // ✅ COMPLETE: Refresh books functionality
  const refreshBooks = async () => {
    console.log('🔄 Refreshing books...');
    setLoading(true);
    await fetchBooks();
  };

  // ✅ COMPLETE: Batch operations support
  const handleBatchOperation = async (operation, selectedBookIds) => {
    console.log(`🔄 Performing batch operation: ${operation} on ${selectedBookIds.length} books`);
    
    try {
      switch (operation) {
        case 'delete':
          const confirmed = window.confirm(`Are you sure you want to delete ${selectedBookIds.length} books? This action cannot be undone.`);
          if (!confirmed) return;
          
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
                completed_date: new Date().toISOString() 
              })
            )
          );
          
          setBooks(prevBooks => 
            prevBooks.map(book => 
              selectedBookIds.includes(book.id) 
                ? { ...book, completed: true, completed_date: new Date().toISOString() }
                : book
            )
          );
          
          showNotification(`Marked ${selectedBookIds.length} books as completed`, 'success');
          break;
          
        default:
          showNotification(`Batch operation ${operation} not implemented yet`, 'warning');
      }
    } catch (error) {
      console.error('❌ Batch operation failed:', error);
      showNotification(`Batch operation failed: ${error.message}`, 'error');
    }
  };

  // ✅ COMPLETE: Enhanced notification system
  const showNotification = (message, type = 'info', duration = 4000) => {
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
    
    // TODO: Replace with your actual notification system
    // This is a basic implementation - you can enhance it with:
    // - Toast notifications
    // - Snackbar component
    // - Custom notification center
    
    // For now, just log to console and show browser notification if available
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Literati', {
        body: message,
        icon: '/favicon.ico'
      });
    }
    
    // You can also integrate with your Material3 snackbar system here
    // Example:
    // const { showSnackbar } = useSnackbar();
    // showSnackbar({ message, variant: type });
  };

  // ✅ COMPLETE: Loading state component
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
          <p className="text-lg text-on-surface">Loading your library...</p>
          <p className="text-sm text-on-surface-variant">
            {serverStatus === 'checking' ? 'Checking server connection...' : 'Fetching your books...'}
          </p>
        </div>
      </div>
    );
  }

  // ✅ COMPLETE: Error state component
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="text-center space-y-4 max-w-md mx-auto p-8">
          <div className="text-6xl text-error">
            {serverStatus === 'offline' ? '🌐' : '❌'}
          </div>
          <h3 className="text-xl font-semibold text-on-surface">
            {serverStatus === 'offline' ? 'Connection Problem' : 'Library Error'}
          </h3>
          <p className="text-on-surface-variant">{error}</p>
          
          <div className="flex gap-2 justify-center">
            <button 
              onClick={checkServerAndFetchBooks}
              className="bg-primary text-on-primary px-4 py-2 rounded hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
            {serverStatus === 'offline' && (
              <button 
                onClick={() => window.location.reload()}
                className="bg-secondary text-on-secondary px-4 py-2 rounded hover:bg-secondary/90 transition-colors"
              >
                Reload Page
              </button>
            )}
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-on-surface-variant bg-surface-variant p-2 rounded mt-4">
              <strong>Debug Info:</strong><br />
              Server Status: {serverStatus}<br />
              User: {user?.email || 'Not logged in'}<br />
              Token: {token ? 'Present' : 'Missing'}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ✅ COMPLETE: Success state - render the main library component
  console.log('📚 Rendering library with', books.length, 'books');
  
  return (
    <EnhancedBookLibraryApp
      books={books}
      onBookUpdate={handleBookUpdate}
      onBatchOperation={handleBatchOperation}
      onRefresh={refreshBooks}
      user={user}
      analytics={{
        totalBooks: books.length,
        booksReading: books.filter(b => b.isReading).length,
        booksCompleted: books.filter(b => b.completed).length,
        // Add more analytics as needed
      }}
      serverStatus={serverStatus}
      className="library-page-wrapper"
    />
  );
};

export default LibraryPageWrapper;