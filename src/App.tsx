import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useEffect, useState } from "react";
import { seedSampleProducts } from "@/db/database";
import SalesPage from "@/pages/SalesPage";
import InventoryPage from "@/pages/InventoryPage";
import HistoryPage from "@/pages/HistoryPage";
import SettingsPage from "@/pages/SettingsPage";
import InstallPage from "@/pages/InstallPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedSampleProducts().then(() => setReady(true));
  }, []);

  return (
    <Routes>
      <Route path="/install" element={<InstallPage />} />
      <Route path="*" element={
        <AppShell>
          <Routes>
            <Route path="/" element={<SalesPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
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
