import { NavLink, useLocation } from 'react-router-dom';
import { ShoppingCart, Package, History, Settings, Wifi, WifiOff } from 'lucide-react';
import { useState, useEffect } from 'react';

const navItems = [
  { to: '/', icon: ShoppingCart, label: 'Sell' },
  { to: '/inventory', icon: Package, label: 'Inventory' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] bg-background safe-top">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-display font-bold text-sm">K</span>
          </div>
          <h1 className="font-display font-bold text-lg tracking-tight">KwaPOS</h1>
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${online ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'}`}>
          {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {online ? 'Online' : 'Offline'}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="flex items-center border-t border-border bg-card shrink-0 safe-bottom">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 transition-colors touch-target ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
