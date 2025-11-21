import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import PremiumNavigation from './navigation/PremiumNavigation';
import MobileNavigation from './navigation/MobileNavigation';
import PremiumHeader from './navigation/PremiumHeader';
import NavigationFAB from './NavigationFAB';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
import { useEntitlements } from '../contexts/EntitlementsContext';
import GlobalSearch from './GlobalSearch';
import { useGlobalSearch } from '../hooks/useGlobalSearch';
import './AppLayout.css';
import MD3Footer from './MD3Footer';
import ChatGuide from './ChatGuide/ChatGuide';

const AppLayout = () => {
  const { actualTheme } = useMaterial3Theme();
  useEntitlements();
  const { pathname } = useLocation();
  const { isOpen, openSearch, closeSearch, navigateToResult } = useGlobalSearch();
  const [navCollapsed, setNavCollapsed] = useState(false); // false = expanded = 280px

  const inReader = /^\/read\/[^/]+$/.test(pathname);

  const layoutClasses = [
    'premium-app-layout',
    actualTheme === 'dark' ? 'dark' : '',
    navCollapsed ? 'nav-collapsed' : 'nav-expanded',
    inReader ? 'reader-mode' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={layoutClasses}>
      {/* Skip link for keyboard users to jump to main content */}
      <a href="#main" className="skip-link">Skip to main content</a>
      {!inReader && (
        <aside className="navigation-pane" data-collapsed={navCollapsed}>
          <PremiumNavigation
            isCollapsed={navCollapsed}
            onCollapseChange={setNavCollapsed}
          />
        </aside>
      )}

      <div className="content-area">
        {!inReader && <PremiumHeader onSearch={openSearch} />}
        {/* Premium inline CTA now lives in header; removing banner card */}

        <main id="main" className="page-content">
          <Outlet />
        </main>

        {/* App footer spans full content width */}
        {!inReader && <MD3Footer />}
      </div>

      {/* Mobile Bottom Navigation - Self-contained with viewport detection */}
      {!inReader && <MobileNavigation />}

      {/* Mobile Navigation FAB - Self-contained with viewport detection */}
      {!inReader && <NavigationFAB />}

      {/* Global Search Components */}
      <GlobalSearch
        isOpen={isOpen}
        onClose={closeSearch}
        onNavigateToResult={navigateToResult}
      />

      {/* Footer moved inside content-area to avoid grid column clipping */}

      {/* Debug indicator - shows when service worker is disabled */}
      {import.meta.env.VITE_ENABLE_SERVICE_WORKER === 'false' && (
        <div style={{ position: 'fixed', bottom: 8, left: 8, fontSize: 12, opacity: 0.7, background: '#000', color: '#fff', padding: '4px 8px', borderRadius: 6 }}>
          SW disabled
        </div>
      )}

      {/* Feature-flagged in-app guide chatbot */}
      {!inReader && <ChatGuide />}
    </div>
  );
};

export default AppLayout;
