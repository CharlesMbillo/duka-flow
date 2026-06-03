import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AppShell } from '@/components/layout/AppShell';
import LandingPage from '@/pages/LandingPage';
import HistoryPage from '@/pages/HistoryPage';
import InventoryPage from '@/pages/InventoryPage';
import SalesPage from '@/pages/SalesPage';
import SettingsPage from '@/pages/SettingsPage';
import InstallPage from '@/pages/InstallPage';
import NotFound from '@/pages/NotFound';
import { RoleGate } from '@/components/RoleGate';

function ShellRoute({ children, requireOwner = false }: { children: React.ReactNode; requireOwner?: boolean }) {
  return (
    <AppShell>
      {requireOwner ? <RoleGate requiredRole="owner">{children}</RoleGate> : children}
    </AppShell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/install" element={<InstallPage />} />
        <Route path="/pos" element={<ShellRoute><SalesPage /></ShellRoute>} />
        <Route path="/inventory" element={<ShellRoute requireOwner><InventoryPage /></ShellRoute>} />
        <Route path="/history" element={<ShellRoute><HistoryPage /></ShellRoute>} />
        <Route path="/settings" element={<ShellRoute requireOwner><SettingsPage /></ShellRoute>} />
        <Route path="/index" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
