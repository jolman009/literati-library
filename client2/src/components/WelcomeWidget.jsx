// Dashboard-Compatible Welcome Widget
// File: src/components/WelcomeWidget.jsx

import React, { useState } from 'react';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
const WelcomeWidget = ({ 
  user, 
  books = [], 
  currentPage = 'library',
  onNavigate,
  analytics = {},
  viewMode = 'grid',
  onViewModeChange,
  ...props 
}) => {
  const [activeNavItem, setActiveNavItem] = useState(currentPage);
  const { actualTheme } = useMaterial3Theme();

  // Calculate stats from books (with safety check)
  const booksArray = Array.isArray(books) ? books : [];
  const totalBooks = booksArray.length;
  const currentlyReading = booksArray.filter(book => book.is_reading).length;

  // Navigation items for the horizontal navigation
  const navigationItems = [
    { 
      id: 'library', 
      label: 'Library', 
      icon: '📚', 
      count: totalBooks,
      description: 'Browse all books'
    },
    { 
      id: 'reading', 
      label: 'Reading', 
      icon: '📖', 
      count: currentlyReading,
      description: 'Active reading sessions'
    },
    { 
      id: 'stats', 
      label: 'Statistics', 
      icon: '📊', 
      description: 'Reading analytics'
    },
    { 
      id: 'collections', 
      label: 'Collections', 
      icon: '📁', 
      count: analytics.collections || 0,
      description: 'Organized book lists'
    },
    { 
      id: 'notes', 
      label: 'Notes', 
      icon: '📝', 
      count: analytics.notes || 0,
      description: 'Reading notes & highlights'
    }
  ];

  // Handle navigation item click
  const handleNavigationClick = (itemId) => {
    setActiveNavItem(itemId);
    onNavigate?.(itemId);
  };

  return (
    <div style={{
      background: actualTheme === 'dark' 
        ? 'linear-gradient(135deg, #1e3a8a, #312e81)'
        : 'linear-gradient(135deg, #667eea, #764ba2)',
      borderRadius: '16px',
      padding: '24px 32px',
      color: 'white',
      marginBottom: '32px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
      position: 'relative'
    }}>
      {/* Grid/List Toggle - Top Right */}
      {currentPage === 'library' && onViewModeChange && (
        <div style={{
          position: 'absolute',
          top: '24px',
          right: '32px',
          display: 'flex',
          gap: '0',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          padding: '2px'
        }}>
          <button
            onClick={() => onViewModeChange('grid')}
            style={{
              padding: '8px 16px',
              background: viewMode === 'grid' ? 'rgba(255, 255, 255, 0.3)' : 'transparent',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Grid view"
          >
            <span>⊞</span>
            Grid
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            style={{
              padding: '8px 16px',
              background: viewMode === 'list' ? 'rgba(255, 255, 255, 0.3)' : 'transparent',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="List view"
          >
            <span>☰</span>
            List
          </button>
        </div>
      )}
      
      {/* Header Section */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: 'white',
          margin: '0 0 16px 0'
        }}>
          Welcome back{user?.name ? `, ${user.name}` : ''}! 👋
        </h2>
        
        {/* Quick Stats - Following Dashboard Pattern */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '16px',
          marginTop: '16px'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '8px'
          }}>
            <div style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'white'
            }}>
              {totalBooks}
            </div>
            <div style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.8)',
              marginTop: '4px'
            }}>
              Books
            </div>
          </div>
          
          <div style={{
            textAlign: 'center',
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '8px'
          }}>
            <div style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'white'
            }}>
              {currentlyReading}
            </div>
            <div style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.8)',
              marginTop: '4px'
            }}>
              Reading
            </div>
          </div>
        </div>
      </div>

      {/* Responsive Navigation - bar → rail → drawer */}
      <div style={{
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: `1px solid rgba(255, 255, 255, 0.2)`
      }}>
        {/* Mobile/Tablet: Horizontal scrollable bar */}
        <div 
          className="navigation-container"
          style={{
            display: 'flex',
            justifyContent: window.innerWidth >= 1024 ? 'center' : 'flex-start',
            gap: '12px',
            overflowX: 'auto',
            scrollBehavior: 'smooth',
            paddingBottom: '8px'
          }}
        >
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigationClick(item.id)}
              style={{
                display: 'flex',
                flexDirection: window.innerWidth >= 768 ? 'column' : 'row',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: window.innerWidth >= 768 ? '80px' : '120px',
                height: window.innerWidth >= 768 ? '64px' : '48px',
                padding: window.innerWidth >= 768 ? '8px 4px' : '8px 12px',
                border: `1px solid rgba(255, 255, 255, 0.3)`,
                background: activeNavItem === item.id 
                  ? 'rgba(255, 255, 255, 0.3)'
                  : 'rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                color: 'white',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                if (activeNavItem !== item.id) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeNavItem !== item.id) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <div style={{ 
                fontSize: '20px', 
                marginBottom: window.innerWidth >= 768 ? '4px' : '0',
                marginRight: window.innerWidth >= 768 ? '0' : '8px'
              }}>
                {item.icon}
              </div>
              <div style={{
                fontSize: window.innerWidth >= 768 ? '11px' : '14px',
                fontWeight: '500',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: window.innerWidth >= 768 ? '72px' : '80px'
              }}>
                {item.label}
              </div>
              
              {/* Badge */}
              {item.count > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  background: '#ef4444',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: '600',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  minWidth: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {item.count > 99 ? '99+' : item.count}
                </div>
              )}
            </button>
          ))}
        </div>
        
        {/* Add CSS for smooth scrolling */}
        <style jsx>{`
          .navigation-container::-webkit-scrollbar {
            height: 4px;
          }
          .navigation-container::-webkit-scrollbar-track {
            background: transparent;
          }
          .navigation-container::-webkit-scrollbar-thumb {
            background-color: ${actualTheme === 'dark' ? '#475569' : '#cbd5e1'};
            border-radius: 2px;
          }
          .navigation-container::-webkit-scrollbar-thumb:hover {
            background-color: ${actualTheme === 'dark' ? '#64748b' : '#94a3b8'};
          }
        `}</style>
      </div>
    </div>
  );
};

export default WelcomeWidget;