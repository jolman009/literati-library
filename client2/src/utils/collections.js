// src/utils/collections.js
// Extracted collection utilities to avoid circular imports

export const createDefaultCollections = (books = []) => {
  const genres = [...new Set(books.map(book => book.genre).filter(Boolean))];

  const collections = [
    {
      id: 'favorites',
      name: 'Favorites',
      icon: '⭐',
      color: '#FFD700',
      description: 'Your favorite books',
      isDefault: true,
      books: books.filter(book => book.favorite).map(book => book.id)
    },
    {
      id: 'currently-reading',
      name: 'Currently Reading',
      icon: '📖',
      color: '#4CAF50',
      description: 'Books you are currently reading (synced with Dashboard)',
      isDefault: true,
      books: books.filter(book => book.status === 'reading' || book.is_reading).map(book => book.id)
    },
    {
      id: 'want-to-read',
      name: 'Want to Read',
      icon: '📋',
      color: '#FF9800',
      description: 'Books on your reading wishlist',
      isDefault: true,
      books: books.filter(book =>
        book.status === 'want_to_read' ||
        (!book.is_reading && !book.completed && !book.favorite)
      ).map(book => book.id)
    },
    {
      id: 'completed',
      name: 'Completed',
      icon: '✅',
      color: '#2196F3',
      description: 'Books you have finished reading',
      isDefault: true,
      books: books.filter(book => book.status === 'completed' || book.completed).map(book => book.id)
    }
  ];

  // Add genre-based collections
  genres.forEach(genre => {
    collections.push({
      id: `genre-${genre.toLowerCase().replace(/\s+/g, '-')}`,
      name: genre,
      icon: '📚',
      color: getGenreColor(genre),
      description: `All ${genre} books`,
      isDefault: false,
      books: books.filter(book => book.genre === genre).map(book => book.id)
    });
  });

  return collections;
};

export const loadCollectionsFromStorage = () => {
  try {
    const stored = localStorage.getItem('book_collections');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading collections from storage:', error);
    return [];
  }
};

// Migration function to clean up duplicate collections
export const migrateDuplicateCollections = () => {
  try {
    // Clear any potentially duplicate collections from both storage keys
    localStorage.removeItem('bookCollections'); // Old key
    localStorage.removeItem('book_collections'); // Current key
    console.log('✅ Collections storage cleared - duplicates removed');
  } catch (error) {
    console.error('Error during collection migration:', error);
  }
};

export const addBookToCollection = (collections, bookId, collectionId) => {
  return collections.map(collection => {
    if (collection.id === collectionId) {
      const books = collection.books || [];
      if (!books.includes(bookId)) {
        return { ...collection, books: [...books, bookId] };
      }
    }
    return collection;
  });
};

export const removeBookFromCollection = (collections, bookId, collectionId) => {
  return collections.map(collection => {
    if (collection.id === collectionId) {
      const books = collection.books || [];
      return { ...collection, books: books.filter(id => id !== bookId) };
    }
    return collection;
  });
};

export const validateCollection = (collection) => {
  const errors = [];
  
  if (!collection.name || collection.name.trim() === '') {
    errors.push('Collection name is required');
  }
  
  if (!collection.icon || collection.icon.trim() === '') {
    errors.push('Collection icon is required');
  }
  
  if (!collection.color || collection.color.trim() === '') {
    errors.push('Collection color is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const getGenreColor = (genre) => {
  const colors = {
    'Fiction': '#FF6B6B',
    'Non-Fiction': '#4ECDC4', 
    'Science Fiction': '#45B7D1',
    'Fantasy': '#96CEB4',
    'Mystery': '#FFEAA7',
    'Romance': '#FD79A8',
    'Psychology': '#E17055',
    'Biography': '#74B9FF',
    'History': '#A29BFE',
    'Science': '#6C5CE7',
    'Philosophy': '#FDCB6E',
    'Poetry': '#F8BBD9',
    'Drama': '#FF7675',
    'Adventure': '#00B894',
    'Horror': '#636E72',
    'Young Adult': '#E84393',
    'Children': '#00CEC9',
    'Self-Help': '#FDCB6E'
  };
  
  return colors[genre] || '#DDA0DD';
};