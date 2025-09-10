
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useMaterial3Theme } from '../../contexts/Material3ThemeContext';
import { 
  MD3Card, 
  MD3Button, 
  MD3TextField, 
  MD3Chip, 
  MD3Dialog, 
  MD3Surface,
  MD3Progress,
  MD3FloatingActionButton
} from '../../components/Material3';

const EnhancedCollectionsPage = ({ 
  books = [], 
  onBookUpdate, 
  user,
  className = '' 
}) => {
  const { actualTheme } = useMaterial3Theme();
  
  // Debug the books prop vs API data
  console.log('🔍 Collections: Component initialized with books prop:', books.length, 'books');
  console.log('🔍 Collections: Books prop currently reading:', books.filter(b => b.is_reading).map(b => ({id: b.id, title: b.title, is_reading: b.is_reading})));
  
  useEffect(() => {
    console.log('🔍 Collections: books prop changed - now has', books.length, 'books');
    const propsCurrentlyReading = books.filter(b => b.is_reading);
    console.log('🔍 Collections: Currently reading from books prop:', propsCurrentlyReading.length, 'books');
    console.log('🔍 Collections: Props reading book details:', propsCurrentlyReading.map(b => ({id: b.id, title: b.title, is_reading: b.is_reading})));
  }, [books]);
  
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

  // Use books prop instead of separate API call to ensure consistency with Dashboard
  useEffect(() => {
    console.log('🔍 Collections: Extracting currently reading from books prop...');
    console.log('🔍 Collections: Raw books prop structure:', books.length > 0 ? {
      firstBook: books[0],
      totalBooks: books.length,
      booksWithIsReading: books.filter(b => b.hasOwnProperty('is_reading')).length,
      booksWithTrueIsReading: books.filter(b => b.is_reading === true).length
    } : 'No books');
    
    const readingBooks = books.filter(book => book.is_reading);
    console.log('🔍 Collections: Currently reading books from props:', readingBooks.length, 'books:', readingBooks.map(b => ({id: b.id, title: b.title, is_reading: b.is_reading})));
    
    if (readingBooks.length === 0 && books.length > 0) {
      console.log('🔍 Collections: WARNING - No currently reading books found. Checking all books is_reading status:');
      books.slice(0, 5).forEach((book, index) => {
        console.log(`🔍 Collections: Book ${index}: ${book.title}, is_reading: ${book.is_reading} (type: ${typeof book.is_reading})`);
      });
    }
    
    setCurrentlyReadingBooks(readingBooks);
  }, [books]);

  // Update Currently Reading collection when currentlyReadingBooks changes
  useEffect(() => {
    console.log('🔍 Collections: currentlyReadingBooks changed:', currentlyReadingBooks.length, 'books');
    if (currentlyReadingBooks.length > 0) {
      console.log('🔍 Collections: Updating Currently Reading collection with book IDs:', currentlyReadingBooks.map(b => b.id));
      setCollections(prev => prev.map(collection => {
        if (collection.id === 'currently-reading') {
          const updated = {
            ...collection,
            bookIds: currentlyReadingBooks.map(b => b.id)
          };
          console.log('🔍 Collections: Updated Currently Reading collection:', updated);
          return updated;
        }
        return collection;
      }));
    } else {
      console.log('🔍 Collections: No currently reading books, clearing collection');
      setCollections(prev => prev.map(collection => {
        if (collection.id === 'currently-reading') {
          return {
            ...collection,
            bookIds: []
          };
        }
        return collection;
      }));
    }
  }, [currentlyReadingBooks]);

  // Initialize collections with enhanced default categories
  useEffect(() => {
    const loadCollections = async () => {
      console.log('🔥 loadCollections called due to books dependency change');
      console.log('🔥 loadCollections - Current books array:', books.length, 'books');
      console.log('🔥 loadCollections - Current collections before loading:', collections.length, 'collections');
      setLoading(true);
      try {
        // Get saved collections from localStorage or initialize defaults
        const savedCollections = localStorage.getItem('bookCollections');
        console.log('🔥 Loading collections from localStorage:', savedCollections ? 'found saved data' : 'no saved data');
        
        if (savedCollections) {
          const parsed = JSON.parse(savedCollections);
          console.log('🔥 loadCollections - Parsed collections:', parsed.length, 'collections');
          console.log('🔥 loadCollections - About to call setCollections with parsed data');
          setCollections(parsed);
          console.log('🔥 loadCollections - setCollections called with parsed data');
        } else {
          // Create smart default collections based on available books
          const defaultCollections = [
            {
              id: 'currently-reading',
              name: 'Currently Reading',
              description: 'Books you\'re actively reading (synced with Dashboard)',
              color: '#2196F3',
              icon: '📖',
              bookIds: currentlyReadingBooks.map(b => b.id),
              isDefault: true,
              isAutomatic: true,
              createdAt: Date.now()
            },
            {
              id: 'favorites',
              name: 'Favorites',
              description: 'Your most beloved books',
              color: '#F44336',
              icon: '❤️',
              bookIds: books.filter(b => b.favorite || b.rating >= 4).map(b => b.id),
              isDefault: true,
              createdAt: Date.now()
            },
            {
              id: 'wishlist',
              name: 'Want to Read',
              description: 'Books on your reading wishlist',
              color: '#4CAF50',
              icon: '📋',
              bookIds: books.filter(b => b.status === 'want_to_read' || (!b.isReading && !b.completed)).map(b => b.id),
              isDefault: true,
              createdAt: Date.now()
            },
            {
              id: 'completed',
              name: 'Completed',
              description: 'Books you\'ve finished reading',
              color: '#8BC34A',
              icon: '✅',
              bookIds: books.filter(b => b.completed || b.status === 'completed').map(b => b.id),
              isDefault: true,
              createdAt: Date.now()
            }
          ];
          
          console.log('🔥 loadCollections - Creating default collections with', books.length, 'books');
          setCollections(defaultCollections);
          localStorage.setItem('bookCollections', JSON.stringify(defaultCollections));
          console.log('🔥 loadCollections - Default collections created and saved');
        }
      } catch (error) {
        console.error('🔥 loadCollections - Failed to load collections:', error);
      } finally {
        console.log('🔥 loadCollections - Complete, setting loading to false');
        setLoading(false);
      }
    };

    console.log('🔥 loadCollections - About to call loadCollections()');
    loadCollections();
    console.log('🔥 loadCollections - loadCollections() called');
  }, [books]);

  // Save collections to localStorage whenever they change
  useEffect(() => {
    console.log('🔥 localStorage save effect triggered - collections.length:', collections.length);
    if (collections.length > 0) {
      console.log('🔥 Saving collections to localStorage:', collections.map(c => ({id: c.id, name: c.name, bookCount: c.bookIds.length})));
      localStorage.setItem('bookCollections', JSON.stringify(collections));
      console.log('🔥 Collections saved to localStorage');
    }
  }, [collections]);

  // Get books for a collection
  const getBooksForCollection = useCallback((collection) => {
    return books.filter(book => collection.bookIds.includes(book.id));
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
      bookIds: [],
      isDefault: false,
      createdAt: Date.now()
    };

    setCollections(prev => [collection, ...prev]);
    setNewCollection({ name: '', description: '', color: '#6750A4', icon: '📚' });
    setIsCreating(false);
  }, [newCollection]);

  // Handle adding books to collection
  const handleAddBooksToCollection = useCallback((collectionId, bookIds) => {
    console.log('🔥 handleAddBooksToCollection called - collectionId:', collectionId, 'bookIds:', bookIds);
    console.log('🔥 handleAddBooksToCollection - Current collections count:', collections.length);
    console.log('🔥 handleAddBooksToCollection - Target collection exists?', collections.some(c => c.id === collectionId));
    
    setCollections(prev => {
      console.log('🔥 handleAddBooksToCollection - setCollections callback executed with prev:', prev.length, 'collections');
      const targetCollection = prev.find(c => c.id === collectionId);
      if (targetCollection) {
        console.log('🔥 handleAddBooksToCollection - Found target collection:', targetCollection.name, 'current books:', targetCollection.bookIds);
      } else {
        console.log('🔥 handleAddBooksToCollection - ERROR: Target collection not found!');
      }
      
      const updated = prev.map(collection => {
        if (collection.id === collectionId) {
          const newBookIds = [...new Set([...collection.bookIds, ...bookIds])];
          console.log('🔥 Updated collection', collection.name, 'bookIds:', collection.bookIds, '→', newBookIds);
          return { ...collection, bookIds: newBookIds };
        }
        return collection;
      });
      console.log('🔥 Collections state updated - returning', updated.length, 'collections');
      return updated;
    });
    console.log('🔥 handleAddBooksToCollection - setCollections call completed');
  }, [collections]);

  // Handle removing books from collection
  const handleRemoveBooksFromCollection = useCallback((collectionId, bookIds) => {
    setCollections(prev => prev.map(collection => {
      if (collection.id === collectionId) {
        const newBookIds = collection.bookIds.filter(id => !bookIds.includes(id));
        return { ...collection, bookIds: newBookIds };
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
    console.log('🔥 ======= DRAG START =======');
    console.log('🔥 handleDragStart called with book:', book);
    console.log('🔥 Book ID:', book?.id, 'Title:', book?.title);
    console.log('🔥 Event target:', e.target);
    console.log('🔥 Current draggedBook state before setting:', draggedBook);
    
    if (book && book.id) {
      setDraggedBook(book);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', book.id);
      console.log('🔥 draggedBook set to:', book.title, 'ID:', book.id);
      console.log('🔥 dataTransfer effectAllowed set to: move');
    } else {
      console.log('🔥 ERROR: Invalid book object received in handleDragStart');
    }
    console.log('🔥 ===========================');
  }, [draggedBook]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e, collectionId) => {
    e.preventDefault();
    console.log('🔥 ======= DROP EVENT =======');
    console.log('🔥 Drop event - draggedBook:', draggedBook, 'collectionId:', collectionId);
    console.log('🔥 Event target:', e.target);
    console.log('🔥 dataTransfer data:', e.dataTransfer.getData('text/plain'));
    
    if (draggedBook) {
      console.log('🔥 Adding book', draggedBook.id, 'to collection', collectionId);
      handleAddBooksToCollection(collectionId, [draggedBook.id]);
      setDraggedBook(null);
      console.log('🔥 Book added to collection, draggedBook cleared');
    } else {
      console.log('🔥 No draggedBook found during drop');
      // Try to get book ID from dataTransfer as fallback
      const bookId = e.dataTransfer.getData('text/plain');
      if (bookId) {
        console.log('🔥 Fallback: Found bookId in dataTransfer:', bookId);
        const book = books.find(b => b.id === bookId);
        if (book) {
          console.log('🔥 Fallback: Found book in books array:', book.title);
          handleAddBooksToCollection(collectionId, [book.id]);
        } else {
          console.log('🔥 Fallback: Book not found in books array');
        }
      } else {
        console.log('🔥 No bookId found in dataTransfer either');
      }
    }
    console.log('🔥 ==========================');
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
          background: `linear-gradient(135deg, ${collection.color}15, ${collection.color}05)`,
          border: `2px solid ${collection.color}20`,
          position: 'relative',
          overflow: 'hidden'
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
        <div style={{
          padding: '20px',
          background: `linear-gradient(135deg, ${collection.color}25, ${collection.color}10)`,
          borderBottom: `1px solid ${collection.color}20`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '28px' }}>{collection.icon}</span>
              <div>
                <h3 style={{
                  margin: '0 0 4px 0',
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#1C1B1F'
                }}>
                  {collection.name}
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: '0.875rem',
                  color: '#49454F',
                  opacity: 0.8
                }}>
                  {collection.description}
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {batchMode && selectedBooks.size > 0 && (
                <MD3Button
                  variant="filled"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBatchAddToCollection(collection.id);
                  }}
                  disabled={operationLoading}
                  style={{ 
                    backgroundColor: collection.color,
                    color: 'white',
                    fontSize: '12px'
                  }}
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
                  style={{ color: collection.color }}
                >
                  ⚙️
                </MD3Button>
              )}
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <MD3Chip
              label={`${collectionBooks.length} books`}
              size="small"
              style={{
                backgroundColor: `${collection.color}20`,
                color: collection.color,
                border: `1px solid ${collection.color}30`
              }}
            />
            
            {collectionBooks.length > 0 && (
              <div style={{
                fontSize: '0.75rem',
                color: '#49454F',
                opacity: 0.7
              }}>
                Updated {new Date(collection.createdAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Book preview grid */}
        <div style={{ padding: '16px' }}>
          {collectionBooks.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
              gap: '8px',
              maxHeight: '120px',
              overflow: 'hidden'
            }}>
              {collectionBooks.slice(0, 8).map((book, index) => (
                <div
                  key={book.id}
                  style={{
                    position: 'relative',
                    aspectRatio: '2/3',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    transform: `translateY(${index % 2 === 0 ? '0' : '8px'})`,
                    transition: 'transform 0.3s ease'
                  }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, book)}
                >
                  {book.cover_url ? (
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: collection.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      color: 'white',
                      textAlign: 'center',
                      padding: '4px'
                    }}>
                      {book.title.slice(0, 10)}...
                    </div>
                  )}
                </div>
              ))}
              
              {collectionBooks.length > 8 && (
                <div style={{
                  aspectRatio: '2/3',
                  borderRadius: '6px',
                  backgroundColor: `${collection.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  color: collection.color,
                  fontWeight: '600'
                }}>
                  +{collectionBooks.length - 8}
                </div>
              )}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '32px 16px',
              color: '#49454F',
              opacity: 0.6
            }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>📚</div>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>
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
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            borderRadius: '12px'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}>
              <MD3Progress variant="circular" size={24} />
              <span style={{ 
                fontSize: '0.8rem', 
                color: '#49454F',
                fontWeight: '500' 
              }}>
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
      <MD3Surface className={className} style={{ padding: '32px', textAlign: 'center' }}>
        <MD3Progress variant="circular" />
        <p style={{ marginTop: '16px', color: '#49454F' }}>Loading your collections...</p>
      </MD3Surface>
    );
  }

  return (
    <MD3Surface className={className} style={{ 
      minHeight: '100vh', 
      backgroundColor: actualTheme === 'dark' ? '#0f172a' : '#FFFBFE' 
    }}>
      {/* Header Section */}
      <div style={{
        background: 'linear-gradient(135deg, #6750A4, #7C4DFF)',
        color: 'white',
        padding: '32px 24px',
        marginBottom: '24px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{
            margin: '0 0 8px 0',
            fontSize: '2.5rem',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            📚 Collections
          </h1>
          <p style={{
            margin: '0 0 24px 0',
            fontSize: '1.125rem',
            opacity: 0.9
          }}>
            Organize your library with custom collections that reflect your reading journey
          </p>
          
          {/* Search and controls */}
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <MD3TextField
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                minWidth: '300px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: 'white'
              }}
              leadingIcon="🔍"
            />
            
            <MD3Button
              variant="filled"
              onClick={() => setIsCreating(true)}
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)'
              }}
              icon="➕"
            >
              New Collection
            </MD3Button>
            
            <MD3Button
              variant={batchMode ? 'filled' : 'outlined'}
              onClick={() => setBatchMode(!batchMode)}
              style={{
                backgroundColor: batchMode ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)'
              }}
              icon="📝"
            >
              Batch Mode
            </MD3Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ padding: '0 24px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '24px' }}>
          {/* Collections Grid */}
          <div style={{ flex: '2' }}>
            {filteredCollections.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '20px'
              }}>
                {filteredCollections.map(renderCollectionCard)}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '64px 24px',
                color: '#49454F'
              }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>📚</div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.5rem' }}>
                  {searchQuery ? 'No collections found' : 'Start building your collections'}
                </h3>
                <p style={{ margin: '0 0 24px 0', fontSize: '1rem', opacity: 0.7 }}>
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
            <div style={{ flex: '1', minWidth: '300px' }}>
              <MD3Card style={{
                padding: '20px',
                background: actualTheme === 'dark' ? '#1e293b' : '#ffffff',
                position: 'sticky',
                top: '20px',
                maxHeight: '80vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{
                  marginBottom: '16px',
                  borderBottom: `1px solid ${actualTheme === 'dark' ? '#334155' : '#e5e7eb'}`,
                  paddingBottom: '12px'
                }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: actualTheme === 'dark' ? '#f1f5f9' : '#1f2937',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    📚 Select Books
                  </h3>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '0.875rem',
                    color: actualTheme === 'dark' ? '#94a3b8' : '#64748b'
                  }}>
                    Drag books to collections
                  </p>
                </div>
                
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                  gap: '12px',
                  padding: '4px'
                }}>
                  {console.log('🔥 Book Library Rendering - books.length:', books.length) || books.map(book => (
                    <div
                      key={book.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, book)}
                      style={{
                        position: 'relative',
                        aspectRatio: '2/3',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        cursor: 'grab',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        border: `2px solid transparent`,
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                      }}
                      title={`Drag "${book.title}" to a collection`}
                    >
                      {book.cover_url ? (
                        <img
                          src={book.cover_url}
                          alt={book.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            pointerEvents: 'none'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          backgroundColor: '#6750A4',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '10px',
                          textAlign: 'center',
                          padding: '4px',
                          fontWeight: '500'
                        }}>
                          {book.title.slice(0, 20)}...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {books.length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '32px 16px',
                    color: actualTheme === 'dark' ? '#94a3b8' : '#64748b'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>📚</div>
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>No books available</p>
                  </div>
                )}
              </MD3Card>
            </div>
          )}
        </div>
      </div>

      {/* Batch Mode Book Selection Panel */}
      {batchMode && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '400px',
          maxHeight: '70vh',
          background: actualTheme === 'dark' ? '#1e293b' : '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          border: `1px solid ${actualTheme === 'dark' ? '#334155' : '#e5e7eb'}`,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '20px',
            borderBottom: `1px solid ${actualTheme === 'dark' ? '#334155' : '#e5e7eb'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 'bold',
                color: actualTheme === 'dark' ? '#f1f5f9' : '#1f2937'
              }}>
                Select Books ({selectedBooks.size})
              </h3>
              <MD3Button
                variant="text"
                size="small"
                onClick={() => {
                  setSelectedBooks(new Set());
                  setBatchMode(false);
                }}
                style={{ minWidth: 'auto', padding: '4px 8px' }}
              >
                ✕
              </MD3Button>
            </div>
            <p style={{
              margin: '4px 0 0 0',
              fontSize: '12px',
              color: actualTheme === 'dark' ? '#94a3b8' : '#64748b'
            }}>
              Select books, then use Add buttons on collections
            </p>
          </div>
          
          <div style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
              gap: '12px'
            }}>
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
                  style={{
                    position: 'relative',
                    aspectRatio: '2/3',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: selectedBooks.has(book.id) ? '2px solid #6750A4' : '2px solid transparent',
                    transition: 'all 0.2s ease',
                    transform: selectedBooks.has(book.id) ? 'scale(1.05)' : 'scale(1)'
                  }}
                >
                  {book.cover_url ? (
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: '#6750A4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '10px',
                      textAlign: 'center',
                      padding: '4px'
                    }}>
                      {book.title.slice(0, 20)}...
                    </div>
                  )}
                  
                  {selectedBooks.has(book.id) && (
                    <div style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: '#6750A4',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)'
                    }}>
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
        <MD3Surface style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '16px 24px',
          borderRadius: '24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          backgroundColor: operationLoading ? 'rgba(103, 80, 164, 0.8)' : '#6750A4',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          zIndex: 1000,
          transition: 'all 0.3s ease'
        }}>
          {operationLoading ? (
            <>
              <MD3Progress variant="circular" size={20} style={{ color: 'white' }} />
              <span>Adding books...</span>
            </>
          ) : (
            <>
              <span>Selected: {selectedBooks.size} books</span>
              
              <select 
                onChange={(e) => {
                  if (e.target.value) {
                    handleBatchAddToCollection(e.target.value);
                    e.target.value = '';
                  }
                }}
                disabled={operationLoading || selectedBooks.size === 0}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  opacity: operationLoading ? 0.5 : 1,
                  cursor: operationLoading ? 'not-allowed' : 'pointer'
                }}
              >
                <option value="">Add to Collection...</option>
                {collections.map(collection => (
                  <option key={collection.id} value={collection.id} style={{ color: '#333' }}>
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
                style={{ 
                  color: 'white', 
                  minWidth: 'auto', 
                  padding: '8px',
                  opacity: operationLoading ? 0.5 : 1
                }}
              >
                Cancel
              </MD3Button>
            </>
          )}
        </MD3Surface>
      )}


      {/* Floating Action Button */}
      {!batchMode && (
        <MD3FloatingActionButton
          icon="➕"
          onClick={() => setIsCreating(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#6750A4'
          }}
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
          <div style={{ padding: '20px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              marginBottom: '24px',
              padding: '16px',
              backgroundColor: `${collectionDetailView.color}10`,
              borderRadius: '12px',
              border: `1px solid ${collectionDetailView.color}30`
            }}>
              <span style={{ fontSize: '32px' }}>{collectionDetailView.icon}</span>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', fontWeight: '600' }}>
                  {collectionDetailView.name}
                </h3>
                <p style={{ margin: 0, color: '#49454F', fontSize: '0.9rem' }}>
                  {collectionDetailView.description}
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
                  {getBooksForCollection(collectionDetailView).length} books
                </p>
              </div>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
              gap: '16px',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              {getBooksForCollection(collectionDetailView).map(book => (
                <div key={book.id} style={{
                  position: 'relative',
                  aspectRatio: '2/3',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  cursor: 'pointer'
                }}>
                  {book.cover_url ? (
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: collectionDetailView.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '12px',
                      textAlign: 'center',
                      padding: '8px'
                    }}>
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
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(244, 67, 54, 0.9)',
                      color: 'white',
                      border: 'none',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            
            {getBooksForCollection(collectionDetailView).length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📚</div>
                <p>No books in this collection yet</p>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              {!collectionDetailView.isDefault && (
                <MD3Button
                  variant="text"
                  onClick={() => {
                    setEditingCollection(collectionDetailView);
                    setCollectionDetailView(null);
                  }}
                  style={{ color: '#6750A4' }}
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
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
            
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#49454F', marginBottom: '8px', display: 'block' }}>
                Choose an icon
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {collectionIcons.map(icon => (
                  <button
                    key={icon}
                    onClick={() => setEditingCollection(prev => ({ ...prev, icon }))}
                    style={{
                      width: '48px',
                      height: '48px',
                      border: `2px solid ${editingCollection.icon === icon ? '#6750A4' : '#E7E0EC'}`,
                      borderRadius: '12px',
                      backgroundColor: editingCollection.icon === icon ? '#6750A420' : 'transparent',
                      fontSize: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#49454F', marginBottom: '8px', display: 'block' }}>
                Choose a color
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {collectionColors.map(color => (
                  <button
                    key={color}
                    onClick={() => setEditingCollection(prev => ({ ...prev, color }))}
                    style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: color,
                      border: `3px solid ${editingCollection.color === color ? '#1C1B1F' : 'transparent'}`,
                      borderRadius: '50%',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  />
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', marginTop: '20px' }}>
              <MD3Button
                variant="text"
                onClick={() => handleDeleteCollection(editingCollection.id)}
                style={{ color: '#F44336' }}
              >
                Delete Collection
              </MD3Button>
              
              <div style={{ display: 'flex', gap: '12px' }}>
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
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
          
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#49454F', marginBottom: '8px', display: 'block' }}>
              Choose an icon
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {collectionIcons.map(icon => (
                <button
                  key={icon}
                  onClick={() => setNewCollection(prev => ({ ...prev, icon }))}
                  style={{
                    width: '48px',
                    height: '48px',
                    border: `2px solid ${newCollection.icon === icon ? '#6750A4' : '#E7E0EC'}`,
                    borderRadius: '12px',
                    backgroundColor: newCollection.icon === icon ? '#6750A420' : 'transparent',
                    fontSize: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#49454F', marginBottom: '8px', display: 'block' }}>
              Choose a color
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {collectionColors.map(color => (
                <button
                  key={color}
                  onClick={() => setNewCollection(prev => ({ ...prev, color }))}
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: color,
                    border: `3px solid ${newCollection.color === color ? '#1C1B1F' : 'transparent'}`,
                    borderRadius: '50%',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                />
              ))}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
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
              style={{
                position: 'relative',
                minWidth: '140px'
              }}
            >
              {operationLoading ? (
                <>
                  <MD3Progress 
                    variant="circular" 
                    size={16} 
                    style={{ marginRight: '8px', color: 'white' }} 
                  />
                  Creating...
                </>
              ) : (
                'Create Collection'
              )}
            </MD3Button>
          </div>
        </div>
      </MD3Dialog>
    </MD3Surface>
  );
};

// Export utility functions
export const createDefaultCollections = (books = []) => {
  return [
    {
      id: '1',
      name: 'Favorites',
      description: 'Your most beloved books',
      color: '#F44336',
      icon: '❤️',
      bookIds: books.filter(b => b.favorite || b.rating >= 4).map(b => b.id),
      isDefault: true,
      createdAt: Date.now()
    },
    {
      id: '2',
      name: 'Want to Read',
      description: 'Books on your reading wishlist',
      color: '#4CAF50',
      icon: '📋',
      bookIds: books.filter(b => b.status === 'want_to_read' || (!b.isReading && !b.completed)).map(b => b.id),
      isDefault: true,
      createdAt: Date.now()
    },
    {
      id: '3',
      name: 'Completed',
      description: 'Books you\'ve finished reading',
      color: '#8BC34A',
      icon: '✅',
      bookIds: books.filter(b => b.completed || b.status === 'completed').map(b => b.id),
      isDefault: true,
      createdAt: Date.now()
    }
  ];
};

export const loadCollectionsFromStorage = () => {
  try {
    const saved = localStorage.getItem('bookCollections');
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Failed to load collections from storage:', error);
    return null;
  }
};

export const addBookToCollection = (collections, collectionId, bookId) => {
  return collections.map(collection => {
    if (collection.id === collectionId) {
      const newBookIds = [...new Set([...collection.bookIds, bookId])];
      return { ...collection, bookIds: newBookIds };
    }
    return collection;
  });
};

export const removeBookFromCollection = (collections, collectionId, bookId) => {
  return collections.map(collection => {
    if (collection.id === collectionId) {
      const newBookIds = collection.bookIds.filter(id => id !== bookId);
      return { ...collection, bookIds: newBookIds };
    }
    return collection;
  });
};

export const validateCollection = (collection, existingCollections = []) => {
  if (!collection.name || !collection.name.trim()) {
    return { isValid: false, error: 'Collection name is required' };
  }
  
  const nameExists = existingCollections.some(c => 
    c.name.toLowerCase() === collection.name.toLowerCase() && c.id !== collection.id
  );
  
  if (nameExists) {
    return { isValid: false, error: 'A collection with this name already exists' };
  }
  
  return { isValid: true };
};

export const COLLECTION_COLORS = [
  '#6750A4', '#7C4DFF', '#3F51B5', '#2196F3',
  '#00BCD4', '#009688', '#4CAF50', '#8BC34A',
  '#CDDC39', '#FFC107', '#FF9800', '#FF5722',
  '#F44336', '#E91E63', '#9C27B0', '#673AB7'
];

export default EnhancedCollectionsPage;