import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, CheckCircle } from 'lucide-react';

export default function InstallPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') setInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="h-20 w-20 rounded-2xl bg-primary flex items-center justify-center mb-6">
        <span className="text-primary-foreground font-display font-bold text-3xl">K</span>
      </div>
      <h1 className="font-display font-bold text-3xl mb-2">KwaPOS</h1>
      <p className="text-muted-foreground mb-8 max-w-sm">
        Install KwaPOS on your device for the best experience. Works offline, just like a native app.
      </p>

      {installed ? (
        <div className="flex items-center gap-2 text-primary">
          <CheckCircle className="h-6 w-6" />
          <span className="font-semibold">App Installed!</span>
        </div>
      ) : deferredPrompt ? (
        <Button onClick={handleInstall} size="lg" className="gap-2 h-14 px-8 text-lg font-display">
          <Download className="h-5 w-5" /> Install App
        </Button>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border text-left">
            <Smartphone className="h-8 w-8 text-primary shrink-0" />
            <div>
              <p className="font-semibold text-sm">iOS / Safari</p>
              <p className="text-xs text-muted-foreground">Tap Share → "Add to Home Screen"</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border text-left">
            <Smartphone className="h-8 w-8 text-primary shrink-0" />
            <div>
              <p className="font-semibold text-sm">Android / Chrome</p>
              <p className="text-xs text-muted-foreground">Tap menu ⋮ → "Install app"</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
