// src/components/Material3/MD3Snackbar.jsx
import React, { memo, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './MD3Snackbar.css';

const MD3Snackbar = memo(({
  open = false,
  message,
  action,
  onClose,
  autoHideDuration = 4000,
  variant = 'default',
  position = 'bottom-center',
  className = '',
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClose = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsAnimating(false);
      onClose?.();
    }, 200);
  }, [onClose]);

  // Auto-hide functionality
  useEffect(() => {
    if (open && autoHideDuration > 0) {
      const timer = setTimeout(handleClose, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [open, autoHideDuration, handleClose]);

  // Handle open/close animations
  useEffect(() => {
    if (open) {
      setIsVisible(true);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 50);
    } else if (isVisible) {
      handleClose();
    }
  }, [open, isVisible, handleClose]);

  if (!isVisible) return null;

  const snackbarClasses = [
    'md3-snackbar',
    `md3-snackbar--${variant}`,
    `md3-snackbar--${position}`,
    isAnimating && (open ? 'md3-snackbar--entering' : 'md3-snackbar--exiting'),
    className
  ].filter(Boolean).join(' ');

  const snackbarContent = (
    <div 
      className="md3-snackbar__container"
      role="presentation"
    >
      <div
        className={snackbarClasses}
        role="status"
        aria-live="polite"
        {...props}
      >
        <div className="md3-snackbar__content">
          <span className="md3-snackbar__message">
            {message}
          </span>
          
          {action && (
            <div className="md3-snackbar__action">
              {action}
            </div>
          )}
          
          <button
            type="button"
            className="md3-snackbar__close-button"
            onClick={handleClose}
            aria-label="Close"
          >
            <svg 
              className="md3-snackbar__close-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(snackbarContent, document.body);
});

MD3Snackbar.displayName = 'MD3Snackbar';

// Snackbar Hook for global management
export const useSnackbar = () => {
  const [snackbars, setSnackbars] = useState([]);

  const showSnackbar = useCallback((options) => {
    const id = Math.random().toString(36).substr(2, 9);
    const snackbar = {
      id,
      open: true,
      ...options
    };
    
    setSnackbars(prev => [...prev, snackbar]);
    
    return id;
  }, []);

  const hideSnackbar = useCallback((id) => {
    setSnackbars(prev => 
      prev.map(snackbar => 
        snackbar.id === id 
          ? { ...snackbar, open: false }
          : snackbar
      )
    );
    
    // Remove from array after animation
    setTimeout(() => {
      setSnackbars(prev => prev.filter(snackbar => snackbar.id !== id));
    }, 300);
  }, []);

  const hideAll = useCallback(() => {
    setSnackbars(prev => 
      prev.map(snackbar => ({ ...snackbar, open: false }))
    );
    
    setTimeout(() => {
      setSnackbars([]);
    }, 300);
  }, []);

  return {
    snackbars,
    showSnackbar,
    hideSnackbar,
    hideAll
  };
};

// Snackbar Provider Component
export const MD3SnackbarProvider = memo(({ children }) => {
  const { snackbars, hideSnackbar } = useSnackbar();

  return (
    <>
      {children}
      {snackbars.map(snackbar => (
        <MD3Snackbar
          key={snackbar.id}
          {...snackbar}
          onClose={() => hideSnackbar(snackbar.id)}
        />
      ))}
    </>
  );
});

MD3SnackbarProvider.displayName = 'MD3SnackbarProvider';

// Book-specific Snackbar variants
export const MD3BookSnackbar = memo(({
  type = 'success',
  bookTitle,
  action,
  onClose,
  ...props
}) => {
  const messages = {
    bookAdded: `"${bookTitle}" added to your library`,
    bookRemoved: `"${bookTitle}" removed from library`,
    bookmarkSaved: `Bookmark saved in "${bookTitle}"`,
    readingComplete: `Congratulations! You finished "${bookTitle}"`,
    syncSuccess: 'Reading progress synced across devices',
    downloadComplete: `"${bookTitle}" downloaded for offline reading`,
    uploadSuccess: `"${bookTitle}" uploaded successfully`,
    goalAchieved: 'Reading goal achieved! 🎉'
  };

  const variants = {
    success: 'success',
    error: 'error',
    warning: 'warning',
    info: 'default'
  };

  return (
    <MD3Snackbar
      message={messages[type] || bookTitle}
      variant={variants[type] || 'default'}
      action={action}
      onClose={onClose}
      {...props}
    />
  );
});

MD3BookSnackbar.displayName = 'MD3BookSnackbar';

// Progress Snackbar for uploads/downloads
export const MD3ProgressSnackbar = memo(({
  open,
  message,
  progress = 0,
  onCancel,
  onClose,
  ...props
}) => {
  const progressAction = onCancel ? (
    <button 
      type="button"
      className="md3-button md3-button--text md3-button--small"
      onClick={onCancel}
    >
      Cancel
    </button>
  ) : null;

  return (
    <MD3Snackbar
      open={open}
      message={
        <div className="md3-progress-snackbar__content">
          <span className="md3-progress-snackbar__message">{message}</span>
          <div className="md3-progress-snackbar__progress">
            <div 
              className="md3-progress-snackbar__progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="md3-progress-snackbar__percentage">
            {Math.round(progress)}%
          </span>
        </div>
      }
      action={progressAction}
      onClose={onClose}
      autoHideDuration={0} // Don't auto-hide progress snackbars
      variant="info"
      {...props}
    />
  );
});

MD3ProgressSnackbar.displayName = 'MD3ProgressSnackbar';

export default MD3Snackbar;