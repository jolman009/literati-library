// Fixed BookStatus.jsx with proper exports for EnhancedBookLibraryApp integration
import React, { useState } from 'react';

// Icons (you can replace these with your preferred icon library)
const BookIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
  </svg>
);

const CheckCircle = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
);

const PlayCircle = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z"/>
  </svg>
);

const Pause = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
  </svg>
);

const ChevronDown = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
  </svg>
);

// Book status configuration
const BOOK_STATUSES = {
  unread: {
    label: 'Unread',
    icon: BookIcon,
    color: 'bg-surface-container text-on-surface-variant',
    md3Color: 'bg-gray-100 text-gray-700',
    surfaceColor: 'bg-gray-50',
    activeColor: 'text-outline'
  },
  reading: {
    label: 'Reading',
    icon: PlayCircle,
    color: 'bg-primary-container text-on-primary-container',
    md3Color: 'bg-blue-100 text-blue-800',
    surfaceColor: 'bg-blue-50',
    activeColor: 'text-primary'
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    color: 'bg-tertiary-container text-on-tertiary-container',
    md3Color: 'bg-green-100 text-green-800',
    surfaceColor: 'bg-green-50',
    activeColor: 'text-tertiary'
  },
  paused: {
    label: 'Paused',
    icon: Pause,
    color: 'bg-secondary-container text-on-secondary-container',
    md3Color: 'bg-amber-100 text-amber-800',
    surfaceColor: 'bg-amber-50',
    activeColor: 'text-secondary'
  }
};

// EXPORTED: Get current book status function
export const getBookStatus = (book) => {
  if (book.completed) return 'completed';

 // Check both is_reading flag AND status text
  if (book.is_reading || 
      book.status === 'reading' || 
      book.status === 'Started Reading' ||
      book.status === 'in_progress') {
    return 'reading';
  }
  
  if (book.progress > 0) return 'paused';
  return 'unread';
};

// EXPORTED: Material 3 Book Status Badge Component
export const BookStatusBadge = ({ book, size = 'sm' }) => {
  const status = getBookStatus(book);
  const config = BOOK_STATUSES[status];
  const Icon = config.icon;

  const sizeClasses = {
    xs: 'px-2 py-1 text-xs h-6',
    sm: 'px-3 py-1.5 text-sm h-8',
    md: 'px-4 py-2 text-base h-10'
  };

  return (
    <div className={`inline-flex items-center gap-2 rounded-full font-medium transition-all duration-200 ${config.md3Color} ${sizeClasses[size]}`}>
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
    </div>
  );
};

// EXPORTED: Material 3 Book Status Dropdown Component
export const BookStatusDropdown = ({ book, onStatusChange, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const currentStatus = getBookStatus(book);

  const handleStatusChange = async (newStatus) => {
    if (newStatus === currentStatus || isUpdating) return;

    setIsUpdating(true);
    
    setTimeout(() => {
      console.log(`Status changed from ${currentStatus} to ${newStatus} for "${book.title}"`);
      
      const updatedBook = { ...book };
      switch (newStatus) {
        case 'reading':
          updatedBook.is_reading = true;
          updatedBook.completed = false;
          break;
        case 'completed':
          updatedBook.is_reading = false;
          updatedBook.completed = true;
          updatedBook.progress = 100;
          break;
        case 'paused':
          updatedBook.is_reading = false;
          updatedBook.completed = false;
          break;
        case 'unread':
          updatedBook.is_reading = false;
          updatedBook.completed = false;
          updatedBook.progress = 0;
          break;
      }

      if (onStatusChange) {
        onStatusChange(updatedBook);
      }
      
      setIsUpdating(false);
      setIsOpen(false);
    }, 600);
  };

  const currentConfig = BOOK_STATUSES[currentStatus];
  const buttonClasses = `inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 min-w-[160px] justify-between border-2 ${currentConfig.md3Color} hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`;
  const disabledClasses = isUpdating ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]';

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className={`${buttonClasses} ${disabledClasses}`}
      >
        <div className="flex items-center gap-2">
          <currentConfig.icon className="w-4 h-4" />
          <span>{isUpdating ? 'Updating...' : currentConfig.label}</span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-lg border border-gray-200 z-20 min-w-[200px] overflow-hidden">
            {Object.entries(BOOK_STATUSES).map(([status, config]) => {
              const Icon = config.icon;
              const isCurrentStatus = status === currentStatus;
              
              const itemClasses = `w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 ${
                isCurrentStatus 
                  ? 'bg-blue-50 text-blue-700 font-semibold' 
                  : 'hover:bg-gray-50 text-gray-700'
              }`;
              
              return (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={itemClasses}
                  disabled={isCurrentStatus || isUpdating}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{config.label}</span>
                  {isCurrentStatus && (
                    <CheckCircle className="w-4 h-4 ml-auto text-blue-600" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

// EXPORTED: Quick Status Actions Component
export const QuickStatusActions = ({ book, onStatusChange, className = "" }) => {
  const currentStatus = getBookStatus(book);

  const handleQuickAction = (newStatus) => {
    const updatedBook = { ...book };
    
    switch (newStatus) {
      case 'reading':
        updatedBook.is_reading = true;
        updatedBook.completed = false;
        break;
      case 'completed':
        updatedBook.is_reading = false;
        updatedBook.completed = true;
        updatedBook.progress = 100;
        break;
      case 'paused':
        updatedBook.is_reading = false;
        updatedBook.completed = false;
        break;
      case 'unread':
        updatedBook.is_reading = false;
        updatedBook.completed = false;
        updatedBook.progress = 0;
        break;
    }
    
    if (onStatusChange) {
      onStatusChange(updatedBook);
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      {currentStatus !== 'reading' && (
        <button
          onClick={() => handleQuickAction('reading')}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors text-blue-700 text-sm font-medium disabled:opacity-50 hover:shadow-md"
        >
          <PlayCircle className="w-4 h-4" />
          Start Reading
        </button>
      )}
      
      {currentStatus !== 'completed' && (
        <button
          onClick={() => handleQuickAction('completed')}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 transition-colors text-green-700 text-sm font-medium disabled:opacity-50 hover:shadow-md"
        >
          <CheckCircle className="w-4 h-4" />
          Mark Complete
        </button>
      )}
    </div>
  );
};

// EXPORTED: Reading Stats Summary Component
export const ReadingStatsSummary = ({ books = [] }) => {
  const stats = {
    total: books.length,
    reading: books.filter(b => getBookStatus(b) === 'reading').length,
    completed: books.filter(b => getBookStatus(b) === 'completed').length,
    unread: books.filter(b => getBookStatus(b) === 'unread').length,
    paused: books.filter(b => getBookStatus(b) === 'paused').length
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50 rounded-3xl">
      {Object.entries(BOOK_STATUSES).map(([status, config]) => {
        const Icon = config.icon;
        const count = stats[status];
        
        return (
          <div key={status} className="text-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3 ${config.md3Color} shadow-sm`}>
              <Icon className="w-7 h-7" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{count}</div>
            <div className="text-sm text-gray-600 font-medium">{config.label}</div>
          </div>
        );
      })}
    </div>
  );
};

// Default export for backward compatibility
export default BookStatusDropdown;

// Additional exports for easy access
export { BOOK_STATUSES };