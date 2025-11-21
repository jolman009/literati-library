// src/hooks/useGlobalSearch.js - Global Search Hook with Keyboard Shortcuts
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const useGlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Open search dialog
  const openSearch = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Close search dialog
  const closeSearch = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Handle navigation to search results
  const navigateToResult = useCallback((result) => {
    switch (result.type) {
      case 'book':
        navigate(`/read/${result.id}`);
        break;
      case 'note':
        // Navigate to notes page with the specific note
        navigate('/library', { 
          state: { 
            page: 'notes', 
            highlightNote: result.id 
          }
        });
        break;
      case 'collection':
        // Navigate to collections page
        navigate('/library', { 
          state: { 
            page: 'collections', 
            highlightCollection: result.id 
          }
        });
        break;
      default:
        console.warn('Unknown result type:', result.type);
    }
    closeSearch();
  }, [navigate, closeSearch]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux) to open search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        openSearch();
      }

      // Forward slash (/) to open search (like GitHub)
      if (event.key === '/' && !event.target.matches('input, textarea, [contenteditable]')) {
        event.preventDefault();
        openSearch();
      }

      // Escape to close search
      if (event.key === 'Escape' && isOpen) {
        closeSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, openSearch, closeSearch]);

  return {
    isOpen,
    openSearch,
    closeSearch,
    navigateToResult
  };
};