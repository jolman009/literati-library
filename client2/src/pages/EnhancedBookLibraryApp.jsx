import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import NavigationFAB from '../components/NavigationFAB';
import '../components/NavigationFAB.css';
// EnhancedBookCard imported for direct usage in featured book sections
import { useReadingSession } from '../contexts/ReadingSessionContext';
import { useGamification } from '../contexts/GamificationContext';
import MD3StatisticsPage from '../components/MD3StatisticsPage';
import { MD3Button, MD3FloatingActionButton, useSnackbar } from '../components/Material3';
import { fetchBooksWithCovers } from '../api/books';
import { ensureCoverForBook } from '../services/covers.js';
import VirtualizedBookGrid from '../components/performance/VirtualizedBookGrid';
import { generateMockBooks, performanceTest } from '../utils/mockBookGenerator.js';
import { measureCustomMetric } from '../utils/webVitals';
import { cachedApi, prefetchAppData, getApiMetrics } from '../api/cachedApi.js';
import { cacheManager, getCacheMetrics } from '../utils/cacheManager.js';

import { createDefaultCollections, loadCollectionsFromStorage, addBookToCollection, removeBookFromCollection, validateCollection } from '../utils/collections';

// NEW IMPORT: Add BookStatus components integration
import { BookStatusDropdown, BookStatusBadge, getBookStatus } from '../components/BookStatus';
import { useAuth } from '../contexts/AuthContext';

// Using EnhancedBookCard which has all the progress controls
import EnhancedBookCard from '../components/EnhancedBookCard';

// Lazy load heavy secondary components
const EnhancedCollectionsPage = React.lazy(() => import('./subpages/EnhancedCollectionsPage'));
const StatisticsPage = React.lazy(() => import('./library/StatisticsPage'));
import ReadingPage from './library/ReadingPage';
import NotesSubpage from './subpages/NotesSubpage';



// Safe snackbar hook with fallback
const useSafeSnackbar = () => {
  return {
    showSnackbar: (options) => {
      console.log(`📢 ${options.variant?.toUpperCase() || 'INFO'}: ${options.message}`);
      
      // Create a simple toast notification
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 350px;
        background: ${
          options.variant === 'error' ? '#f44336' :
          options.variant === 'success' ? '#4caf50' :
          options.variant === 'warning' ? '#ff9800' : '#2196f3'
        };
        animation: slideIn 0.3s ease;
      `;
      
      // Sanitize the message to prevent XSS
      const sanitizedMessage = DOMPurify.sanitize(options.message);

      notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>${
            options.variant === 'error' ? '❌' :
            options.variant === 'success' ? '✅' :
            options.variant === 'warning' ? '⚠️' : 'ℹ️'
          }</span>
          <span>${sanitizedMessage}</span>
        </div>
      `;
      
      document.body.appendChild(notification);
      
      // Auto-remove after 3 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.style.animation = 'slideOut 0.3s ease';
          setTimeout(() => {
            if (notification.parentNode) {
              notification.parentNode.removeChild(notification);
            }
          }, 300);
        }
      }, 3000);

      // Add CSS animations if not already present
      if (!document.getElementById('toast-animations')) {
        const style = document.createElement('style');
        style.id = 'toast-animations';
        style.textContent = `
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
          }
        `;
        document.head.appendChild(style);
      }
    }
  };
};

// Components
import GamificationDashboard from '../components/gamification/GamificationDashboard';
import WelcomeWidget from '../components/WelcomeWidget';

// Material Design 3 Components
import {
  MD3Card,
  MD3TextField,
  MD3Chip,
  MD3ChipGroup,
  MD3Dialog,
  MD3DialogActions,
  MD3Switch,
  MD3Menu,
  MD3MenuItem,
  MD3MenuDivider,
  MD3SortMenu,
  MD3BookActionsMenu,
  MD3BookLibraryFab,
  MD3Progress,
  CircularProgress,
  useThemeColors
} from '../components/Material3/index';

// Fallback theme colors hook if useThemeColors is not available
const useFallbackThemeColors = () => {
  return {
    getRgb: (colorToken) => {
      // Fallback Material 3 color mappings
      const colors = {
        'primary': '103, 80, 164',
        'on-surface': '29, 27, 32',
        'on-surface-variant': '73, 69, 79',
        'surface-variant': '231, 224, 236',
        'outline-variant': '202, 196, 208',
        'surface-container': '247, 243, 249',
        'surface-container-high': '236, 230, 240',
        'surface-container-highest': '230, 224, 233',
        'tertiary': '125, 82, 96',
        'on-tertiary': '255, 255, 255',
        'secondary': '98, 91, 113',
        'error': '186, 26, 26',
        'error-container': '255, 218, 214',
        'outline': '121, 116, 126'
      };
      return colors[colorToken] || '0, 0, 0';
    }
  };
};

// Safe theme colors hook with fallback
const useSafeThemeColors = () => {
  try {
    const themeColors = useThemeColors();
    if (themeColors && typeof themeColors.getRgb === 'function') {
      return themeColors;
    }
    return useFallbackThemeColors();
  } catch (error) {
    console.warn('useThemeColors not available, using fallback colors');
    return useFallbackThemeColors();
  }
};

// CSS
import './EnhancedBookLibraryApp.css';

// ===============================================
// ENHANCED SEARCH AND FILTER BAR WITH STATUS FILTERING
// ===============================================
const SearchAndFilterBar = ({
  searchQuery,
  onSearchChange,
  selectedGenres,
  onGenreChange,
  selectedStatus, // NEW: Status filtering
  onStatusChange, // NEW: Status filtering
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  availableGenres,
  books, // NEW: For status counts
  showAdvanced,
  onToggleAdvanced,
  batchMode,
  onToggleBatchMode,
  selectedBooks,
  onClearSelection,
  onBatchAction
}) => {
  const { getRgb } = useSafeThemeColors();

  // NEW: Calculate status counts for filter chips
  const statusCounts = useMemo(() => {
    const counts = {
      all: books.length,
      unread: 0,
      reading: 0,
      completed: 0,
      paused: 0
    };

    books.forEach(book => {
      const status = getBookStatus(book);
      counts[status]++;
    });

    return counts;
  }, [books]);

  const statusOptions = [
    { value: 'all', label: 'All Books', count: statusCounts.all, icon: '📚' },
    { value: 'unread', label: 'Unread', count: statusCounts.unread, icon: '📖' },
    { value: 'reading', label: 'Reading', count: statusCounts.reading, icon: '🔖' },
    { value: 'completed', label: 'Completed', count: statusCounts.completed, icon: '✅' },
    { value: 'paused', label: 'Paused', count: statusCounts.paused, icon: '⏸️' }
  ];

  return (
    <div className="search-filter-bar">
      {/* Search Row */}
      <div className="search-row">
        <MD3TextField
          variant="outlined"
          placeholder="Search books, authors, genres..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
          startIcon="🔍"
          style={{ flex: 1, minWidth: '300px' }}
        />

        <div className="view-controls">
          <MD3SortMenu
            value={sortBy}
            onChange={onSortChange}
            options={[
              { value: 'title', label: 'Title' },
              { value: 'author', label: 'Author' },
              { value: 'dateAdded', label: 'Date Added' },
              { value: 'progress', label: 'Progress' },
              { value: 'status', label: 'Status' },
              { value: 'genre', label: 'Genre' }
            ]}
          />

          <div className="view-mode-toggle">
            <MD3Button
              variant={viewMode === 'grid' ? 'filled' : 'outlined'}
              onClick={() => onViewModeChange('grid')}
              size="small"
            >
              Grid
            </MD3Button>
            <MD3Button
              variant={viewMode === 'list' ? 'filled' : 'outlined'}
              onClick={() => onViewModeChange('list')}
              size="small"
            >
              List
            </MD3Button>
          </div>
        </div>
      </div>

      {/* NEW: Status Filter Row */}
      <div className="filter-row" style={{ marginTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ 
            fontWeight: 600, 
            color: `rgb(${getRgb('on-surface')})`,
            fontSize: '14px' 
          }}>
            Filter by Status:
          </span>
          
          <MD3ChipGroup>
            {statusOptions.map(status => (
              <MD3Chip
                key={status.value}
                variant={selectedStatus === status.value ? 'filled' : 'outlined'}
                onClick={() => onStatusChange(status.value)}
                className="status-chip"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{status.icon}</span>
                {status.label} ({status.count})
              </MD3Chip>
            ))}
          </MD3ChipGroup>
        </div>
      </div>

      {/* Genre Filter Row */}
      {availableGenres.length > 0 && (
        <div className="filter-row" style={{ marginTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ 
              fontWeight: 600, 
              color: `rgb(${getRgb('on-surface')})`,
              fontSize: '14px' 
            }}>
              Filter by Genre:
            </span>
            
            <MD3ChipGroup>
              {availableGenres.map(genre => (
                <MD3Chip
                  key={genre}
                  variant={selectedGenres.includes(genre) ? 'filled' : 'outlined'}
                  onClick={() => {
                    onGenreChange(prev =>
                      prev.includes(genre)
                        ? prev.filter(g => g !== genre)
                        : [...prev, genre]
                    );
                  }}
                  className="genre-chip"
                >
                  {genre}
                </MD3Chip>
              ))}
            </MD3ChipGroup>
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="advanced-filters">
          <div className="advanced-row">
            <MD3Button
              variant="outlined"
              onClick={onToggleAdvanced}
              size="small"
            >
              Hide Advanced Filters
            </MD3Button>
          </div>
        </div>
      )}

      {/* Batch Operations */}
      {batchMode && (
        <div className="batch-operations">
          <div className="batch-controls">
            <span>{selectedBooks.length} books selected</span>
            <MD3Button
              variant="text"
              onClick={onClearSelection}
              size="small"
            >
              Clear Selection
            </MD3Button>
          </div>
          
          <div className="batch-actions">
            <MD3Button
              variant="filled"
              onClick={() => onBatchAction('mark-reading')}
              size="small"
              disabled={selectedBooks.length === 0}
            >
              Mark as Reading
            </MD3Button>
            <MD3Button
              variant="filled"
              onClick={() => onBatchAction('mark-completed')}
              size="small"
              disabled={selectedBooks.length === 0}
            >
              Mark as Completed
            </MD3Button>
            <MD3Button
              variant="outlined"
              onClick={() => onBatchAction('delete')}
              size="small"
              disabled={selectedBooks.length === 0}
            >
              Delete Selected
            </MD3Button>
          </div>
        </div>
      )}

      {/* Toggle Buttons */}
      <div style={{ 
        marginTop: '16px', 
        display: 'flex', 
        gap: '12px', 
        justifyContent: 'flex-end' 
      }}>
        {!showAdvanced && (
          <MD3Button
            variant="text"
            onClick={onToggleAdvanced}
            size="small"
          >
            Show Advanced Filters
          </MD3Button>
        )}
        
        <MD3Button
          variant={batchMode ? 'filled' : 'outlined'}
          onClick={onToggleBatchMode}
          size="small"
        >
          {batchMode ? 'Exit Batch Mode' : 'Batch Mode'}
        </MD3Button>
      </div>
    </div>
  );
};

// ===============================================
// LIBRARY VIEW COMPONENT
// ===============================================
const LibraryView = ({
  filteredBooks,
  viewMode,
  onBookUpdate,
  onRead,
  onEdit,
  onDelete,
  loading,
  batchMode,
  selectedBooks,
  onSelectBook
}) => {
  const { showSnackbar } = useSafeSnackbar();
  
  // Get reading session context using the hook
  let readingSessionContext;
  try {
    readingSessionContext = useReadingSession();
  } catch (error) {
    console.warn('Reading session context not available:', error.message);
    readingSessionContext = null;
  }

  // Handle status changes from the BookStatusDropdown
  const handleStatusChange = useCallback((updatedBook) => {
    console.log('📊 Status updated for book:', updatedBook.title);
    
    // Update the book in the parent component
    onBookUpdate?.(updatedBook);
    
    // Show success notification
    const status = getBookStatus(updatedBook);
    showSnackbar({
      message: `"${updatedBook.title}" marked as ${status}`,
      variant: 'success',
      duration: 3000
    });
  }, [onBookUpdate, showSnackbar]);

  const handleStartReading = useCallback(async (book) => {
    // Start the actual reading session
    if (readingSessionContext?.startReadingSession) {
      try {
        const result = await readingSessionContext.startReadingSession(book);
        if (result.success) {
          console.log('📖 Reading session started for:', book.title);
          
          // Also update the book status
          const updatedBook = {
            ...book,
            is_reading: true,
            completed: false
          };
          handleStatusChange(updatedBook);
          
          // Show success message
          showSnackbar({
            message: `Started reading "${book.title}"`,
            variant: 'success'
          });
        }
      } catch (error) {
        console.error('Failed to start reading session:', error);
        showSnackbar({
          message: 'Failed to start reading session',
          variant: 'error'
        });
      }
    } else {
      // Fallback to just updating status if context isn't available
      const updatedBook = {
        ...book,
        is_reading: true,
        completed: false
      };
      handleStatusChange(updatedBook);
    }
  }, [handleStatusChange, readingSessionContext, showSnackbar]);

  const handleStopReading = useCallback(async (book) => {
    console.log('🟢 handleStopReading called for book:', book.title);
    
    // Always update the book status first
    const updatedBook = {
      ...book,
      is_reading: false,
      completed: false
    };
    console.log('🟢 Setting book is_reading to false:', updatedBook);
    handleStatusChange(updatedBook);
    
    // Stop the actual reading session if one exists
    if (readingSessionContext?.stopReadingSession && readingSessionContext.activeSession) {
      try {
        const result = await readingSessionContext.stopReadingSession();
        if (result.success) {
          console.log('📖 Reading session stopped');
          
          // Show success message with duration
          showSnackbar({
            message: `Stopped reading "${book.title}" (${result.duration || 0} minutes)`,
            variant: 'info'
          });
        }
      } catch (error) {
        console.error('Failed to stop reading session:', error);
        showSnackbar({
          message: 'Failed to stop reading session',
          variant: 'error'
        });
      }
    } else {
      // Fallback to just updating status if context isn't available
      const updatedBook = {
        ...book,
        is_reading: false,
        completed: false
      };
      handleStatusChange(updatedBook);
    }
  }, [handleStatusChange, readingSessionContext, showSnackbar]);

  if (loading) {
    return (
      <div className="library-loading" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        minHeight: '400px'
      }}>
        <CircularProgress size="large" />
        <p style={{ marginTop: '20px', fontSize: '16px', fontWeight: 500 }}>
          Loading your library...
        </p>
      </div>
    );
  }

  if (filteredBooks.length === 0) {
    return (
      <div className="library-empty" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        minHeight: '400px',
        textAlign: 'center'
      }}>
        <div className="empty-state">
          <span style={{ fontSize: '64px', marginBottom: '20px', display: 'block' }}>📚</span>
          <h3 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '12px' }}>
            No books found
          </h3>
          <p style={{ fontSize: '16px', color: 'rgb(var(--md-sys-color-on-surface-variant))' }}>
            Try adjusting your filters or add some books to get started!
          </p>
        </div>
      </div>
    );
  }

  return (
    <VirtualizedBookGrid
      books={filteredBooks}
      viewMode={viewMode}
      onRead={onRead}
      onStartReading={handleStartReading}
      onStopReading={handleStopReading}
      onEdit={onEdit}
      onDelete={onDelete}
      onStatusChange={handleStatusChange}
      batchMode={batchMode}
      selectedBooks={selectedBooks}
      onSelectBook={onSelectBook}
      className={`library-virtualized-grid ${viewMode}`}
    />
  );
};

// ===============================================
// READING STATISTICS COMPONENTS
// ===============================================
const ReadingStatsCard = ({ books = [], analytics = {} }) => {
  const totalBooks = books.length;
  const readingBooks = books.filter(book => book.isReading).length;
  const completedBooks = books.filter(book => book.status === 'completed').length;
  
  const readingStreak = analytics.currentStreak || 0;
  const avgReadingTime = analytics.averageSessionDuration || '0 min';
  const totalReadingTime = analytics.totalReadingTime || '0 hours';
  const favoriteGenre = analytics.favoriteGenre || 'None';

  return (
    <div className="stats-grid">
      <div className="stats-card">
        <h3>Library Size</h3>
        <p className="primary">{totalBooks}</p>
      </div>
      
      <div className="stats-card">
        <h3>Currently Reading</h3>
        <p className="success">{readingBooks}</p>
      </div>
      
      <div className="stats-card">
        <h3>Completed</h3>
        <p className="success">{completedBooks}</p>
      </div>
      
      <div className="stats-card">
        <h3>Reading Streak</h3>
        <p className="warning">{readingStreak} days</p>
      </div>
      
      <div className="stats-card">
        <h3>Avg. Session</h3>
        <p>{avgReadingTime}</p>
      </div>
      
      <div className="stats-card">
        <h3>Total Time</h3>
        <p>{totalReadingTime}</p>
      </div>
      
      <div className="stats-card">
        <h3>Favorite Genre</h3>
        <p>{favoriteGenre}</p>
      </div>
      
      <div className="stats-card">
        <h3>Completion Rate</h3>
        <p className="primary">{totalBooks > 0 ? Math.round((completedBooks / totalBooks) * 100) : 0}%</p>
      </div>
    </div>
  );
};

// Enhanced Reading Statistics Card with Gamification Integration
const EnhancedReadingStatsCard = ({ books = [], analytics = {} }) => {
  // Now `books` and `analytics` are accessible here via parameters
  const totalBooks = books.length;
  const readingBooks = books.filter(book => book.isReading).length;
  const completedBooks = books.filter(book => book.status === 'completed').length;
  
  const readingStreak = analytics.currentStreak || 0;
  const avgReadingTime = analytics.averageSessionDuration || '0 min';
  const totalReadingMinutes = analytics.totalReadingTime || 0;
  const totalReadingHours = Math.floor(totalReadingMinutes / 60);
  const remainingMinutes = totalReadingMinutes % 60;
  const favoriteGenre = analytics.favoriteGenre || 'None';

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Basic Reading Stats */}
        <div style={{
          padding: '1.5rem',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', opacity: 0.9 }}>Library Size</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>{totalBooks}</p>
        </div>
        
        <div style={{
          padding: '1.5rem',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', opacity: 0.9 }}>Currently Reading</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>{readingBooks}</p>
        </div>
        
        <div style={{
          padding: '1.5rem',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          color: 'white',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', opacity: 0.9 }}>Completed</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>{completedBooks}</p>
        </div>
        
        <div style={{
          padding: '1.5rem',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
          color: 'white',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', opacity: 0.9 }}>Reading Streak</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>{readingStreak} days</p>
        </div>
        
        <div style={{
          padding: '1.5rem',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
          color: 'white',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', opacity: 0.9 }}>Avg. Session</h3>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{avgReadingTime}</p>
        </div>
        
        <div style={{
          padding: '1.5rem',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
          color: '#333',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', opacity: 0.8 }}>Total Time</h3>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
            {totalReadingHours > 0 ? `${totalReadingHours}h ${remainingMinutes}m` : '0 hours'}
          </p>
        </div>
        
        <div style={{
          padding: '1.5rem',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
          color: '#333',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', opacity: 0.8 }}>Favorite Genre</h3>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{favoriteGenre}</p>
        </div>
        
        <div style={{
          padding: '1.5rem',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
          color: 'white',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', opacity: 0.9 }}>Completion Rate</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
            {totalBooks > 0 ? Math.round((completedBooks / totalBooks) * 100) : 0}%
          </p>
        </div>
      </div>
    </div>
  );
};

// Enhanced Stats Page
const EnhancedStatsPage = ({ books = [], analytics = {} }) => {
  const [gamificationAvailable, setGamificationAvailable] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check gamification availability using dynamic import
    const checkGamification = async () => {
      try {
        const module = await import('../contexts/GamificationContext');
        // Just check if the context exists
        setGamificationAvailable(!!module.GamificationContext);
      } catch (error) {
        console.warn('Gamification not available for stats page');
        setGamificationAvailable(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkGamification();
  }, []);

  if (loading) {
    return (
      <div className="stats-loading">
        <CircularProgress />
        <p>Loading statistics...</p>
      </div>
    );
  }

  return (
    <div className="stats-page">
      <div className="page-header">
        <h1>📊 Reading Statistics</h1>
        <p>Track your progress, monitor reading time, and unlock achievements</p>
      </div>
      
      <EnhancedReadingStatsCard books={books} analytics={analytics} />
      
      {gamificationAvailable ? (
        <GamificationDashboard user={analytics.user} />
      ) : (
        <ReadingStatsCard books={books} analytics={analytics} />
      )}
    </div>
  );
};

// ===============================================
// NOTES PAGE COMPONENT
// ===============================================
const NotesPage = ({ books = [] }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const mockNotes = [
          {
            id: 1,
            bookId: books[0]?.id,
            bookTitle: books[0]?.title,
            content: 'This is a fascinating insight about character development...',
            page: 45,
            created: new Date().toISOString()
          },
          {
            id: 2,
            bookId: books[1]?.id,
            bookTitle: books[1]?.title,
            content: 'The author\'s writing style reminds me of...',
            page: 123,
            created: new Date().toISOString()
          }
        ];
        setNotes(mockNotes);
      } catch (error) {
        console.error('Failed to load notes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, [books]);

  const filteredNotes = notes.filter(note => {
    if (filter === 'recent') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return new Date(note.created) > oneWeekAgo;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="notes-loading">
        <CircularProgress />
        <p>Loading notes...</p>
      </div>
    );
  }

  return (
    <div className="notes-page">
      <div className="page-header">
        <h1>📝 Notes</h1>
        <p>Your reading notes and highlights</p>
      </div>

      <div className="notes-filter">
        <MD3ChipGroup>
          <MD3Chip 
            variant={filter === 'all' ? 'filled' : 'outlined'}
            onClick={() => setFilter('all')}
          >
            All Notes
          </MD3Chip>
          <MD3Chip 
            variant={filter === 'recent' ? 'filled' : 'outlined'}
            onClick={() => setFilter('recent')}
          >
            Recent
          </MD3Chip>
        </MD3ChipGroup>
      </div>

      <div className="notes-list">
        {filteredNotes.map(note => (
          <MD3Card key={note.id} className="note-card">
            <div className="note-header">
              <h4>{note.bookTitle}</h4>
              <span className="note-page">Page {note.page}</span>
            </div>
            <p className="note-content">{note.content}</p>
            <div className="note-footer">
              <span className="note-date">
                {new Date(note.created).toLocaleDateString()}
              </span>
            </div>
          </MD3Card>
        ))}
      </div>
    </div>
  );
};

// ===============================================
// READING GOALS WIDGET
// ===============================================
const ReadingGoalsWidget = ({ user, onGoalUpdate }) => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGoals = async () => {
      try {
        const mockGoals = [
          {
            id: 1,
            title: 'Read 50 books this year',
            target: 50,
            current: 23,
            deadline: '2024-12-31',
            type: 'yearly'
          },
          {
            id: 2,
            title: 'Read 30 minutes daily',
            target: 30,
            current: 25,
            deadline: new Date().toISOString(),
            type: 'daily'
          }
        ];
        setGoals(mockGoals);
      } catch (error) {
        console.error('Failed to load goals:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGoals();
  }, []);

  if (loading) {
    return <div className="goals-loading">Loading goals...</div>;
  }

  return (
    <div className="reading-goals-widget">
      <h3>📚 Reading Goals</h3>
      <div className="goals-list">
        {goals.map(goal => (
          <div key={goal.id} className="goal-item">
            <div className="goal-info">
              <h4>{goal.title}</h4>
              <div className="goal-progress">
                <MD3Progress 
                  value={(goal.current / goal.target) * 100}
                  variant="linear"
                />
                <span>{goal.current} / {goal.target}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ===============================================
// SETTINGS DIALOG (Your exact existing implementation)
// ===============================================
const SettingsDialog = ({ open, onClose }) => {
  const [settings, setSettings] = useState({
    theme: 'auto',
    notifications: true,
    autoBackup: true,
    publicProfile: false
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    console.log('💾 Saving settings:', settings);
    onClose();
  };

  const handleReset = () => {
    setSettings({
      theme: 'auto',
      notifications: true,
      autoBackup: true,
      publicProfile: false
    });
  };

  return (
    <MD3Dialog open={open} onClose={onClose} title="Settings">
      <div className="settings-content">
        <div className="settings-section">
          <h3>Appearance</h3>
          <div className="setting-item">
            <label>Theme</label>
            <select
              value={settings.theme}
              onChange={(e) => handleSettingChange('theme', e.target.value)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h3>Notifications</h3>
          <div className="setting-item">
            <MD3Switch
              checked={settings.notifications}
              onChange={(e) => handleSettingChange('notifications', e.target.checked)}
            />
            <label>Enable notifications</label>
          </div>
        </div>

        <div className="settings-section">
          <h3>Data & Privacy</h3>
          <div className="setting-item">
            <MD3Switch
              checked={settings.autoBackup}
              onChange={(e) => handleSettingChange('autoBackup', e.target.checked)}
            />
            <label>Auto backup</label>
          </div>
          <div className="setting-item">
            <MD3Switch
              checked={settings.publicProfile}
              onChange={(e) => handleSettingChange('publicProfile', e.target.checked)}
            />
            <label>Public profile</label>
          </div>
        </div>
      </div>
      
      <MD3DialogActions>
        <MD3Button variant="text" onClick={handleReset}>
          Reset to Defaults
        </MD3Button>
        <MD3Button variant="text" onClick={onClose}>
          Cancel
        </MD3Button>
        <MD3Button variant="filled" onClick={handleSave}>
          Save Settings
        </MD3Button>
      </MD3DialogActions>
    </MD3Dialog>
  );
};

// ===============================================
// MAIN ENHANCED BOOK LIBRARY APP COMPONENT
// ===============================================
const EnhancedBookLibraryApp = ({ 
  books = [],
  onBookUpdate,
  user,
  analytics = {},
  className = ''
}) => {
  // FIXED: Add the snackbar hook
  const { showSnackbar } = useSafeSnackbar();
  const navigate = useNavigate();
  
  // Get reading session context
  const readingSessionContext = useReadingSession();

  // Core State
  const [currentPage, setCurrentPage] = useState('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all'); // NEW: Status filter
  const [sortBy, setSortBy] = useState('title');
  const [viewMode, setViewMode] = useState('grid');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [gamificationAvailable, setGamificationAvailable] = useState(false);

  const [collections, setCollections] = useState([]);
  
  useEffect(() => {
    // Try to load from storage first
    const savedCollections = loadCollectionsFromStorage();
    
    if (savedCollections) {
      setCollections(savedCollections);
    } else {
      // Create default collections based on current books
      const defaultCollections = createDefaultCollections(books);
      setCollections(defaultCollections);
    }
  }, [books]);

  const [droppedFiles, setDroppedFiles] = useState([]);

  // Advanced Filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Batch Operations State
  const [batchMode, setBatchMode] = useState(false);
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [batchUpdating, setBatchUpdating] = useState(false);

  // Loading and Error State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Book Management
  const [localBooks, setLocalBooks] = useState(Array.isArray(books) ? books : []);

  const handleCreateCollection = (newCollection) => {
    const validation = validateCollection(newCollection, collections);
    
    if (!validation.isValid) {
      showSnackbar({
        message: validation.error,
        variant: 'error'
      });
      return;
    }
    
    // Proceed with creation
    setCollections(prev => [...prev, newCollection]);
  };

  const handleAddBookToCollection = (collectionId, bookId) => {
    setCollections(prev => addBookToCollection(prev, collectionId, bookId));
  };

  const handleRemoveBookFromCollection = (collectionId, bookId) => {
    setCollections(prev => removeBookFromCollection(prev, collectionId, bookId));
  };

  // Gamification integration with fallback
  let trackAction;
  try {
    const gamificationHook = useGamification();
    trackAction = gamificationHook?.trackAction;
  } catch (error) {
    console.warn('Gamification not available');
    trackAction = null;
  }

  // Update local books when prop changes
  useEffect(() => {
    setLocalBooks(Array.isArray(books) ? books : []);
  }, [books]);

  // Enhanced logging to monitor book changes
  useEffect(() => {
    console.log('📊 Books prop changed:', Array.isArray(books) ? books.length : 'Not an array', 'books');
    console.log('📊 Local books changed:', Array.isArray(localBooks) ? localBooks.length : 'Not an array', 'books');
  }, [books, localBooks]);

  // Books that need covers (missing cover_url)
  const booksNeedingCovers = useMemo(() => {
    if (!Array.isArray(localBooks)) return [];
    return localBooks.filter(book => 
      !book.cover_url || 
      book.cover_url === '' || 
      book.cover_url.includes('placeholder') ||
      book.cover_url.includes('default')
    );
  }, [localBooks]);

  // Available genres for filtering
  const availableGenres = useMemo(() => {
    if (!Array.isArray(localBooks)) return [];
    const genres = new Set();
    localBooks.forEach(book => {
      if (book.genre) {
        genres.add(book.genre);
      }
    });
    return Array.from(genres).sort();
  }, [localBooks]);

  // Filter and sort books with NEW status filtering
  const filteredBooks = useMemo(() => {
    if (!Array.isArray(localBooks)) return [];
    let filtered = localBooks;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(book =>
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.genre?.toLowerCase().includes(query)
      );
    }

    // Genre filter
    if (selectedGenres.length > 0) {
      filtered = filtered.filter(book =>
        selectedGenres.includes(book.genre)
      );
    }

    // NEW: Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(book => {
        const status = getBookStatus(book);
        return status === selectedStatus;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'author':
          return a.author.localeCompare(b.author);
        case 'dateAdded':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        case 'progress':
          return (b.progress || 0) - (a.progress || 0);
        case 'status':
          const statusA = getBookStatus(a);
          const statusB = getBookStatus(b);
          return statusA.localeCompare(statusB);
        case 'genre':
          return (a.genre || '').localeCompare(b.genre || '');
        default:
          return 0;
      }
    });

    // Enhance each book with reading session state
    return filtered.map(book => {
      // Check if this book is in the active reading session and if it's paused
      const isInActiveSession = readingSessionContext.activeSession?.book?.id === book.id;
      const isPaused = isInActiveSession && readingSessionContext.isPaused;
      
      return {
        ...book,
        isPaused: isPaused
      };
    });
  }, [localBooks, searchQuery, selectedGenres, selectedStatus, sortBy, readingSessionContext.activeSession, readingSessionContext.isPaused]);

  // Calculate quick stats with NEW status information
  const quickStats = useMemo(() => {
    const stats = {
      totalBooks: localBooks.length,
      currentlyReading: localBooks.filter(book => getBookStatus(book) === 'reading').length,
      completed: localBooks.filter(book => getBookStatus(book) === 'completed').length,
      unread: localBooks.filter(book => getBookStatus(book) === 'unread').length,
      paused: localBooks.filter(book => getBookStatus(book) === 'paused').length,
      collections: 0, // You can implement collections logic
      notes: 0, // You can implement notes logic
      level: user?.level || 1,
      totalPoints: user?.points || 0
    };
    return stats;
  }, [localBooks, user]);

  // FIXED: Batch cover update handler with proper showSnackbar
// FIXED: handleBatchUpdateCovers function that actually updates the UI
// Replace your existing handleBatchUpdateCovers function with this:

// FIXED: handleBatchUpdateCovers function that actually updates the UI
// Replace your existing handleBatchUpdateCovers function with this:

const handleBatchUpdateCovers = async () => {
  if (batchUpdating || booksNeedingCovers.length === 0) return;
  
  setBatchUpdating(true);
  
  try {
    showSnackbar({
      message: `Finding covers for ${booksNeedingCovers.length} books...`,
      variant: 'info'
    });

    let successCount = 0;
    const booksToUpdate = booksNeedingCovers.slice(0, 5);
    
    // Create a copy of current books to update
    let updatedBooksArray = [...localBooks];
    
    for (const book of booksToUpdate) {
      try {
        console.log(`🔍 Processing: "${book.title}" by ${book.author}`);
        
        // Use the fixed cover service
        const coverResult = await ensureCoverForBook(book);

        if (coverResult?.cover_url && coverResult.cover_url !== null) {
          console.log(`✅ Found cover for "${book.title}":`, coverResult.cover_url);
          
          // Find the book in our array and update it directly
          const bookIndex = updatedBooksArray.findIndex(b => b.id === book.id);
          if (bookIndex !== -1) {
            updatedBooksArray[bookIndex] = {
              ...updatedBooksArray[bookIndex],
              cover_url: coverResult.cover_url,
              cover_base: coverResult.cover_base
            };
            
            console.log(`📚 Updated book "${book.title}" with cover:`, updatedBooksArray[bookIndex]);
            successCount++;
          }
          
          showSnackbar({
            message: `✅ Found cover for "${book.title}"`,
            variant: 'success'
          });
        } else {
          console.log(`❌ No valid cover found for "${book.title}"`);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ Failed to find cover for "${book.title}":`, error);
      }
    }
    
    // Update the local state with all changes at once
    console.log(`📊 Updating local state with ${successCount} updated books`);
    setLocalBooks(updatedBooksArray);
    
    // Force a recalculation of booksNeedingCovers by updating the books state reference
    // This ensures the banner disappears after covers are found
    if (successCount > 0) {
      // Trigger a re-render by updating the state reference
      setLocalBooks(prev => [...updatedBooksArray]);
    }
    
    showSnackbar({
      message: `Batch update complete! Updated ${successCount}/${booksToUpdate.length} book covers.`,
      variant: successCount > 0 ? 'success' : 'info'
    });
    
    console.log(`✅ Final result: ${successCount} covers updated successfully`);
    
  } catch (error) {
    console.error('❌ Batch update error:', error);
    showSnackbar({
      message: `Batch update failed: ${error.message}`,
      variant: 'error'
    });
  } finally {
    setBatchUpdating(false);
  }
};
  // Event Handlers
  // ✅ NEW: Enhanced upload handlers
  const handleUploadAction = useCallback((action) => {
    console.log(`🎬 Upload action triggered: ${action}`);
    
    switch (action) {
      case 'upload':
      case 'add':
      case 'import':
        // Trigger the parent's upload handler
        onBookUpdate?.(action);
        break;
      case 'scan':
        console.log('📱 Scan action - implement barcode scanning');
        onBookUpdate?.(action);
        break;
      default:
        console.log('Unknown upload action:', action);
    }
  }, [onBookUpdate]);

  // ✅ NEW: Drag and drop handler
  const handleDragDrop = useCallback((event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    
    // Filter for supported book files
    const bookFiles = files.filter(file => {
      const ext = file.name.split('.').pop().toLowerCase();
      return ['pdf', 'epub', 'mobi', 'txt', 'doc', 'docx'].includes(ext);
    });

    if (bookFiles.length > 0) {
      console.log(`📁 Dropped ${bookFiles.length} book files`);
      setDroppedFiles(bookFiles);
    } else {
      console.warn('⚠️ No supported book files found in drop');
    }
  }, [setDroppedFiles]);

  useEffect(() => {
    if (droppedFiles.length > 0) {
      droppedFiles.forEach((file, index) => {
        setTimeout(() => {
          onBookUpdate?.('uploadFile', { file });
        }, index * 100);
      });
      setDroppedFiles([]);
    }
  }, [droppedFiles, onBookUpdate]);

  // ✅ NEW: Drag over handler
  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  // DIAGNOSTIC: Test function for debugging book updates
  const diagnosticBookUpdate = async () => {
    console.log('🔍 DIAGNOSTIC: Starting book update test...');
    
    // Get a test book that needs a cover
    const testBook = booksNeedingCovers[0];
    if (!testBook) {
      console.log('❌ No books need covers for testing');
      return;
    }
    
    console.log('📋 Test book:', testBook);
    console.log('📋 Original books state:', books);
    console.log('📋 Local books state:', localBooks);
    console.log('📋 onBookUpdate function:', onBookUpdate);
    
    try {
      // Test the cover service
      const coverResult = await ensureCoverForBook(testBook);
      console.log('📋 Cover service result:', coverResult);
      
      if (coverResult?.cover_url) {
        const updatedBook = { 
          ...testBook, 
          cover_url: coverResult.cover_url,
          cover_base: coverResult.cover_base
        };
        console.log('📋 Updated book object:', updatedBook);
        
        // Test local state update
        console.log('🧪 Testing local state update...');
        setLocalBooks(prev => {
          const newBooks = prev.map(b => b.id === testBook.id ? updatedBook : b);
          console.log('📋 New local books after update:', newBooks);
          return newBooks;
        });
        
        // Test parent callback
        console.log('🧪 Testing parent callback...');
        if (onBookUpdate) {
          console.log('📋 Calling onBookUpdate with:', updatedBook);
          onBookUpdate(updatedBook);
        } else {
          console.log('❌ onBookUpdate is not available');
        }
        
        console.log('✅ Diagnostic test completed');
      } else {
        console.log('❌ No cover data returned');
      }
    } catch (error) {
      console.error('❌ Diagnostic test failed:', error);
    }
  };

  // ✅ ENHANCED: Book action handlers with proper state updates
  const handleBookAction = useCallback(async (action, book) => {
    console.log(`🎯 Book action: ${action} for "${book?.title}"`);
    
    try {
      switch (action) {
        case 'delete':
          // Optimistically update local state
          setLocalBooks(prev => prev.filter(b => b.id !== book.id));
          // Then call parent handler
          await onBookUpdate?.(action, book);
          break;
          
        case 'edit':
        case 'read':
        case 'startReading':
        case 'stopReading':
        case 'updateCover':
          // Call parent handler without local state change
          // (parent will update via props)
          await onBookUpdate?.(action, book);
          break;
          
        default:
          await onBookUpdate?.(action, book);
      }
    } catch (error) {
      console.error(`❌ Action ${action} failed:`, error);
      // Revert optimistic update if needed
      if (action === 'delete') {
        setLocalBooks(books); // Revert to original state
      }
    }
  }, [onBookUpdate, books]);

  const handleBookUpdate = useCallback((updatedBook) => {
    console.log('📚 Updating book in library:', updatedBook.title);
    
    setLocalBooks(prev => 
      prev.map(book => 
        book.id === updatedBook.id ? updatedBook : book
      )
    );
    
    // Track gamification action
    if (trackAction) {
      const status = getBookStatus(updatedBook);
      trackAction('status_change', { 
        bookId: updatedBook.id, 
        newStatus: status,
        bookTitle: updatedBook.title 
      });
    }
    
    // Notify parent component
    onBookUpdate?.(updatedBook);
  }, [onBookUpdate, trackAction]);

  const handleRead = useCallback((book) => {
    console.log('📖 Opening book in app reader:', book.title);
    
    if (book.id) {
      // Navigate to the in-app reader
      navigate(`/read/${book.id}`);
      
      if (trackAction) {
        trackAction('book_opened', { bookId: book.id, bookTitle: book.title });
      }
    } else {
      console.error('No book ID available:', book.title);
      showSnackbar({
        message: 'Unable to open book reader',
        variant: 'error'
      });
    }
  }, [navigate, trackAction, showSnackbar]);

  const handleReadBook = useCallback((book) => {
    console.log('📖 Opening book in app reader:', book.title);
    // Add your specific book reading logic here
    handleRead(book); // For now, use the existing handleRead function
  }, [handleRead]);

  const handleEdit = useCallback((book) => {
    console.log('✏️ Editing book:', book.title);
    // Implement edit logic
  }, []);

  const handleDelete = useCallback((book) => {
    console.log('🗑️ Deleting book:', book.title);
    // Implement delete logic
  }, []);

  // Batch Operations
  const handleSelectBook = useCallback((book, selected) => {
    setSelectedBooks(prev => {
      if (selected) {
        return [...prev, book.id];
      } else {
        return prev.filter(id => id !== book.id);
      }
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedBooks([]);
  }, []);

  const handleBatchAction = useCallback(async (action) => {
    setBatchUpdating(true);

    try {
      const booksToUpdate = localBooks.filter(book => selectedBooks.includes(book.id));
      
      for (const book of booksToUpdate) {
        let updatedBook = { ...book };
        
        switch (action) {
          case 'mark-reading':
            updatedBook.is_reading = true;
            updatedBook.completed = false;
            break;
          case 'mark-completed':
            updatedBook.is_reading = false;
            updatedBook.completed = true;
            updatedBook.progress = 100;
            break;
          case 'delete':
            // Implement batch delete
            break;
        }
        
        handleBookUpdate(updatedBook);
      }
      
      setSelectedBooks([]);
    } catch (error) {
      console.error('Batch operation failed:', error);
    } finally {
      setBatchUpdating(false);
    }
  }, [selectedBooks, localBooks, handleBookUpdate]);

  // Page Content Renderer with all your exact components
  const renderPageContent = () => {
    switch (currentPage) {
      case 'library':
        return (
          <div className="library-page">
            {/* SearchAndFilterBar is now moved to left navigation sidebar */}
            
            <LibraryView
              filteredBooks={filteredBooks}
              viewMode={viewMode}
              onBookUpdate={handleBookUpdate}
              onRead={handleRead}
              onEdit={handleEdit}
              onDelete={handleDelete}
              loading={loading}
              batchMode={batchMode}
              selectedBooks={selectedBooks}
              onSelectBook={handleSelectBook}
            />
          </div>
        );

      case 'reading':
        return (
          <ReadingPage 
            books={localBooks} 
            onBookAction={onBookAction}
            readingSessions={[]} // TODO: Add reading sessions data
          />
        );

       case 'stats':
         return (
           <React.Suspense fallback={
             <div style={{ 
               display: 'flex', 
               alignItems: 'center', 
               justifyContent: 'center', 
               height: '400px',
               fontSize: '18px',
               color: '#666'
             }}>
               📊 Loading Statistics...
             </div>
           }>
             <StatisticsPage 
               books={localBooks} 
               readingSessions={[]} // TODO: Add reading sessions data
               user={user} 
             />
           </React.Suspense>
         );
         
       case 'collections':
         return (
           <React.Suspense fallback={
             <div style={{ 
               display: 'flex', 
               alignItems: 'center', 
               justifyContent: 'center', 
               height: '400px',
               fontSize: '18px',
               color: '#666'
             }}>
               📁 Loading Collections...
             </div>
           }>
             <EnhancedCollectionsPage books={localBooks} />
           </React.Suspense>
         );

      case 'notes':
        return (
          <NotesSubpage 
            books={localBooks} 
            onNoteAction={(action, noteData) => {
              console.log('Note action:', action, noteData);
              // TODO: Implement note actions if needed
            }}
          />
        );

      default:
        return (
          <div className="welcome-page">
            <WelcomeWidget 
              user={user}
              books={localBooks}
              currentPage={currentPage}
              onNavigate={setCurrentPage}
              analytics={analytics}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
            <ReadingGoalsWidget user={user} onGoalUpdate={handleBookUpdate} />
          </div>
        );
    }
  };

  return (
    <div 
      className={`enhanced-book-library-app ${className}`}
      onDrop={handleDragDrop}
      onDragOver={handleDragOver}
    >
      {/* Main Content */}
      <main className="main-content">
        {/* Enhanced Welcome Dashboard - Only show on library page */}
        {currentPage === 'library' && (
          <WelcomeWidget
            user={user}
            books={books} 
            currentPage={currentPage}
            onNavigate={setCurrentPage}
            analytics={analytics}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        )}

        {/* Recently Added Layer - WelcomeWidget Style - Only show on library page */}
        {currentPage === 'library' && (() => {
          // Get recently added books for display
          const recentBooks = filteredBooks
            .filter(book => book.created_at || book.dateAdded)
            .sort((a, b) => {
              const dateA = new Date(a.created_at || a.dateAdded || 0);
              const dateB = new Date(b.created_at || b.dateAdded || 0);
              return dateB - dateA;
            })
            .slice(0, 6); // Show 6 recent books for better layout
          
          if (recentBooks.length === 0) return null;
          
          return (
            <div style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              borderRadius: '12px',
              padding: '16px 20px',
              color: 'white',
              marginTop: '16px',
              marginBottom: '20px',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.12)',
              position: 'relative',
              maxHeight: '180px'
            }}>
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'white',
                  margin: '0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  ✨ Recently Added
                </h3>
                <span style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontWeight: '400'
                }}>
                  {recentBooks.length} books
                </span>
              </div>
              
              {/* Horizontal Scrollable Books Strip */}
              <div style={{
                display: 'flex',
                gap: '12px',
                overflowX: 'auto',
                overflowY: 'hidden',
                scrollBehavior: 'smooth',
                paddingBottom: '8px',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.3) transparent',
                maxHeight: '140px'
              }}>
                {recentBooks.map((book) => (
                  <div key={book.id} style={{ 
                    minWidth: '110px',
                    maxWidth: '110px',
                    flexShrink: 0
                  }}>
                    <EnhancedBookCard
                      book={book}
                      view="grid"
                      onRead={handleRead}
                      onStartReading={handleStartSession}
                      onStopReading={handleEndSession}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onStatusChange={handleBookUpdate}
                      batchMode={batchMode}
                      selected={selectedBooks.includes(book.id)}
                      onSelect={handleSelectBook}
                      style={{
                        height: '120px',
                        width: '110px',
                        boxShadow: '0 3px 8px rgba(0,0,0,0.15)',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        fontSize: '11px'
                      }}
                    />
                  </div>
                ))}
              </div>
              
              {/* Custom scrollbar styles */}
              <style jsx>{`
                div::-webkit-scrollbar {
                  height: 4px;
                }
                div::-webkit-scrollbar-track {
                  background: rgba(255, 255, 255, 0.1);
                  border-radius: 2px;
                }
                div::-webkit-scrollbar-thumb {
                  background: rgba(255, 255, 255, 0.4);
                  border-radius: 2px;
                }
                div::-webkit-scrollbar-thumb:hover {
                  background: rgba(255, 255, 255, 0.6);
                }
              `}</style>
            </div>
          );
        })()}

        {/* Development Performance Testing Banner */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '12px',
            margin: '16px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>⚡</span>
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
                  Virtual Scrolling Performance Testing
                </h4>
                <p style={{ margin: 0, fontSize: '12px', opacity: 0.9 }}>
                  Test with large datasets: 100, 500, 1000+ books
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <MD3Button
                variant="outlined"
                onClick={() => {
                  const mockBooks = generateMockBooks(100);
                  setLocalBooks(mockBooks);
                  showSnackbar({ message: '✅ Loaded 100 mock books', variant: 'success' });
                }}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  fontSize: '12px',
                  padding: '6px 12px'
                }}
              >
                100 Books
              </MD3Button>
              <MD3Button
                variant="outlined"
                onClick={() => {
                  const mockBooks = generateMockBooks(500);
                  setLocalBooks(mockBooks);
                  showSnackbar({ message: '✅ Loaded 500 mock books', variant: 'success' });
                }}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  fontSize: '12px',
                  padding: '6px 12px'
                }}
              >
                500 Books
              </MD3Button>
              <MD3Button
                variant="outlined"
                onClick={() => {
                  const mockBooks = generateMockBooks(1000);
                  setLocalBooks(mockBooks);
                  showSnackbar({ message: '🚀 Loaded 1000 mock books!', variant: 'success' });
                }}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  fontSize: '12px',
                  padding: '6px 12px'
                }}
              >
                1000 Books
              </MD3Button>
              <MD3Button
                variant="outlined"
                onClick={async () => {
                  const results = await performanceTest.testVirtualScrolling([100, 500, 1000]);
                  console.table(results);
                  showSnackbar({ message: '📊 Performance test complete - check console', variant: 'info' });
                }}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.4)',
                  fontSize: '12px',
                  padding: '6px 12px'
                }}
              >
                🧪 Test
              </MD3Button>
            </div>
          </div>
        )}

        {/* Compact Cover Status - Show when books need covers */}
        {booksNeedingCovers.length > 0 && !batchUpdating && (
          <div style={{
            background: 'rgb(var(--md-sys-color-surface-container))',
            color: 'rgb(var(--md-sys-color-on-surface))',
            padding: '12px 16px',
            borderRadius: '8px',
            margin: '8px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid rgb(var(--md-sys-color-outline-variant))',
            fontSize: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px', opacity: 0.7 }}>📚</span>
              <span style={{ color: 'rgb(var(--md-sys-color-on-surface-variant))' }}>
                {booksNeedingCovers.length} books need covers
              </span>
            </div>
            <MD3Button
              variant="text"
              size="small"
              onClick={handleBatchUpdateCovers}
              style={{
                fontSize: '12px',
                padding: '4px 8px',
                minHeight: '28px'
              }}
            >
              Find Covers
            </MD3Button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading-overlay">
            <CircularProgress />
            <p>Loading...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {/* Page Content */}
        {renderPageContent()}
      </main>

      {/* FIXED: Batch Update Progress Overlay */}
      {batchUpdating && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '16px',
            textAlign: 'center',
            minWidth: '300px'
          }}>
            <div style={{ marginBottom: '16px', fontSize: '24px' }}>🔄</div>
            <h3>Finding Book Covers</h3>
            <p>Please wait while we search for covers...</p>
            <p style={{ fontSize: '14px', opacity: 0.7 }}>
              Processing {booksNeedingCovers.length} books
            </p>
          </div>
        </div>
      )}

      {/* Settings Dialog */}
      <SettingsDialog 
        open={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
      />

      {/* Navigation FAB - Only show on mobile or when Welcome Widget is not visible */}
      {(currentPage !== 'library' || window.innerWidth < 768) && (
        <NavigationFAB 
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          quickStats={{
            totalBooks: localBooks.length,
            currentlyReading: localBooks.filter(book => book.isReading || book.status === 'reading').length,
            collections: 0, // TODO: Add collections count
            notes: 0 // TODO: Add notes count
          }}
        />
      )}
    </div>
  );
}

export default EnhancedBookLibraryApp;
