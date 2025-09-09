// src/pages/LibraryPage.jsx - Enhanced Library with MD3 Integration
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import API from '../config/api';
import BookCover from '../components/BookCover';
import { useMaterial3 } from '../hooks/useMaterial3';

// ✅ Import Enhanced MD3 Components
import {
  // Core components
  MD3Button,
  MD3Card,
  MD3TextField,
  MD3Checkbox,
  MD3Chip,
  MD3ChipGroup,
  MD3Switch,
  MD3Dialog,
  MD3DialogActions,
  MD3ProgressSnackbar,
  useSnackbar,
  
  // New components
  MD3FloatingActionButton,
  MD3BookLibraryFab,
  MD3Menu,
  MD3MenuItem,
  MD3MenuDivider,
  MD3BookActionsMenu,
  MD3SortMenu,
  
  // Hooks and providers
  useMaterial3Theme,
  useThemeColors,
  MD3Surface
} from '../components/Material3';

// Enhanced Book Card with context menu
const EnhancedBookCard = ({ book, onRead, onEdit, onDelete, onShare, onAddToCollection }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const cardRef = useRef();

  const handleContextMenu = (e) => {
    e.preventDefault();
    setMenuAnchor({ x: e.clientX, y: e.clientY });
    setMenuOpen(true);
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuAnchor({ x: rect.right, y: rect.top });
    setMenuOpen(true);
  };

  return (
    <>
      <MD3Card
        ref={cardRef}
        variant="elevated"
        interactive
        className="enhanced-book-card group overflow-hidden hover:scale-105 transition-all duration-300"
        onClick={() => onRead?.(book)}
        onContextMenu={handleContextMenu}
      >
        <div className="book-cover-container relative">
          <NavLink to={`/read/${String(book.id)}`} className="block">
            <BookCover url={book.cover_url || book.cover} title={book.title} />
          </NavLink>
          
          {book.isReading && (
            <div className="absolute top-2 left-2 bg-primary text-on-primary px-2 py-1 rounded-full text-xs">
              📖 Reading
            </div>
          )}
          
          <button
            className="absolute top-2 right-2 w-8 h-8 bg-surface-container text-on-surface rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleMenuClick}
            aria-label="Book actions"
          >
            ⋮
          </button>
        </div>
        
        <div className="p-4 space-y-3">
          <div>
            <h3 className="title-medium text-on-surface line-clamp-2">
              {book.title}
            </h3>
            <p className="body-medium text-on-surface-variant">
              {book.author}
            </p>
            
            {book.progress > 0 && (
              <div className="mt-2">
                <div className="w-full bg-surface-variant rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${book.progress || 0}%` }}
                  />
                </div>
                <span className="text-xs text-on-surface-variant mt-1 block">
                  {book.progress || 0}% complete
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-2 mt-2">
              {book.genre && (
                <MD3Chip 
                  label={book.genre}
                  variant="assist"
                  size="small"
                />
              )}
              
              {book.rating > 0 && (
                <div className="text-sm text-on-surface-variant">
                  {'★'.repeat(book.rating)}{'☆'.repeat(5 - book.rating)}
                </div>
              )}
            </div>
          </div>
        </div>
      </MD3Card>

      <MD3BookActionsMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        anchorEl={menuAnchor ? { getBoundingClientRect: () => ({
          left: menuAnchor.x,
          top: menuAnchor.y,
          right: menuAnchor.x,
          bottom: menuAnchor.y,
          width: 0,
          height: 0
        })} : null}
        book={book}
        onRead={onRead}
        onEdit={onEdit}
        onDelete={onDelete}
        onShare={onShare}
        onAddToCollection={onAddToCollection}
      />
    </>
  );
};

// Enhanced Search and Filter Bar
const SearchAndFilterBar = ({ 
  searchQuery, 
  onSearchChange, 
  selectedGenres, 
  onGenreChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  availableGenres
}) => {
  return (
    <MD3Surface level="surface-container" className="p-6 rounded-3xl">
      <div className="space-y-4">
        {/* Search Section */}
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <MD3TextField
              label="Search books..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              leadingIcon="🔍"
              trailingIcon={searchQuery && (
                <button onClick={() => onSearchChange('')} className="text-on-surface-variant hover:text-on-surface">
                  ✕
                </button>
              )}
              variant="outlined"
            />
          </div>
          
          <MD3SortMenu
            value={sortBy}
            onChange={onSortChange}
          />
        </div>
        
        {/* Genre Filter */}
        <div className="space-y-2">
          <label className="body-small text-on-surface-variant">Filter by Genre</label>
          <MD3ChipGroup
            chips={[
              { value: 'all', label: 'All', icon: '📚' },
              ...availableGenres.map(genre => ({ 
                value: genre, 
                label: genre.charAt(0).toUpperCase() + genre.slice(1),
                icon: '📖' 
              }))
            ]}
            value={selectedGenres.length === 0 ? ['all'] : selectedGenres}
            onChange={(values) => {
              if (values.includes('all') || values.length === 0) {
                onGenreChange([]);
              } else {
                onGenreChange(values);
              }
            }}
            variant="filter"
            multiSelect={true}
          />
        </div>
        
        {/* View Mode */}
        <div className="space-y-2">
          <label className="body-small text-on-surface-variant">View Mode</label>
          <MD3ChipGroup
            chips={[
              { value: 'grid', label: 'Grid View', icon: '⊞' },
              { value: 'list', label: 'List View', icon: '☰' }
            ]}
            value={[viewMode]}
            onChange={(values) => onViewModeChange(values[0] || 'grid')}
            variant="filter"
            multiSelect={false}
          />
        </div>
      </div>
    </MD3Surface>
  );
};

// Quick Actions Dialog
const QuickActionsDialog = ({ open, onClose, onAction }) => {
  const actions = [
    { key: 'upload', label: 'Upload Books', icon: '📤', description: 'Add books from your device' },
    { key: 'scan', label: 'Scan Barcode', icon: '📷', description: 'Find books by scanning' },
    { key: 'wishlist', label: 'Add to Wishlist', icon: '⭐', description: 'Save books for later' },
    { key: 'import', label: 'Import Library', icon: '📥', description: 'Import from other apps' }
  ];

  return (
    <MD3Dialog
      open={open}
      onClose={onClose}
      title="Quick Actions"
      maxWidth="sm"
    >
      <div className="grid grid-cols-2 gap-4 p-4">
        {actions.map(action => (
          <MD3Card
            key={action.key}
            variant="outlined"
            interactive
            className="p-4 text-center hover:bg-surface-container-high transition-colors"
            onClick={() => {
              onAction(action.key);
              onClose();
            }}
          >
            <div className="text-2xl mb-2">{action.icon}</div>
            <h4 className="title-small text-on-surface mb-1">{action.label}</h4>
            <p className="body-small text-on-surface-variant">{action.description}</p>
          </MD3Card>
        ))}
      </div>
      
      <MD3DialogActions>
        <MD3Button variant="text" onClick={onClose}>
          Cancel
        </MD3Button>
      </MD3DialogActions>
    </MD3Dialog>
  );
};

// Settings Panel
const SettingsPanel = ({ open, onClose }) => {
  const { theme, toggleTheme, actualTheme } = useMaterial3Theme();
  const [settings, setSettings] = useState({
    notifications: true,
    autoSync: true,
    offlineMode: false,
    analytics: true
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <MD3Dialog
      open={open}
      onClose={onClose}
      title="Settings"
      maxWidth="md"
      scrollable
    >
      <div className="space-y-6 p-4">
        {/* Theme Settings */}
        <div className="space-y-4">
          <h3 className="headline-small text-on-surface">Appearance</h3>
          
          <MD3Switch
            checked={actualTheme === 'dark'}
            onChange={toggleTheme}
            label="Dark Mode"
            supportingText="Switch between light and dark themes"
            showIcons
            icons={{
              checked: '🌙',
              unchecked: '☀️'
            }}
          />
        </div>
        
        {/* App Settings */}
        <div className="space-y-4">
          <h3 className="headline-small text-on-surface">App Preferences</h3>
          
          {Object.entries(settings).map(([key, value]) => (
            <MD3Switch
              key={key}
              checked={value}
              onChange={(e) => handleSettingChange(key, e.target.checked)}
              label={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
              supportingText={`Enable ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
            />
          ))}
        </div>
        
        {/* Reading Preferences */}
        <div className="space-y-4">
          <h3 className="headline-small text-on-surface">Reading</h3>
          
          <MD3Checkbox
            label="Auto-bookmark"
            supportingText="Automatically save reading position"
          />
          
          <MD3Checkbox
            label="Reading reminders"
            supportingText="Get notified about reading goals"
          />
          
          <MD3Checkbox
            label="Page animations"
            supportingText="Smooth page turn effects"
          />
        </div>
      </div>
      
      <MD3DialogActions>
        <MD3Button variant="text" onClick={onClose}>
          Close
        </MD3Button>
        <MD3Button variant="filled">
          Save Changes
        </MD3Button>
      </MD3DialogActions>
    </MD3Dialog>
  );
};

// Main Enhanced Library Page
const LibraryPage = () => {
  const { theme } = useMaterial3();
  const { showSnackbar } = useSnackbar();

  // Data state
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState('grid');
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const response = await API.get('/books');
      setBooks(response.data);
    } catch (error) {
      console.error('Failed to fetch books:', error);
      showSnackbar({
        message: 'Failed to load your library. Please try again.',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBook = async () => {
    if (!bookToDelete) return;
    
    try {
      await API.delete(`/books/${bookToDelete.id}`);
      setBooks(books.filter(b => b.id !== bookToDelete.id));
      setDeleteDialogOpen(false);
      setBookToDelete(null);
      showSnackbar({
        message: `"${bookToDelete.title}" removed from library`,
        variant: 'success',
        action: <MD3Button variant="text">Undo</MD3Button>
      });
    } catch (err) {
      showSnackbar({
        message: 'Failed to delete book.',
        variant: 'error'
      });
    }
  };

  const openDeleteDialog = (book) => {
    setBookToDelete(book);
    setDeleteDialogOpen(true);
  };

  // Get available genres
  const availableGenres = useMemo(() => 
    Array.from(new Set(books.map(book => book.genre).filter(Boolean))), 
    [books]
  );

  // Filter and sort books
  const filteredBooks = useMemo(() => {
    return books
      .filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             book.author.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesGenre = selectedGenres.length === 0 || selectedGenres.includes(book.genre);
        return matchesSearch && matchesGenre;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'title': return a.title.localeCompare(b.title);
          case 'author': return a.author.localeCompare(b.author);
          case 'progress': return (b.progress || 0) - (a.progress || 0);
          default: return new Date(b.created_at) - new Date(a.created_at);
        }
      });
  }, [books, searchQuery, selectedGenres, sortBy]);

  // Book actions
  const handleBookRead = (book) => {
    window.location.href = `/read/${book.id}`;
  };

  const handleBookEdit = (book) => {
    showSnackbar({
      message: `Editing "${book.title}"`,
      variant: 'info'
    });
  };

  const handleQuickAction = async (action) => {
    if (action === 'upload') {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Simulate upload
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setUploadProgress(i);
      }
      
      setIsUploading(false);
      showSnackbar({
        message: 'Books uploaded successfully!',
        variant: 'success'
      });
    } else {
      showSnackbar({
        message: `${action} feature coming soon!`,
        variant: 'info'
      });
    }
  };

  if (loading) {
    return (
      <MD3Surface level="surface" className="min-h-screen flex items-center justify-center">
        <p className="body-large text-on-surface">Loading your library...</p>
      </MD3Surface>
    );
  }

  return (
    <MD3Surface level="surface" className="min-h-screen">
      <main className="max-w-7xl mx-auto p-6">
        <div className="space-y-8">
          {/* Page Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="headline-large text-on-surface mb-2">
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  My Library
                </span>
              </h2>
              <p className="body-large text-on-surface-variant">
                {filteredBooks.length} {filteredBooks.length === 1 ? 'book' : 'books'} in your collection
              </p>
            </div>
            <MD3Button
              variant="outlined"
              icon="⚙️"
              onClick={() => setSettingsOpen(true)}
            >
              Settings
            </MD3Button>
          </div>

          {/* Enhanced Search and Filter Bar */}
          <SearchAndFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedGenres={selectedGenres}
            onGenreChange={setSelectedGenres}
            sortBy={sortBy}
            onSortChange={setSortBy}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            availableGenres={availableGenres}
          />

          {/* Books Grid */}
          {filteredBooks.length === 0 ? (
            <MD3Surface level="surface-container" className="p-12 text-center rounded-3xl">
              <div className="text-6xl mb-4">📚</div>
              <p className="headline-small text-on-surface">No books found.</p>
              <p className="body-medium text-on-surface-variant mt-2">
                Try adjusting your search or filters.
              </p>
            </MD3Surface>
          ) : (
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1'
            }`}>
              {filteredBooks.map(book => (
                <EnhancedBookCard
                  key={book.id}
                  book={book}
                  onRead={handleBookRead}
                  onEdit={handleBookEdit}
                  onDelete={openDeleteDialog}
                  onShare={(book) => showSnackbar({ 
                    message: `Sharing "${book.title}"`, 
                    variant: 'info' 
                  })}
                  onAddToCollection={(book) => showSnackbar({ 
                    message: `Added "${book.title}" to collection`, 
                    variant: 'success' 
                  })}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Button */}
      <MD3BookLibraryFab
        onAddBook={() => setQuickActionsOpen(true)}
        onQuickSearch={() => showSnackbar({ 
          message: 'Quick search opened', 
          variant: 'info' 
        })}
        onScanBook={() => handleQuickAction('scan')}
      />

      {/* Dialogs */}
      <QuickActionsDialog
        open={quickActionsOpen}
        onClose={() => setQuickActionsOpen(false)}
        onAction={handleQuickAction}
      />

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      <MD3Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title="Delete Book"
        content={`Are you sure you want to delete "${bookToDelete?.title}"? This action cannot be undone.`}
        actions={
          <>
            <MD3Button 
              variant="text" 
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </MD3Button>
            <MD3Button 
              variant="filled" 
              onClick={handleDeleteBook}
            >
              Delete
            </MD3Button>
          </>
        }
      />

      {/* Upload Progress */}
      <MD3ProgressSnackbar
        open={isUploading}
        message="Uploading books..."
        progress={uploadProgress}
        onCancel={() => {
          setIsUploading(false);
          setUploadProgress(0);
        }}
      />
    </MD3Surface>
  );
};

export default LibraryPage;