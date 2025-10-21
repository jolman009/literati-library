// src/components/GlobalSearch.jsx - Unified Search Across All Content
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  MD3TextField,
  MD3Card,
  MD3Chip,
  MD3Button,
  MD3IconButton
} from './Material3';
import { 
  Search, 
  X, 
  Book, 
  FileText, 
  FolderOpen,
  Clock,
  ArrowRight,
  Filter,
  BookOpen,
  Hash,
  Calendar
} from 'lucide-react';
import API from '../config/api';

const GlobalSearch = ({ 
  isOpen, 
  onClose, 
  onNavigateToResult,
  className = '' 
}) => {
  const { actualTheme } = useMaterial3Theme();
  const { user } = useAuth();
  const searchInputRef = useRef(null);
  
  // Search state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({
    books: [],
    notes: [],
    collections: [],
    total: 0
  });
  const [loading, setLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState(new Set(['books', 'notes', 'collections']));
  const [recentSearches, setRecentSearches] = useState([]);
  
  // Data sources
  const [books, setBooks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [collections, setCollections] = useState([]);

  // Load data when component mounts
  useEffect(() => {
    if (isOpen && user) {
      loadAllData();
      loadRecentSearches();
      
      // Focus search input when opened
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, user]);

  // Load all searchable data
  const loadAllData = async () => {
    try {
      const [booksResponse, notesResponse] = await Promise.all([
        API.get('/books', { params: { limit: 200, offset: 0 } }),
        API.get('/notes')
      ]);
      const br = booksResponse.data;
      const items = br?.items;
      setBooks(Array.isArray(br) ? br : (Array.isArray(items) ? items : (br.books || [])));
      setNotes(notesResponse.data || []);
      
      // Load collections from localStorage
      const savedCollections = localStorage.getItem('bookCollections');
      if (savedCollections) {
        setCollections(JSON.parse(savedCollections));
      }
    } catch (error) {
      console.error('Failed to load search data:', error);
    }
  };

  // Load recent searches from localStorage
  const loadRecentSearches = () => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  };

  // Save recent searches to localStorage
  const saveRecentSearch = (searchQuery) => {
    if (!searchQuery.trim() || searchQuery.length < 2) return;
    
    const newRecent = [
      searchQuery,
      ...recentSearches.filter(s => s !== searchQuery)
    ].slice(0, 10); // Keep only 10 recent searches
    
    setRecentSearches(newRecent);
    localStorage.setItem('recentSearches', JSON.stringify(newRecent));
  };

  // Advanced search with fuzzy matching and relevance scoring
  const performSearch = useCallback((searchQuery) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults({ books: [], notes: [], collections: [], total: 0 });
      return;
    }

    setLoading(true);
    
    const query = searchQuery.toLowerCase();
    const queryWords = query.split(/\s+/).filter(word => word.length > 1);
    
    // Enhanced scoring function
    const calculateRelevance = (text, title = '', metadata = {}) => {
      if (!text) return 0;
      
      const textLower = text.toLowerCase();
      const titleLower = title.toLowerCase();
      
      let score = 0;
      
      // Exact matches get highest score
      if (titleLower.includes(query)) score += 100;
      if (textLower.includes(query)) score += 50;
      
      // Word matches
      queryWords.forEach(word => {
        if (titleLower.includes(word)) score += 20;
        if (textLower.includes(word)) score += 10;
        
        // Partial word matches
        const titleWords = titleLower.split(/\s+/);
        const textWords = textLower.split(/\s+/);
        
        titleWords.forEach(titleWord => {
          if (titleWord.includes(word) || word.includes(titleWord)) score += 5;
        });
        
        textWords.forEach(textWord => {
          if (textWord.includes(word) || word.includes(textWord)) score += 2;
        });
      });
      
      // Boost for metadata matches (author, genre, tags)
      Object.values(metadata).forEach(value => {
        if (value && typeof value === 'string' && value.toLowerCase().includes(query)) {
          score += 15;
        }
      });
      
      return score;
    };

    // Search books
    const bookResults = books
      .map(book => {
        const relevance = calculateRelevance(
          `${book.title} ${book.author} ${book.description || ''} ${book.genre || ''}`,
          book.title,
          { author: book.author, genre: book.genre }
        );
        
        return { ...book, type: 'book', relevance };
      })
      .filter(book => book.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance);

    // Search notes
    const noteResults = notes
      .map(note => {
        const relevance = calculateRelevance(
          `${note.title} ${note.content} ${(note.tags || []).join(' ')}`,
          note.title,
          { tags: (note.tags || []).join(' ') }
        );
        
        return { ...note, type: 'note', relevance };
      })
      .filter(note => note.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance);

    // Search collections
    const collectionResults = collections
      .map(collection => {
        const relevance = calculateRelevance(
          `${collection.name} ${collection.description}`,
          collection.name
        );
        
        return { ...collection, type: 'collection', relevance };
      })
      .filter(collection => collection.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance);

    setResults({
      books: bookResults.slice(0, 20),
      notes: noteResults.slice(0, 20),
      collections: collectionResults.slice(0, 10),
      total: bookResults.length + noteResults.length + collectionResults.length
    });
    
    setLoading(false);
    saveRecentSearch(searchQuery);
  }, [books, notes, collections, recentSearches]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, performSearch]);

  // Filter results based on active filters
  const filteredResults = useMemo(() => {
    return {
      books: activeFilters.has('books') ? results.books : [],
      notes: activeFilters.has('notes') ? results.notes : [],
      collections: activeFilters.has('collections') ? results.collections : [],
      total: (activeFilters.has('books') ? results.books.length : 0) +
             (activeFilters.has('notes') ? results.notes.length : 0) +
             (activeFilters.has('collections') ? results.collections.length : 0)
    };
  }, [results, activeFilters]);

  // Handle result click
  const handleResultClick = (result) => {
    if (onNavigateToResult) {
      onNavigateToResult(result);
    }
    onClose();
  };

  // Handle filter toggle
  const toggleFilter = (filterType) => {
    const newFilters = new Set(activeFilters);
    if (newFilters.has(filterType)) {
      newFilters.delete(filterType);
    } else {
      newFilters.add(filterType);
    }
    setActiveFilters(newFilters);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isDark = actualTheme === 'dark';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '10vh 16px 16px'
    }}>
      <MD3Card 
        variant="elevated" 
        className={className}
        style={{
          width: '100%',
          maxWidth: '700px',
          maxHeight: '80vh',
          overflowY: 'auto',
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          border: `1px solid ${isDark ? '#475569' : '#e5e7eb'}`
        }}
      >
        {/* Search Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: `1px solid ${isDark ? '#475569' : '#e5e7eb'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Search size={20} style={{ color: isDark ? '#94a3b8' : '#6b7280' }} />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search books, notes, collections..."
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '18px',
                fontWeight: '500',
                backgroundColor: 'transparent',
                color: isDark ? '#f1f5f9' : '#1f2937'
              }}
            />
            <MD3IconButton
              icon={<X size={20} />}
              onClick={onClose}
              style={{ 
                color: isDark ? '#94a3b8' : '#6b7280',
                '&:hover': { backgroundColor: isDark ? '#374151' : '#f3f4f6' }
              }}
            />
          </div>

          {/* Filter Chips */}
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            marginTop: '16px',
            flexWrap: 'wrap'
          }}>
            {[
              { key: 'books', label: 'Books', icon: <Book size={14} />, count: results.books.length },
              { key: 'notes', label: 'Notes', icon: <FileText size={14} />, count: results.notes.length },
              { key: 'collections', label: 'Collections', icon: <FolderOpen size={14} />, count: results.collections.length }
            ].map(filter => (
              <MD3Chip
                key={filter.key}
                label={`${filter.label} ${filter.count > 0 ? `(${filter.count})` : ''}`}
                icon={filter.icon}
                selected={activeFilters.has(filter.key)}
                onClick={() => toggleFilter(filter.key)}
                size="small"
                style={{
                  backgroundColor: activeFilters.has(filter.key) 
                    ? (isDark ? '#6366f1' : '#6750A4')
                    : (isDark ? '#374151' : '#f3f4f6'),
                  color: activeFilters.has(filter.key) 
                    ? 'white' 
                    : (isDark ? '#f1f5f9' : '#374151')
                }}
              />
            ))}
          </div>

          {filteredResults.total > 0 && (
            <div style={{
              marginTop: '12px',
              fontSize: '14px',
              color: isDark ? '#94a3b8' : '#6b7280'
            }}>
              {filteredResults.total} result{filteredResults.total !== 1 ? 's' : ''} found
            </div>
          )}
        </div>

        {/* Search Results */}
        <div style={{ padding: '16px' }}>
          {loading && (
            <div style={{
              textAlign: 'center',
              padding: '32px',
              color: isDark ? '#94a3b8' : '#6b7280'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                border: `3px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                borderTopColor: '#6750A4',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 12px'
              }} />
              Searching...
            </div>
          )}

          {!loading && query.length < 2 && (
            <div>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{
                    margin: '0 0 12px 0',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: isDark ? '#f1f5f9' : '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Clock size={16} />
                    Recent Searches
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {recentSearches.slice(0, 5).map((search, index) => (
                      <MD3Chip
                        key={index}
                        label={search}
                        size="small"
                        onClick={() => setQuery(search)}
                        style={{
                          backgroundColor: isDark ? '#374151' : '#f3f4f6',
                          color: isDark ? '#f1f5f9' : '#374151',
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Search Tips */}
              <div style={{
                padding: '20px',
                backgroundColor: isDark ? '#374151' : '#f8fafc',
                borderRadius: '12px',
                color: isDark ? '#94a3b8' : '#64748b'
              }}>
                <h4 style={{
                  margin: '0 0 8px 0',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: isDark ? '#f1f5f9' : '#374151'
                }}>
                  Search Tips
                </h4>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px' }}>
                  <li>Search by title, author, content, or tags</li>
                  <li>Use multiple words for more precise results</li>
                  <li>Filter results by type using the chips above</li>
                </ul>
              </div>
            </div>
          )}

          {!loading && query.length >= 2 && filteredResults.total === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '32px',
              color: isDark ? '#94a3b8' : '#6b7280'
            }}>
              <Search size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
              <h3 style={{
                margin: '0 0 8px 0',
                fontSize: '18px',
                fontWeight: '600',
                color: isDark ? '#f1f5f9' : '#374151'
              }}>
                No results found
              </h3>
              <p style={{ margin: 0, fontSize: '14px' }}>
                Try adjusting your search terms or filters
              </p>
            </div>
          )}

          {/* Results Sections */}
          {!loading && filteredResults.total > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Books */}
              {filteredResults.books.length > 0 && (
                <ResultSection
                  title="Books"
                  icon={<Book size={16} />}
                  results={filteredResults.books}
                  onResultClick={handleResultClick}
                  isDark={isDark}
                  renderResult={(book) => (
                    <BookResult key={book.id} book={book} query={query} />
                  )}
                />
              )}

              {/* Notes */}
              {filteredResults.notes.length > 0 && (
                <ResultSection
                  title="Notes"
                  icon={<FileText size={16} />}
                  results={filteredResults.notes}
                  onResultClick={handleResultClick}
                  isDark={isDark}
                  renderResult={(note) => (
                    <NoteResult key={note.id} note={note} query={query} books={books} />
                  )}
                />
              )}

              {/* Collections */}
              {filteredResults.collections.length > 0 && (
                <ResultSection
                  title="Collections"
                  icon={<FolderOpen size={16} />}
                  results={filteredResults.collections}
                  onResultClick={handleResultClick}
                  isDark={isDark}
                  renderResult={(collection) => (
                    <CollectionResult key={collection.id} collection={collection} query={query} />
                  )}
                />
              )}
            </div>
          )}
        </div>
      </MD3Card>
    </div>
  );
};

// Result Section Component
const ResultSection = ({ title, icon, results, onResultClick, isDark, renderResult }) => (
  <div>
    <h3 style={{
      margin: '0 0 12px 0',
      fontSize: '16px',
      fontWeight: '600',
      color: isDark ? '#f1f5f9' : '#374151',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      {icon}
      {title} ({results.length})
    </h3>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {results.map(result => (
        <div
          key={`${result.type}-${result.id}`}
          onClick={() => onResultClick(result)}
          style={{
            padding: '12px',
            backgroundColor: isDark ? '#334155' : '#f8fafc',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? '#475569' : '#f1f5f9';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#f8fafc';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {renderResult(result)}
        </div>
      ))}
    </div>
  </div>
);

// Individual result components
const BookResult = ({ book, query }) => {
  const { actualTheme } = useMaterial3Theme();
  const isDark = actualTheme === 'dark';
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{
        width: '40px',
        height: '56px',
        backgroundColor: '#6750A4',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '12px',
        fontWeight: '600',
        flexShrink: 0
      }}>
        <Book size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{
          margin: '0 0 4px 0',
          fontSize: '14px',
          fontWeight: '600',
          color: isDark ? '#f1f5f9' : '#1f2937',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {book.title}
        </h4>
        <p style={{
          margin: '0 0 4px 0',
          fontSize: '12px',
          color: isDark ? '#94a3b8' : '#6b7280'
        }}>
          {book.author}
        </p>
        {book.genre && (
          <span style={{
            fontSize: '11px',
            padding: '2px 8px',
            backgroundColor: isDark ? '#475569' : '#e5e7eb',
            color: isDark ? '#f1f5f9' : '#374151',
            borderRadius: '12px'
          }}>
            {book.genre}
          </span>
        )}
      </div>
      <ArrowRight size={16} style={{ color: isDark ? '#64748b' : '#9ca3af' }} />
    </div>
  );
};

const NoteResult = ({ note, query, books }) => {
  const { actualTheme } = useMaterial3Theme();
  const isDark = actualTheme === 'dark';
  const book = books.find(b => b.id === note.book_id);
  
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
      <div style={{
        width: '32px',
        height: '32px',
        backgroundColor: '#2196F3',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        flexShrink: 0
      }}>
        <FileText size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{
          margin: '0 0 4px 0',
          fontSize: '14px',
          fontWeight: '600',
          color: isDark ? '#f1f5f9' : '#1f2937',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {note.title}
        </h4>
        <p style={{
          margin: '0 0 8px 0',
          fontSize: '12px',
          color: isDark ? '#94a3b8' : '#6b7280',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical'
        }}>
          {note.content}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
          {book && (
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: isDark ? '#a78bfa' : '#6750A4'
            }}>
              <BookOpen size={12} />
              {book.title}
            </span>
          )}
          <span style={{ color: isDark ? '#64748b' : '#9ca3af' }}>
            <Calendar size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            {new Date(note.created_at).toLocaleDateString()}
          </span>
        </div>
        {note.tags && note.tags.length > 0 && (
          <div style={{ marginTop: '4px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {note.tags.slice(0, 3).map((tag, index) => (
              <span key={index} style={{
                fontSize: '10px',
                padding: '2px 6px',
                backgroundColor: isDark ? '#475569' : '#e5e7eb',
                color: isDark ? '#f1f5f9' : '#374151',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}>
                <Hash size={8} />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <ArrowRight size={16} style={{ color: isDark ? '#64748b' : '#9ca3af' }} />
    </div>
  );
};

const CollectionResult = ({ collection, query }) => {
  const { actualTheme } = useMaterial3Theme();
  const isDark = actualTheme === 'dark';
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{
        width: '32px',
        height: '32px',
        backgroundColor: collection.color || '#4CAF50',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        flexShrink: 0
      }}>
        {collection.icon || '📁'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{
          margin: '0 0 4px 0',
          fontSize: '14px',
          fontWeight: '600',
          color: isDark ? '#f1f5f9' : '#1f2937',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {collection.name}
        </h4>
        <p style={{
          margin: '0 0 4px 0',
          fontSize: '12px',
          color: isDark ? '#94a3b8' : '#6b7280',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {collection.description}
        </p>
        <span style={{
          fontSize: '11px',
          color: isDark ? '#64748b' : '#9ca3af'
        }}>
          {collection.bookIds?.length || 0} books
        </span>
      </div>
      <ArrowRight size={16} style={{ color: isDark ? '#64748b' : '#9ca3af' }} />
    </div>
  );
};

export default GlobalSearch;
