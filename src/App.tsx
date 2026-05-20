import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useEffect, useState } from "react";
import { seedSampleProducts } from "@/db/database";
import LandingPage from "@/pages/LandingPage";
import SalesPage from "@/pages/SalesPage";
import InventoryPage from "@/pages/InventoryPage";
import HistoryPage from "@/pages/HistoryPage";
import SettingsPage from "@/pages/SettingsPage";
import InstallPage from "@/pages/InstallPage";
import NotFound from "@/pages/NotFound";
import { RoleGate } from "@/components/RoleGate";

const queryClient = new QueryClient();

function AppContent() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedSampleProducts().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center animate-pulse">
          <span className="text-primary-foreground font-display font-bold">K</span>
        </div>
      </div>
    );
  }


  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/install" element={<InstallPage />} />
      <Route path="*" element={
        <AppShell>
          <Routes>
            <Route path="/pos" element={<SalesPage />} />
            <Route path="/inventory" element={<RoleGate requireOwner><InventoryPage /></RoleGate>} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<RoleGate requireOwner><SettingsPage /></RoleGate>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppShell>
      } />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
