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

{import.meta.env.MODE === 'production' && window.location.hostname === 'localhost' && (
  <div style={{position:'fixed',bottom:8,left:8,fontSize:12,opacity:.7,background:'#000',color:'#fff',padding:'4px 8px',borderRadius:6}}>
    preview mode (SW disabled)
  </div>
)}

const AppLayout = () => {
  const { actualTheme } = useMaterial3Theme();
  const { pathname } = useLocation();
  const { isOpen, openSearch, closeSearch, navigateToResult } = useGlobalSearch();
  const [navCollapsed, setNavCollapsed] = useState(false); // false = expanded = 280px

  const inReader = /^\/read\/[^/]+$/.test(pathname);


  return (
    <div className={`premium-app-layout ${actualTheme === 'dark' ? 'dark' : ''} ${navCollapsed ? 'nav-collapsed' : 'nav-expanded'}`}>
      <div className="desktop-layout">
        {!inReader && <PremiumNavigation onCollapseChange={setNavCollapsed} />}
        <div className="content-area">
          {!inReader && <PremiumHeader onSearch={openSearch} />}
          <main className="page-content">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation - MD3 Navigation Bar */}
      {!inReader && <MobileNavigation />}

      {/* Mobile Navigation FAB - Only show on mobile */}
      {!inReader && (
        <div className="mobile-only">
          <NavigationFAB />
        </div>
      )}

      {/* Global Search Components */}
      <GlobalSearch
        isOpen={isOpen}
        onClose={closeSearch}
        onNavigateToResult={navigateToResult}
      />

      {/* Mobile Search FAB - Position at bottom-left */}
      <div className="mobile-only" style={{ position: 'fixed', bottom: '24px', left: '24px', zIndex: 999 }}>
        <GlobalSearchFAB position="bottom-left" />
      </div>
    </div>
  );
};

export default AppLayout;
