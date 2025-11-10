// Dashboard-Compatible Welcome Widget
// File: src/components/WelcomeWidget.jsx

import React, { useState, useRef } from 'react';
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
  const navigationRef = useRef(null);

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
        : 'var(--brand-secondary)',
      borderRadius: '16px',
      padding: '24px 32px',
      color: 'white',
      marginBottom: '32px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
      position: 'relative'
    }}>
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
          marginTop: '16px',
        }}>
          <div style={{
            textAlign: 'center',
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
          }}>
            <div style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'red',
            }}>
              {totalBooks}
            </div>
            <div style={{
              fontSize: '12px',
              color: 'rgba(44, 125, 255, 0.9)',
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
        borderTop: `1px solid rgba(255, 255, 255, 0.2)`,
        position: 'relative'
      }}>
        {/* Mobile/Tablet: Horizontal scrollable bar with visible scrollbar */}
        <div
          ref={navigationRef}
          className="navigation-container welcome-nav-scrollable"
          style={{
            display: 'flex',
            justifyContent: window.innerWidth >= 1040 ? 'center' : 'flex-start',
            gap: '30px',
            flexWrap: 'nowrap',
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollBehavior: 'smooth',
            paddingBottom: '16px',
            // Break out of parent container - THIS IS KEY for touch scrolling
            marginLeft: window.innerWidth < 1024 ? '-24px' : '0',
            marginRight: window.innerWidth < 1024 ? '-24px' : '0',
            paddingLeft: window.innerWidth < 1024 ? '24px' : '0',
            paddingRight: window.innerWidth < 1024 ? '24px' : '0',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-x',
            scrollbarWidth: 'thin',
            scrollbarColor: actualTheme === 'dark' ? '#94a3b8 rgba(255, 255, 255, 0.2)' : '#64748b rgba(0, 0, 0, 0.2)',
            position: 'relative'
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
                minWidth: window.innerWidth >= 768 ? '75px' : '85px',
                maxWidth: window.innerWidth >= 768 ? '90px' : '95px',
                height: window.innerWidth >= 768 ? '56px' : '44px',
                padding: window.innerWidth >= 768 ? '6px 4px' : '6px 8px',
                border: `1px solid rgba(255, 255, 255, 0.3)`,
                background: activeNavItem === item.id
                  ? 'rgba(255, 255, 255, 0.)'
                  : 'rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
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
                fontSize: window.innerWidth >= 768 ? '18px' : '16px',
                marginBottom: window.innerWidth >= 768 ? '3px' : '0',
                marginRight: window.innerWidth >= 768 ? '0' : '5px',
                flexShrink: 0,
                lineHeight: 1
              }}>
                {item.icon}
              </div>
              <div style={{
                fontSize: window.innerWidth >= 768 ? '10px' : '11px',
                fontWeight: '500',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: window.innerWidth >= 768 ? '65px' : '55px',
                lineHeight: 1.2
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
        
        {/* Add CSS for smooth scrolling and visible scrollbar */}
        <style jsx>{`
          .welcome-nav-scrollable {
            -webkit-overflow-scrolling: touch !important;
            scroll-snap-type: x proximity;
            overscroll-behavior-x: contain !important;
            overscroll-behavior-y: none !important;
            isolation: isolate;
            cursor: default !important;
          }

          /* Force scrollbar to always be visible on WebKit browsers */
          .welcome-nav-scrollable::-webkit-scrollbar {
            height: 14px !important;
            display: block !important;
          }

          .welcome-nav-scrollable::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.2) !important;
            border-radius: 7px;
            margin: 0 8px;
          }

          .welcome-nav-scrollable::-webkit-scrollbar-thumb {
            background-color: ${actualTheme === 'dark' ? '#cbd5e1' : '#475569'} !important;
            border-radius: 7px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            cursor: pointer !important;
          }

          .welcome-nav-scrollable::-webkit-scrollbar-thumb:hover {
            background-color: ${actualTheme === 'dark' ? '#e2e8f0' : '#334155'} !important;
          }

          .welcome-nav-scrollbar::-webkit-scrollbar-thumb:active {
            background-color: ${actualTheme === 'dark' ? '#f1f5f9' : '#1e293b'} !important;
          }

          /* Ensure buttons inside nav don't expand */
          .welcome-nav-scrollable button {
            flex-shrink: 0 !important;
            pointer-events: auto !important;
            cursor: pointer !important;
          }
        `}</style>
      </div>
    </div>
  );
};

export default WelcomeWidget;


