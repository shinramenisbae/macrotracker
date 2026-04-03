import { Outlet, NavLink, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/scan', label: 'Scan', icon: '📷' },
  { path: '/weight', label: 'Weight', icon: '⚖️' },
  { path: '/history', label: 'History', icon: '📊' },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      <main className="flex-1 overflow-y-auto">
        <div key={location.pathname} className="fade-in">
          <Outlet />
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-dark-card border-t border-dark-border z-50 safe-area-bottom">
        <div className="max-w-lg mx-auto flex justify-around items-center h-16">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-colors ${
                  isActive ? 'text-accent' : 'text-dark-muted'
                }`
              }
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
