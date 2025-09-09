// src/components/GlobalSearchFAB.jsx - Floating Action Button for Global Search
import React from 'react';
import { Search } from 'lucide-react';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
import { useGlobalSearch } from '../hooks/useGlobalSearch';

const GlobalSearchFAB = ({ 
  className = '',
  position = 'bottom-left' // bottom-left, bottom-right
}) => {
  const { actualTheme } = useMaterial3Theme();
  const { openSearch } = useGlobalSearch();
  const isDark = actualTheme === 'dark';

  const positionStyles = {
    'bottom-left': { bottom: '90px', left: '24px' },
    'bottom-right': { bottom: '90px', right: '24px' }
  };

  return (
    <button
      onClick={openSearch}
      className={`global-search-fab ${className}`}
      title="Search everything (Ctrl+K)"
      style={{
        position: 'fixed',
        ...positionStyles[position],
        width: '56px',
        height: '56px',
        borderRadius: '16px',
        backgroundColor: isDark ? '#6366f1' : '#6750A4',
        color: 'white',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 6px 16px rgba(103, 80, 164, 0.3)',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 999,
        backdropFilter: 'blur(8px)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(103, 80, 164, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(103, 80, 164, 0.3)';
      }}
    >
      <Search size={24} />
    </button>
  );
};

export default GlobalSearchFAB;