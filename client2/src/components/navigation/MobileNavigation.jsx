import { useLocation, useNavigate } from 'react-router-dom';
import { MD3NavigationBar } from '../Material3';

const MobileNavigation = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const destinations = [
    {
      key: 'dashboard',
      icon: <span className="material-symbols-outlined">home</span>,
      selectedIcon: <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>,
      label: 'Home'
    },
    {
      key: 'library',
      icon: <span className="material-symbols-outlined">menu_book</span>,
      selectedIcon: <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>,
      label: 'Library'
    },
    {
      key: 'notes',
      icon: <span className="material-symbols-outlined">note</span>,
      selectedIcon: <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>note</span>,
      label: 'Notes'
    },
    {
      key: 'upload',
      icon: <span className="material-symbols-outlined">upload_file</span>,
      selectedIcon: <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>upload_file</span>,
      label: 'Upload'
    },
  ];

  const currentDestination = pathname.slice(1) || 'dashboard'; // Remove leading slash
  const selectedIndex = destinations.findIndex(dest =>
    pathname === `/${dest.key}` || pathname.startsWith(`/${dest.key}/`)
  );

  const handleDestinationSelect = (index, destination) => {
    navigate(`/${destination.key}`);
  };

  return (
    <div className="mobile-only">
      <MD3NavigationBar
        destinations={destinations}
        selectedIndex={selectedIndex}
        onDestinationSelect={handleDestinationSelect}
        className="fixed bottom-0 left-0 right-0 z-50"
      />
    </div>
  );
};

export default MobileNavigation;
