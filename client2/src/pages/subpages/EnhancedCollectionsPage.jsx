
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useMaterial3Theme } from '../../contexts/Material3ThemeContext';
import {
  MD3Card,
  MD3Button,
  MD3TextField,
  MD3Chip,
  MD3Dialog,
  MD3Progress,
  MD3FloatingActionButton
} from '../../components/Material3';
import { createDefaultCollections, loadCollectionsFromStorage, migrateDuplicateCollections } from '../../utils/collections';
import './EnhancedCollectionsPage.css';

const EnhancedCollectionsPage = ({ 
  books = [], 
  onBookUpdate, 
  user,
  className = '' 
}) => {
  const { actualTheme } = useMaterial3Theme();
  
  
  // State management
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [collectionDetailView, setCollectionDetailView] = useState(null);
  const [draggedBook, setDraggedBook] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooks, setSelectedBooks] = useState(new Set());
  const [batchMode, setBatchMode] = useState(false);
  const [currentlyReadingBooks, setCurrentlyReadingBooks] = useState([]);
  
  // Enhanced UX states
  const [operationLoading, setOperationLoading] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);

  // Collection creation state
  const [newCollection, setNewCollection] = useState({
    name: '',
    description: '',
    color: '#6750A4',
    icon: '📚'
  });

  // Available colors for collections
  const collectionColors = [
    '#6750A4', '#7C4DFF', '#3F51B5', '#2196F3',
    '#00BCD4', '#009688', '#4CAF50', '#8BC34A',
    '#CDDC39', '#FFC107', '#FF9800', '#FF5722',
    '#F44336', '#E91E63', '#9C27B0', '#673AB7'
  ];

  // Available icons for collections
  const collectionIcons = [
    '📚', '📖', '📝', '🎓', '💼', '🌟', '❤️', '🔥',
    '⭐', '📋', '🎯', '🚀', '💎', '🏆', '📊', '🎨'
  ];

  // Use books prop to ensure consistency with Dashboard
  useEffect(() => {
    const readingBooks = books.filter(book => book.is_reading);
    setCurrentlyReadingBooks(readingBooks);
  }, [books]);

  // This useEffect is now handled by the main loadCollections logic above

  // Initialize collections using unified collections logic
  useEffect(() => {
    const loadCollections = async () => {
      setLoading(true);
      try {
        // Run migration to clean up any duplicate collections first
        migrateDuplicateCollections();

        // Use the centralized collections utility for default collections
        const defaultCollections = createDefaultCollections(books);

        // Get user-created collections from localStorage (exclude default ones)
        const savedCollections = loadCollectionsFromStorage();
        const userCollections = savedCollections.filter(collection => !collection.isDefault);

        // Combine: default collections (auto-updated) + user collections (from localStorage)
        const finalCollections = [...defaultCollections, ...userCollections];

        setCollections(finalCollections);

        console.log('✅ Collections loaded:', {
          total: finalCollections.length,
          default: defaultCollections.length,
          userCreated: userCollections.length,
          defaultNames: defaultCollections.map(c => c.name)
        });

        // Store only user-created collections in localStorage
        const userOnlyCollections = finalCollections.filter(c => !c.isDefault);
        localStorage.setItem('book_collections', JSON.stringify(userOnlyCollections));

      } catch (error) {
        console.error('Failed to load collections:', error);
      } finally {
        setLoading(false);
      }
    };

    // Only run when we have books data
    if (books.length >= 0) {
      loadCollections();
    }
  }, [books]);

  // Save only user-created collections to localStorage when they change
  useEffect(() => {
    if (collections.length > 0) {
      const userCollections = collections.filter(collection => !collection.isDefault);
      localStorage.setItem('book_collections', JSON.stringify(userCollections));
    }
  }, [collections]);

  // Get books for a collection
  const getBooksForCollection = useCallback((collection) => {
    const bookIds = collection.books || collection.bookIds || [];
    return books.filter(book => bookIds.includes(book.id));
  }, [books]);

  // Filtered collections based on search
  const filteredCollections = useMemo(() => {
    if (!searchQuery.trim()) return collections;
    
    return collections.filter(collection =>
      collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      collection.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [collections, searchQuery]);

  // Handle creating new collection
  const handleCreateCollection = useCallback(() => {
    if (!newCollection.name.trim()) return;

    const collection = {
      id: Date.now().toString(),
      ...newCollection,
      books: [],
      bookIds: [], // Keep both for compatibility
      isDefault: false,
      createdAt: Date.now()
    };

    setCollections(prev => [collection, ...prev]);
    setNewCollection({ name: '', description: '', color: '#6750A4', icon: '📚' });
    setIsCreating(false);
  }, [newCollection]);

  // Handle adding books to collection
  const handleAddBooksToCollection = useCallback((collectionId, bookIds) => {
    setCollections(prev => prev.map(collection => {
      if (collection.id === collectionId) {
        const currentBookIds = collection.books || collection.bookIds || [];
        const newBookIds = [...new Set([...currentBookIds, ...bookIds])];
        return { ...collection, books: newBookIds, bookIds: newBookIds };
      }
      return collection;
    }));
  }, []);

  // Handle removing books from collection
  const handleRemoveBooksFromCollection = useCallback((collectionId, bookIds) => {
    setCollections(prev => prev.map(collection => {
      if (collection.id === collectionId) {
        const currentBookIds = collection.books || collection.bookIds || [];
        const newBookIds = currentBookIds.filter(id => !bookIds.includes(id));
        return { ...collection, books: newBookIds, bookIds: newBookIds };
      }
      return collection;
    }));
  }, []);

  // Handle deleting collection
  const handleDeleteCollection = useCallback((collectionId) => {
    if (window.confirm('Are you sure you want to delete this collection?')) {
      setCollections(prev => prev.filter(c => c.id !== collectionId));
      setEditingCollection(null);
      setCollectionDetailView(null);
    }
  }, []);

  // Handle editing collection
  const handleEditCollection = useCallback((updatedCollection) => {
    setCollections(prev => prev.map(collection => 
      collection.id === updatedCollection.id ? updatedCollection : collection
    ));
    setEditingCollection(null);
  }, []);

  // Handle drag and drop
  const handleDragStart = useCallback((e, book) => {
    setDraggedBook(book);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', book.id);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e, collectionId) => {
    e.preventDefault();
    
    if (draggedBook) {
      handleAddBooksToCollection(collectionId, [draggedBook.id]);
      setDraggedBook(null);
    } else {
      // Try to get book ID from dataTransfer as fallback
      const bookId = e.dataTransfer.getData('text/plain');
      if (bookId) {
        const book = books.find(b => b.id === bookId);
        if (book) {
          handleAddBooksToCollection(collectionId, [book.id]);
        }
      }
    }
  }, [draggedBook, handleAddBooksToCollection, books]);

  // Handle batch operations with enhanced feedback
  const handleBatchAddToCollection = useCallback(async (collectionId) => {
    const bookCount = selectedBooks.size;
    const targetCollection = collections.find(c => c.id === collectionId);
    
    setOperationLoading(true);
    
    try {
      await handleAddBooksToCollection(collectionId, Array.from(selectedBooks));
      setSelectedBooks(new Set());
      setBatchMode(false);
      
      setActionFeedback({ 
        type: 'success', 
        message: `${bookCount} book${bookCount > 1 ? 's' : ''} added to "${targetCollection?.name}"` 
      });
      setTimeout(() => setActionFeedback(null), 3000);
    } catch (error) {
      setActionFeedback({ 
        type: 'error', 
        message: 'Failed to add books to collection' 
      });
      setTimeout(() => setActionFeedback(null), 3000);
    } finally {
      setOperationLoading(false);
    }
  }, [selectedBooks, handleAddBooksToCollection, collections]);

  // Render collection card
  const renderCollectionCard = (collection) => {
    const collectionBooks = getBooksForCollection(collection);
    
    return (
      <MD3Card
        key={collection.id}
        variant="elevated"
        interactive
        className="collection-card"
        style={{
          '--collection-color': collection.color
        }}
        onDragOver={handleDragOver}
        onDrop={(e) => {
          console.log('Drop event triggered on collection:', collection.name);
          e.preventDefault();
          e.stopPropagation();
          handleDrop(e, collection.id);
        }}
        onClick={(e) => {
          if (draggedBook || batchMode) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          if (!operationLoading) setCollectionDetailView(collection);
        }}
      >
        {/* Collection header */}
        <div className="collection-card-header">
          <div className="collection-card-header-top">
            <div className="collection-card-info">
              <span className="collection-card-icon">{collection.icon}</span>
              <div>
                <h3 className="collection-card-title">
                  {collection.name}
                </h3>
                <p className="collection-card-description">
                  {collection.description}
                </p>
              </div>
            </div>

            <div className="collection-card-actions">
              {batchMode && selectedBooks.size > 0 && (
                <MD3Button
                  variant="filled"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBatchAddToCollection(collection.id);
                  }}
                  disabled={operationLoading}
                  className="collection-card-batch-button"
                >
                  + Add {selectedBooks.size}
                </MD3Button>
              )}
              {!collection.isDefault && (
                <MD3Button
                  variant="text"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCollection(collection);
                  }}
                  className="collection-card-edit-button"
                >
                  ⚙️
                </MD3Button>
              )}
            </div>
          </div>

          <div className="collection-card-stats">
            <MD3Chip
              label={`${collectionBooks.length} books`}
              size="small"
              className="collection-card-chip"
            />
            
            {collectionBooks.length > 0 && (
              <div className="collection-card-updated">
                Updated {new Date(collection.createdAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Book preview grid */}
        <div className="collection-book-preview-area">
          {collectionBooks.length > 0 ? (
            <div className="collection-book-grid">
              {collectionBooks.slice(0, 8).map((book, index) => (
                <div
                  key={book.id}
                  className="collection-book-item"
                  draggable
                  onDragStart={(e) => handleDragStart(e, book)}
                >
                  {book.cover_url ? (
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="collection-book-cover"
                    />
                  ) : (
                    <div className="collection-book-placeholder">
                      {book.title.slice(0, 10)}...
                    </div>
                  )}
                </div>
              ))}
              
              {collectionBooks.length > 8 && (
                <div className="collection-book-more">
                  +{collectionBooks.length - 8}
                </div>
              )}
            </div>
          ) : (
            <div className="collection-empty-state">
              <div className="collection-empty-icon">📚</div>
              <p className="collection-empty-text">
                {batchMode
                  ? 'Select books on the right and use the Add button above'
                  : 'No books yet. Drag books here from your library'
                }
              </p>
            </div>
          )}
        </div>
        
        {/* Operation Loading Overlay */}
        {operationLoading && (
          <div className="operation-loading-overlay">
            <div className="operation-loading-content">
              <MD3Progress variant="circular" size={24} />
              <span className="operation-loading-text">
                Processing...
              </span>
            </div>
          </div>
        )}
      </MD3Card>
    );
  };

  if (loading) {
    return (
      <div className={`${className} collections-loading-container`}>
        <MD3Progress variant="circular" />
        <p className="collections-loading-text">Loading your collections...</p>
      </div>
    );
  }

  return (
    <div className={`enhanced-collections-page ${className}`}>
      {/* Collections Content Wrapper - Constrains all content to 1200px */}
      <div className="collections-page-content">
        {/* Header Section - Following MD3 Style Guide */}
        <div className="collections-header-section">
          <h1>
            📚 Collections
          </h1>
          <p>
            Organize your library with custom collections that reflect your reading journey
          </p>

          {/* Search and controls */}
          <div className="collections-search-controls">
            <MD3TextField
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="collections-search-field"
              leadingIcon="🔍"
            />

            <MD3Button
              variant="filled"
              onClick={() => setIsCreating(true)}
              className="collections-header-button"
              icon="➕"
            >
              New Collection
            </MD3Button>

            <MD3Button
              variant={batchMode ? 'filled' : 'outlined'}
              onClick={() => setBatchMode(!batchMode)}
              className={`collections-header-button ${batchMode ? 'batch-mode-active' : ''}`}
              icon="📝"
            >
              Batch Mode
            </MD3Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="collections-main-content">
        <div className="collections-content-wrapper">
          {/* Collections Grid */}
          <div className="collections-grid-container">
            {filteredCollections.length > 0 ? (
              <div className="collections-grid">
                {filteredCollections.map(renderCollectionCard)}
              </div>
            ) : (
              <div className="empty-collections-container">
                <div className="empty-collections-icon">📚</div>
                <h3 className="empty-collections-title">
                  {searchQuery ? 'No collections found' : 'Start building your collections'}
                </h3>
                <p className="empty-collections-description">
                  {searchQuery
                    ? 'Try adjusting your search terms'
                    : 'Create themed collections to organize your books by genre, mood, or any way you like'
                  }
                </p>
                {!searchQuery && (
                  <MD3Button
                    variant="filled"
                    onClick={() => setIsCreating(true)}
                    icon="➕"
                  >
                    Create Your First Collection
                  </MD3Button>
                )}
              </div>
            )}
          </div>
          
          {/* Draggable Book Library */}
          {!batchMode && (
            <div className="book-library-sidebar">
              <MD3Card className="book-library-card">
                <div className="book-library-header">
                  <h3 className="book-library-title">
                    📚 Select Books
                  </h3>
                  <p className="book-library-subtitle">
                    Drag books to collections
                  </p>
                </div>

                <div className="book-library-grid">
                  {books.map(book => (
                    <div
                      key={book.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, book)}
                      className="draggable-book"
                      title={`Drag "${book.title}" to a collection`}
                    >
                      {book.cover_url ? (
                        <img
                          src={book.cover_url}
                          alt={book.title}
                          className="draggable-book-cover"
                        />
                      ) : (
                        <div className="draggable-book-placeholder">
                          {book.title.slice(0, 20)}...
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {books.length === 0 && (
                  <div className="book-library-empty">
                    <div className="book-library-empty-icon">📚</div>
                    <p className="book-library-empty-text">No books available</p>
                  </div>
                )}
              </MD3Card>
            </div>
          )}
        </div>
      </div>

      {/* Batch Mode Book Selection Panel */}
      {batchMode && (
        <div className="batch-mode-panel">
          <div className="batch-mode-header">
            <div className="batch-mode-header-row">
              <h3 className="batch-mode-title">
                Select Books ({selectedBooks.size})
              </h3>
              <MD3Button
                variant="text"
                size="small"
                onClick={() => {
                  setSelectedBooks(new Set());
                  setBatchMode(false);
                }}
                className="batch-mode-close"
              >
                ✕
              </MD3Button>
            </div>
            <p className="batch-mode-subtitle">
              Select books, then use Add buttons on collections
            </p>
          </div>
          
          <div className="batch-mode-content">
            <div className="batch-mode-grid">
              {books.map(book => (
                <div
                  key={book.id}
                  onClick={() => {
                    const newSelected = new Set(selectedBooks);
                    if (selectedBooks.has(book.id)) {
                      newSelected.delete(book.id);
                    } else {
                      newSelected.add(book.id);
                    }
                    setSelectedBooks(newSelected);
                  }}
                  className={`batch-mode-book ${selectedBooks.has(book.id) ? 'selected' : ''}`}
                >
                  {book.cover_url ? (
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="batch-mode-book-cover"
                    />
                  ) : (
                    <div className="batch-mode-book-placeholder">
                      {book.title.slice(0, 20)}...
                    </div>
                  )}

                  {selectedBooks.has(book.id) && (
                    <div className="batch-mode-book-check">
                      ✓
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Batch Mode Panel */}
      {batchMode && (
        <div
          className={`batch-mode-bottom-panel ${operationLoading ? 'loading' : 'normal'}`}
        >
          {operationLoading ? (
            <div className="batch-mode-loading-content">
              <MD3Progress variant="circular" size={20} />
              <span>Adding books...</span>
            </div>
          ) : (
            <div className="batch-mode-normal-content">
              <span>Selected: {selectedBooks.size} books</span>

              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBatchAddToCollection(e.target.value);
                    e.target.value = '';
                  }
                }}
                disabled={operationLoading || selectedBooks.size === 0}
                className="batch-mode-select"
              >
                <option value="">Add to Collection...</option>
                {collections.map(collection => (
                  <option key={collection.id} value={collection.id}>
                    {collection.icon} {collection.name}
                  </option>
                ))}
              </select>

              <MD3Button
                variant="text"
                onClick={() => {
                  setSelectedBooks(new Set());
                  setBatchMode(false);
                }}
                disabled={operationLoading}
                className={`batch-mode-cancel ${operationLoading ? 'disabled' : ''}`}
              >
                Cancel
              </MD3Button>
            </div>
          )}
        </div>
      )}


      {/* Floating Action Button */}
      {!batchMode && (
        <MD3FloatingActionButton
          icon="➕"
          onClick={() => setIsCreating(true)}
          className="collections-fab"
        />
      )}

      {/* Collection Detail Dialog */}
      <MD3Dialog
        open={!!collectionDetailView}
        onClose={() => setCollectionDetailView(null)}
        title={collectionDetailView?.name || 'Collection Details'}
        maxWidth="md"
      >
        {collectionDetailView && (
          <div className="dialog-content">
            <div
              className="dialog-collection-info"
              style={{
                backgroundColor: `${collectionDetailView.color}10`,
                border: `1px solid ${collectionDetailView.color}30`
              }}
            >
              <span className="dialog-collection-icon">{collectionDetailView.icon}</span>
              <div className="dialog-collection-details">
                <h3>
                  {collectionDetailView.name}
                </h3>
                <p>
                  {collectionDetailView.description}
                </p>
                <p className="dialog-collection-count">
                  {getBooksForCollection(collectionDetailView).length} books
                </p>
              </div>
            </div>
            
            <div className="dialog-books-grid">
              {getBooksForCollection(collectionDetailView).map(book => (
                <div key={book.id} className="dialog-book-item">
                  {book.cover_url ? (
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="dialog-book-cover"
                    />
                  ) : (
                    <div
                      className="dialog-book-placeholder"
                      style={{
                        backgroundColor: collectionDetailView.color
                      }}
                    >
                      {book.title}
                    </div>
                  )}

                  {/* Remove book button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveBooksFromCollection(collectionDetailView.id, [book.id]);
                      setCollectionDetailView(prev => ({
                        ...prev,
                        bookIds: prev.bookIds.filter(id => id !== book.id)
                      }));
                    }}
                    className="dialog-book-remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            
            {getBooksForCollection(collectionDetailView).length === 0 && (
              <div className="dialog-empty-state">
                <div className="dialog-empty-icon">📚</div>
                <p>No books in this collection yet</p>
              </div>
            )}
            
            <div className="dialog-actions">
              {!collectionDetailView.isDefault && (
                <MD3Button
                  variant="text"
                  onClick={() => {
                    setEditingCollection(collectionDetailView);
                    setCollectionDetailView(null);
                  }}
                  className="dialog-edit-button"
                >
                  Edit Collection
                </MD3Button>
              )}
              <MD3Button
                variant="text"
                onClick={() => setCollectionDetailView(null)}
              >
                Close
              </MD3Button>
            </div>
          </div>
        )}
      </MD3Dialog>

      {/* Edit Collection Dialog */}
      <MD3Dialog
        open={!!editingCollection}
        onClose={() => setEditingCollection(null)}
        title="Edit Collection"
        maxWidth="sm"
      >
        {editingCollection && (
          <div className="collection-form">
            <MD3TextField
              label="Collection Name"
              value={editingCollection.name}
              onChange={(e) => setEditingCollection(prev => ({ ...prev, name: e.target.value }))}
              required
            />
            
            <MD3TextField
              label="Description"
              value={editingCollection.description}
              onChange={(e) => setEditingCollection(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={2}
            />
            
            <div className="collection-form-section">
              <label className="collection-form-label">
                Choose an icon
              </label>
              <div className="icon-picker-grid">
                {collectionIcons.map(icon => (
                  <button
                    key={icon}
                    onClick={() => setEditingCollection(prev => ({ ...prev, icon }))}
                    className={`icon-picker-item ${editingCollection.icon === icon ? 'selected' : ''}`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="collection-form-section">
              <label className="collection-form-label">
                Choose a color
              </label>
              <div className="color-picker-grid">
                {collectionColors.map(color => (
                  <button
                    key={color}
                    onClick={() => setEditingCollection(prev => ({ ...prev, color }))}
                    className={`color-picker-item ${editingCollection.color === color ? 'selected' : ''}`}
                    style={{
                      backgroundColor: color
                    }}
                  />
                ))}
              </div>
            </div>
            
            <div className="dialog-actions-split">
              <MD3Button
                variant="text"
                onClick={() => handleDeleteCollection(editingCollection.id)}
                className="dialog-delete-button"
              >
                Delete Collection
              </MD3Button>

              <div className="dialog-actions-right">
                <MD3Button
                  variant="text"
                  onClick={() => setEditingCollection(null)}
                >
                  Cancel
                </MD3Button>
                <MD3Button
                  variant="filled"
                  onClick={() => handleEditCollection(editingCollection)}
                  disabled={!editingCollection.name.trim()}
                >
                  Save Changes
                </MD3Button>
              </div>
            </div>
          </div>
        )}
      </MD3Dialog>

      {/* Create Collection Dialog */}
      <MD3Dialog
        open={isCreating}
        onClose={() => setIsCreating(false)}
        title="Create New Collection"
        maxWidth="sm"
      >
        <div className="collection-form">
          <MD3TextField
            label="Collection Name"
            value={newCollection.name}
            onChange={(e) => setNewCollection(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Sci-Fi Favorites, Summer Reading..."
            required
          />
          
          <MD3TextField
            label="Description"
            value={newCollection.description}
            onChange={(e) => setNewCollection(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of this collection..."
            multiline
            rows={2}
          />
          
          <div className="collection-form-section">
            <label className="collection-form-label">
              Choose an icon
            </label>
            <div className="icon-picker-grid">
              {collectionIcons.map(icon => (
                <button
                  key={icon}
                  onClick={() => setNewCollection(prev => ({ ...prev, icon }))}
                  className={`icon-picker-item ${newCollection.icon === icon ? 'selected' : ''}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          
          <div className="collection-form-section">
            <label className="collection-form-label">
              Choose a color
            </label>
            <div className="color-picker-grid">
              {collectionColors.map(color => (
                <button
                  key={color}
                  onClick={() => setNewCollection(prev => ({ ...prev, color }))}
                  className={`color-picker-item ${newCollection.color === color ? 'selected' : ''}`}
                  style={{
                    backgroundColor: color
                  }}
                />
              ))}
            </div>
          </div>
          
          <div className="collection-form-actions">
            <MD3Button
              variant="text"
              onClick={() => setIsCreating(false)}
            >
              Cancel
            </MD3Button>
            <MD3Button
              variant="filled"
              onClick={handleCreateCollection}
              disabled={!newCollection.name.trim() || operationLoading}
              className="collection-create-button"
            >
              {operationLoading ? (
                <div className="collection-create-loading">
                  <MD3Progress
                    variant="circular"
                    size={16}
                    className="collection-create-spinner"
                  />
                  Creating...
                </div>
              ) : (
                'Create Collection'
              )}
            </MD3Button>
          </div>
        </div>
      </MD3Dialog>
      </div> {/* Close collections-page-content */}
    </div>
  );
};

// Collection colors for UI
export const COLLECTION_COLORS = [
  '#6750A4', '#7C4DFF', '#3F51B5', '#2196F3',
  '#00BCD4', '#009688', '#4CAF50', '#8BC34A',
  '#CDDC39', '#FFC107', '#FF9800', '#FF5722',
  '#F44336', '#E91E63', '#9C27B0', '#673AB7'
];

export default EnhancedCollectionsPage;