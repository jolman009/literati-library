import { NavLink, useLocation } from 'react-router-dom';
import { MD3NavigationBar } from '@/components/Material3';

const NAV = [
  { to: '/library/reading',     label: 'Reading',     icon: 'menu_book' },
  { to: '/library/statistics',  label: 'Stats',       icon: 'query_stats' },
  { to: '/library/collections', label: 'Collections', icon: 'collections_bookmark' },
  { to: '/library/notes',       label: 'Notes',       icon: 'edit_note' },
];

const MobileNavigation = () => {
  const { pathname } = useLocation();

  return (
    <nav className="sticky bottom-0">
      <MD3NavigationBar>
        <ul className="flex items-center justify-between gap-1 px-2 py-2 w-full">
          {NAV.map(({ to, label, icon }) => {
            const active = pathname === to || pathname.startsWith(to + '/');
            return (
              <li key={to} className="flex-1">
                <NavLink
                  to={to}
                  aria-label={label}
                  className={[
                    'flex flex-col items-center justify-center h-12 min-w-16 rounded-xl px-2',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    active
                      ? 'bg-secondary-container text-on-secondary-container'
                      : 'text-on-surface-variant hover:bg-surface-variant/60'
                  ].join(' ')}
                >
                  <span className="material-symbols-outlined text-base" aria-hidden="true">{icon}</span>
                  <span className="text-[11px] mt-0.5">{label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </MD3NavigationBar>
    </nav>
  );
};

export default MobileNavigation;
