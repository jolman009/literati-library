import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { MD3NavigationRail, MD3NavigationBar, MD3Surface } from '@/components/Material3';
import { useResponsive } from '@/components/Material3/hooks/useResponsive';

const NAV_ITEMS = [
  { to: '/library/reading',     label: 'Reading',     icon: 'menu_book' },
  { to: '/library/statistics',  label: 'Statistics',  icon: 'query_stats' },
  { to: '/library/collections', label: 'Collections', icon: 'collections_bookmark' },
  { to: '/library/notes',       label: 'Notes',       icon: 'edit_note' },
];

const titleFromPath = (pathname) => {
  if (pathname.startsWith('/library/statistics')) return 'Statistics';
  if (pathname.startsWith('/library/collections')) return 'Collections';
  if (pathname.startsWith('/library/notes'))       return 'Notes';
  return 'Reading';
};

const LibraryLayout = () => {
  const { isDesktop } = useResponsive();     // your MD3 hook that returns breakpoints
  const { pathname } = useLocation();
  const title = titleFromPath(pathname);

  return (
    <div
      className="min-h-screen grid"
      style={{ gridTemplateColumns: isDesktop ? '80px 1fr' : '1fr' }}
    >
      {/* Left rail (desktop only) */}
      {isDesktop && (
        <aside className="sticky top-0 h-screen">
          <MD3NavigationRail>
            {NAV_ITEMS.map(({ to, label, icon }) => {
              const active = pathname === to || pathname.startsWith(to + '/');
              return (
                <NavLink
                  key={to}
                  to={to}
                  aria-label={label}
                  className={[
                    'flex flex-col items-center justify-center gap-1 p-3 rounded-2xl',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    active
                      ? 'bg-secondary-container text-on-secondary-container'
                      : 'text-on-surface-variant hover:bg-surface-variant/60'
                  ].join(' ')}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
                  <span className="text-[11px]">{label}</span>
                </NavLink>
              );
            })}
          </MD3NavigationRail>
        </aside>
      )}

      {/* Main column */}
      <div className={isDesktop ? 'col-start-2' : ''}>
        {/* Sticky header */}
        <MD3Surface elevation={1} className="sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 py-3 md:px-6">
            <h1 className="text-title-large">{title}</h1>
            {/* Slot for page-level actions (filters, search, chips, etc.) */}
          </div>
        </MD3Surface>

        {/* Page content */}
        <div className="p-4 md:p-6">
          <Outlet />
        </div>

        {/* Bottom bar (mobile / tablet only) */}
        {!isDesktop && (
          <nav className="sticky bottom-0">
            <MD3NavigationBar>
              <ul className="flex items-center justify-between gap-1 px-2 py-2 w-full">
                {NAV_ITEMS.map(({ to, label, icon }) => {
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
        )}
      </div>
    </div>
  );
};

export default LibraryLayout;
