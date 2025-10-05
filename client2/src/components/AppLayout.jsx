import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import PremiumNavigation from './navigation/PremiumNavigation';
import MobileNavigation from './navigation/MobileNavigation';
import PremiumHeader from './navigation/PremiumHeader';
import NavigationFAB from './NavigationFAB';
import { useMaterial3Theme } from '../contexts/Material3ThemeContext';
import GlobalSearch from './GlobalSearch';
import GlobalSearchFAB from './GlobalSearchFAB';
import { useGlobalSearch } from '../hooks/useGlobalSearch';
import './AppLayout.css';

const AppLayout = () => {
  const { actualTheme } = useMaterial3Theme();
  const { pathname } = useLocation();
  const { isOpen, openSearch, closeSearch, navigateToResult } = useGlobalSearch();
  const [navCollapsed, setNavCollapsed] = useState(false);

  const inReader = /^\/read\/[^/]+$/.test(pathname);

  const layoutClasses = [
    'premium-app-layout',
    actualTheme === 'dark' ? 'dark' : '',
    navCollapsed ? 'nav-collapsed' : 'nav-expanded',
    inReader ? 'reader-mode' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={layoutClasses}>
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

        <main className="page-content">
          <Outlet />
        </main>
      </div>

      {!inReader && <MobileNavigation />}

      {!inReader && (
        <div className="mobile-only">
          <NavigationFAB />
        </div>
      )}

      <GlobalSearch
        isOpen={isOpen}
        onClose={closeSearch}
        onNavigateToResult={navigateToResult}
      />

      <div
        className="mobile-only"
        style={{ position: 'fixed', bottom: '24px', left: '24px', zIndex: 999 }}
      >
        <GlobalSearchFAB position="bottom-left" />
      </div>

      {import.meta.env.VITE_ENABLE_SERVICE_WORKER === 'false' && (
        <div
          style={{
            position: 'fixed',
            bottom: 8,
            left: 8,
            fontSize: 12,
            opacity: 0.7,
            background: '#000',
            color: '#fff',
            padding: '4px 8px',
            borderRadius: 6
          }}
        >
          SW disabled
        </div>
      )}
    </div>
  );
};

export default AppLayout;