// src/utils/csvExport.js
// CSV Export Utility for Book Library

/**
 * Export templates with predefined column sets
 */
export const EXPORT_TEMPLATES = {
  minimal: {
    name: 'Minimal',
    description: 'Basic book information only',
    columns: ['title', 'author', 'pages', 'status']
  },
  standard: {
    name: 'Standard',
    description: 'Common reading tracker columns',
    columns: ['title', 'author', 'pages', 'status', 'progress', 'currentPage', 'dateAdded', 'genre']
  },
  full: {
    name: 'Full Details',
    description: 'All available information',
    columns: ['title', 'author', 'pages', 'status', 'progress', 'currentPage', 'dateAdded',
              'genre', 'publisher', 'isbn', 'language', 'notesCount', 'dateCompleted']
  },
  goodreads: {
    name: 'Goodreads Compatible',
    description: 'Format compatible with Goodreads import',
    columns: ['title', 'author', 'isbn', 'pages', 'dateAdded', 'dateCompleted', 'rating', 'status']
  },
  spreadsheet: {
    name: 'Reading Tracker',
    description: 'Perfect for reading logs and trackers',
    columns: ['title', 'author', 'genre', 'pages', 'currentPage', 'progress', 'status',
              'dateAdded', 'dateCompleted', 'rating', 'notesCount']
  }
};

/**
 * Column definitions with professional headers
 */
const COLUMN_DEFINITIONS = {
  title: { header: 'Book Title', getter: (book) => book.title },
  author: { header: 'Author', getter: (book) => book.author },
  pages: { header: 'Total Pages', getter: (book) => book.pages || '' },
  status: {
    header: 'Reading Status',
    getter: (book) => {
      if (book.completed) return 'Completed';
      if (book.is_reading) return 'Currently Reading';
      return 'To Read';
    }
  },
  progress: {
    header: 'Progress (%)',
    getter: (book) => {
      if (book.completed) return 100;
      if (book.current_page && book.pages) {
        return Math.round((book.current_page / book.pages) * 100);
      }
      return 0;
    }
  },
  currentPage: { header: 'Current Page', getter: (book) => book.current_page || 0 },
  dateAdded: {
    header: 'Date Added',
    getter: (book) => book.created_at ? new Date(book.created_at).toLocaleDateString() : ''
  },
  dateCompleted: {
    header: 'Date Completed',
    getter: (book) => book.completed_at ? new Date(book.completed_at).toLocaleDateString() : ''
  },
  genre: { header: 'Genre', getter: (book) => book.genre || '' },
  publisher: { header: 'Publisher', getter: (book) => book.publisher || '' },
  isbn: { header: 'ISBN', getter: (book) => book.isbn || '' },
  language: { header: 'Language', getter: (book) => book.language || 'English' },
  notesCount: { header: 'Notes & Highlights', getter: (book) => book.notes_count || 0 },
  rating: { header: 'My Rating', getter: (book) => book.rating || '' }
};

/**
 * Converts an array of books to CSV format
 * @param {Array} books - Array of book objects
 * @param {Object} options - Export options
 * @returns {string} CSV formatted string
 */
export const convertBooksToCSV = (books, options = {}) => {
  const {
    template = 'standard',
    customColumns = null
  } = options;

  // Determine which columns to use
  let columnsToUse;
  if (customColumns && Array.isArray(customColumns)) {
    columnsToUse = customColumns;
  } else if (EXPORT_TEMPLATES[template]) {
    columnsToUse = EXPORT_TEMPLATES[template].columns;
  } else {
    columnsToUse = EXPORT_TEMPLATES.standard.columns;
  }

  // Build headers array
  const headers = columnsToUse
    .filter(col => COLUMN_DEFINITIONS[col])
    .map(col => COLUMN_DEFINITIONS[col].header);

  // Helper to escape CSV values
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  // Convert books to CSV rows using column definitions
  const rows = books.map(book => {
    const row = columnsToUse
      .filter(col => COLUMN_DEFINITIONS[col])
      .map(col => {
        const definition = COLUMN_DEFINITIONS[col];
        const value = definition.getter(book);
        return escapeCSV(value);
      });

    return row.join(',');
  });

  // Combine headers and rows
  return [headers.join(','), ...rows].join('\n');
};

/**
 * Downloads CSV data as a file
 * @param {string} csvContent - CSV formatted string
 * @param {string} filename - Name of the file to download
 */
export const downloadCSV = (csvContent, filename = 'library-export.csv') => {
  // Create blob with UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
};

/**
 * Export books to CSV with automatic download
 * @param {Array} books - Array of book objects to export
 * @param {Object} options - Export options
 * @param {string} options.template - Template name (minimal, standard, full, goodreads, spreadsheet)
 * @param {string} options.filename - Custom filename
 * @param {Array} options.customColumns - Custom column array
 */
export const exportBooksToCSV = (books, options = {}) => {
  const {
    template = 'spreadsheet', // Default to reading tracker template
    filename = `library-export-${new Date().toISOString().split('T')[0]}.csv`,
    customColumns = null
  } = options;

  if (!Array.isArray(books) || books.length === 0) {
    throw new Error('No books to export');
  }

  const csvContent = convertBooksToCSV(books, { template, customColumns });
  downloadCSV(csvContent, filename);

  return {
    success: true,
    count: books.length,
    filename,
    template
  };
};

/**
 * Get filter description for filename
 * @param {string} filter - Current filter (all, reading, completed, unread)
 * @returns {string} Filter name for filename
 */
export const getFilterName = (filter) => {
  const filterNames = {
    all: 'all-books',
    reading: 'currently-reading',
    completed: 'completed-books',
    unread: 'unread-books'
  };
  return filterNames[filter] || 'library';
};
