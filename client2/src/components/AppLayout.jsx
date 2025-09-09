import { Outlet, useLocation } from 'react-router-dom';
import PremiumNavigation from '@/components/navigation/PremiumNavigation';
import MobileNavigation from '@/components/navigation/MobileNavigation';
import PremiumHeader from '@/components/navigation/PremiumHeader';
import { useMaterial3Theme } from '@/contexts/Material3ThemeContext';
import GlobalSearch from './GlobalSearch';
import GlobalSearchFAB from './GlobalSearchFAB';
import { useGlobalSearch } from '../hooks/useGlobalSearch';

{import.meta.env.MODE === 'production' && window.location.hostname === 'localhost' && (
  <div style={{position:'fixed',bottom:8,left:8,fontSize:12,opacity:.7,background:'#000',color:'#fff',padding:'4px 8px',borderRadius:6}}>
    preview mode (SW disabled)
  </div>
)}

const AppLayout = () => {
  const { actualTheme } = useMaterial3Theme();
  const { pathname } = useLocation();
  const { isOpen, openSearch, closeSearch, navigateToResult } = useGlobalSearch();

  const inReader = /^\/read\/[^/]+$/.test(pathname);

  return (
    <div className={`premium-app-layout ${actualTheme === 'dark' ? 'dark' : ''}`}>
      <div className="desktop-layout">
        {!inReader && <PremiumNavigation />}
        <div className="content-area">
          {!inReader && <PremiumHeader onSearch={openSearch} />}
          <main className="page-content">
            <Outlet />
          </main>
        </div>
      </div>
      {!inReader && <MobileNavigation />}
      
      {/* Global Search Components */}
      <GlobalSearch
        isOpen={isOpen}
        onClose={closeSearch}
        onNavigateToResult={navigateToResult}
      />
      
      {/* Mobile Search FAB - Only show on mobile */}
      <div className="mobile-only">
        <GlobalSearchFAB position="bottom-left" />
      </div>
    </div>
  );
};

export default AppLayout;
