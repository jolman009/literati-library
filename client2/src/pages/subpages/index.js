// src/components/Collections/index.js

// Main Collections Component
export { default as EnhancedCollectionsPage } from './EnhancedCollectionsPage';
export { default as CollectionsPage } from './EnhancedCollectionsPage'; // Alias for backward compatibility

// Collection-related utilities and constants
export const COLLECTION_COLORS = [
  '#6750A4', '#7C4DFF', '#3F51B5', '#2196F3',
  '#00BCD4', '#009688', '#4CAF50', '#8BC34A',
  '#CDDC39', '#FFC107', '#FF9800', '#FF5722',
  '#F44336', '#E91E63', '#9C27B0', '#673AB7'
];

export const COLLECTION_ICONS = [
  '📚', '📖', '📝', '🎓', '💼', '🌟', '❤️', '🔥',
  '⭐', '📋', '🎯', '🚀', '💎', '🏆', '📊', '🎨'
];

// Collection utility functions
export const createDefaultCollections = (books = []) => {
  const timestamp = Date.now();
  
  return [
    {
      id: 'favorites',
      name: 'Favorites',
      description: 'Your most beloved books',
      color: '#F44336',
      icon: '❤️',
      bookIds: books.filter(b => b.favorite || b.rating >= 4).map(b => b.id),
      isDefault: true,
      createdAt: timestamp
    },
    {
      id: 'want-to-read',
      name: 'Want to Read',
      description: 'Books on your reading wishlist',
      color: '#4CAF50',
      icon: '📋',
      bookIds: books.filter(b => 
        b.status === 'want_to_read' || 
        (!b.isReading && !b.completed && b.status !== 'completed')
      ).map(b => b.id),
      isDefault: true,
      createdAt: timestamp
    },
    {
      id: 'currently-reading',
      name: 'Currently Reading',
      description: 'Books you\'re actively reading',
      color: '#2196F3',
      icon: '📖',
      bookIds: books.filter(b => 
        b.isReading || 
        b.status === 'reading'
      ).map(b => b.id),
      isDefault: true,
      createdAt: timestamp
    },
    {
      id: 'completed',
      name: 'Completed',
      description: 'Books you\'ve finished reading',
      color: '#8BC34A',
      icon: '✅',
      bookIds: books.filter(b => 
        b.completed || 
        b.status === 'completed'
      ).map(b => b.id),
      isDefault: true,
      createdAt: timestamp
    }
  ];
};

// Collection management utilities
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

export const addBooksToCollection = (collections, collectionId, bookIds) => {
  return collections.map(collection => {
    if (collection.id === collectionId) {
      const newBookIds = [...new Set([...collection.bookIds, ...bookIds])];
      return { ...collection, bookIds: newBookIds };
    }
    return collection;
  });
};

export const removeBooksFromCollection = (collections, collectionId, bookIds) => {
  return collections.map(collection => {
    if (collection.id === collectionId) {
      const newBookIds = collection.bookIds.filter(id => !bookIds.includes(id));
      return { ...collection, bookIds: newBookIds };
    }
    return collection;
  });
};

export const updateCollection = (collections, collectionId, updates) => {
  return collections.map(collection => {
    if (collection.id === collectionId) {
      return { ...collection, ...updates };
    }
    return collection;
  });
};

export const deleteCollection = (collections, collectionId) => {
  return collections.filter(collection => collection.id !== collectionId);
};

// Collection search and filter utilities
export const filterCollections = (collections, searchQuery) => {
  if (!searchQuery.trim()) return collections;
  
  const query = searchQuery.toLowerCase();
  return collections.filter(collection =>
    collection.name.toLowerCase().includes(query) ||
    collection.description.toLowerCase().includes(query)
  );
};

export const sortCollections = (collections, sortBy = 'name') => {
  const sorted = [...collections];
  
  switch (sortBy) {
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'bookCount':
      return sorted.sort((a, b) => b.bookIds.length - a.bookIds.length);
    case 'created':
      return sorted.sort((a, b) => b.createdAt - a.createdAt);
    case 'updated':
      return sorted.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
    default:
      return sorted;
  }
};

// Collection validation utilities
export const validateCollectionName = (name, existingCollections = [], currentId = null) => {
  if (!name || !name.trim()) {
    return { isValid: false, error: 'Collection name is required' };
  }
  
  if (name.trim().length < 2) {
    return { isValid: false, error: 'Collection name must be at least 2 characters' };
  }
  
  if (name.trim().length > 50) {
    return { isValid: false, error: 'Collection name must be less than 50 characters' };
  }
  
  const isDuplicate = existingCollections.some(collection => 
    collection.name.toLowerCase() === name.trim().toLowerCase() && 
    collection.id !== currentId
  );
  
  if (isDuplicate) {
    return { isValid: false, error: 'A collection with this name already exists' };
  }
  
  return { isValid: true, error: null };
};

export const validateCollection = (collection, existingCollections = []) => {
  const nameValidation = validateCollectionName(
    collection.name, 
    existingCollections, 
    collection.id
  );
  
  if (!nameValidation.isValid) {
    return nameValidation;
  }
  
  if (collection.description && collection.description.length > 200) {
    return { isValid: false, error: 'Description must be less than 200 characters' };
  }
  
  if (!COLLECTION_COLORS.includes(collection.color)) {
    return { isValid: false, error: 'Invalid collection color' };
  }
  
  if (!COLLECTION_ICONS.includes(collection.icon)) {
    return { isValid: false, error: 'Invalid collection icon' };
  }
  
  return { isValid: true, error: null };
};

// Collection statistics utilities
export const getCollectionStats = (collections, books) => {
  const totalCollections = collections.length;
  const customCollections = collections.filter(c => !c.isDefault).length;
  const totalBooksInCollections = new Set(
    collections.flatMap(c => c.bookIds)
  ).size;
  const averageBooksPerCollection = totalCollections > 0 
    ? Math.round(totalBooksInCollections / totalCollections) 
    : 0;
  
  const largestCollection = collections.reduce((largest, current) => 
    current.bookIds.length > largest.bookIds.length ? current : largest,
    { bookIds: [] }
  );
  
  return {
    totalCollections,
    customCollections,
    totalBooksInCollections,
    averageBooksPerCollection,
    largestCollection: largestCollection.bookIds.length > 0 ? largestCollection : null,
    uncategorizedBooks: books.length - totalBooksInCollections
  };
};

// Collection export/import utilities
export const exportCollections = (collections) => {
  const exportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    collections: collections.map(collection => ({
      ...collection,
      // Don't export book IDs as they might not be valid in other systems
      bookCount: collection.bookIds.length
    }))
  };
  
  return JSON.stringify(exportData, null, 2);
};

export const importCollections = (importData, existingCollections = []) => {
  try {
    const data = typeof importData === 'string' ? JSON.parse(importData) : importData;
    
    if (!data.collections || !Array.isArray(data.collections)) {
      throw new Error('Invalid import format');
    }
    
    const importedCollections = data.collections.map(collection => ({
      ...collection,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      bookIds: [], // Reset book IDs on import
      isDefault: false,
      createdAt: Date.now(),
      imported: true
    }));
    
    return [...existingCollections, ...importedCollections];
  } catch (error) {
    throw new Error('Failed to import collections: ' + error.message);
  }
};

// Collection localStorage utilities
export const saveCollectionsToStorage = (collections) => {
  try {
    localStorage.setItem('shelfquest_collections', JSON.stringify(collections));
    return true;
  } catch (error) {
    console.error('Failed to save collections to localStorage:', error);
    return false;
  }
};

export const loadCollectionsFromStorage = () => {
  try {
    const stored = localStorage.getItem('shelfquest_collections');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load collections from localStorage:', error);
    return null;
  }
};

export const clearCollectionsFromStorage = () => {
  try {
    localStorage.removeItem('shelfquest_collections');
    return true;
  } catch (error) {
    console.error('Failed to clear collections from localStorage:', error);
    return false;
  }
};

// Collection migration utilities (for upgrading from older versions)
export const migrateCollections = (oldCollections) => {
  if (!Array.isArray(oldCollections)) return [];
  
  return oldCollections.map(collection => ({
    id: collection.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name: collection.name || 'Untitled Collection',
    description: collection.description || '',
    color: COLLECTION_COLORS.includes(collection.color) ? collection.color : COLLECTION_COLORS[0],
    icon: COLLECTION_ICONS.includes(collection.icon) ? collection.icon : COLLECTION_ICONS[0],
    bookIds: Array.isArray(collection.bookIds) ? collection.bookIds : 
             Array.isArray(collection.books) ? collection.books.map(b => b.id) : [],
    isDefault: Boolean(collection.isDefault),
    createdAt: collection.createdAt || Date.now(),
    updatedAt: collection.updatedAt,
    migrated: true
  }));
};

// Default export for main component
export default EnhancedCollectionsPage;