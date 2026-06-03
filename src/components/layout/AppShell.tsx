import { NavLink } from 'react-router-dom';
import { ShoppingCart, Package, History, Settings, Wifi, WifiOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRole } from '@/hooks/useRole';
import { canAccess } from '@/lib/roles';
import { RoleSwitcher } from '@/components/RoleGate';

const allNavItems = [
  { to: '/pos', icon: ShoppingCart, label: 'Sell' },
  { to: '/inventory', icon: Package, label: 'Inventory' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(navigator.onLine);
  const role = useRole();
  const navItems = allNavItems.filter((i) => canAccess(role, i.to));

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-background safe-top">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-56 border-r border-border bg-card shrink-0">
        <div className="flex items-center gap-2 px-4 py-4 border-b border-border">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-display font-bold">J</span>
          </div>
          <div className="flex-1">
            <h1 className="font-display font-bold text-base tracking-tight leading-none">JimwasEnterprises POS</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">Point of sale</p>
          </div>
        </div>
        <nav className="flex-1 flex flex-col gap-1 p-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-2 border-t border-border space-y-1">
          <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full w-fit ${online ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'}`}>
            {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {online ? 'Online' : 'Offline'}
          </div>
          <RoleSwitcher />
        </div>
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-sm">K</span>
            </div>
            <h1 className="font-display font-bold text-lg tracking-tight">KwaPOS</h1>
          </div>
          <div className="flex items-center gap-2">
            <RoleSwitcher />
            <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${online ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'}`}>
              {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {online ? 'Online' : 'Offline'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden flex items-center border-t border-border bg-card shrink-0 safe-bottom">
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
    </div>
  );
}
