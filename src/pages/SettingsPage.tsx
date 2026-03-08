import { useState, useEffect } from 'react';
import { db } from '@/db/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, Download, Upload, Store, Printer } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [businessName, setBusinessName] = useState('');
  const [kraPin, setKraPin] = useState('');
  const [etimsEnabled, setEtimsEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      const bn = await db.settings.where('key').equals('businessName').first();
      const kp = await db.settings.where('key').equals('kraPin').first();
      const et = await db.settings.where('key').equals('etimsEnabled').first();
      if (bn) setBusinessName(bn.value);
      if (kp) setKraPin(kp.value);
      if (et) setEtimsEnabled(et.value === 'true');
    })();
  }, []);

  const saveSetting = async (key: string, value: string) => {
    const existing = await db.settings.where('key').equals(key).first();
    if (existing) {
      await db.settings.update(existing.id!, { value });
    } else {
      await db.settings.add({ key, value });
    }
  };

  const handleSave = async () => {
    await saveSetting('businessName', businessName);
    await saveSetting('kraPin', kraPin);
    await saveSetting('etimsEnabled', etimsEnabled.toString());
    toast.success('Settings saved');
  };

  const handleBackup = async () => {
    const data = {
      products: await db.products.toArray(),
      transactions: await db.transactions.toArray(),
      settings: await db.settings.toArray(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kwapos-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup downloaded');
  };

  const handleRestore = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.products) { await db.products.clear(); await db.products.bulkAdd(data.products); }
        if (data.transactions) { await db.transactions.clear(); await db.transactions.bulkAdd(data.transactions); }
        if (data.settings) { await db.settings.clear(); await db.settings.bulkAdd(data.settings); }
        toast.success('Data restored successfully');
        window.location.reload();
      } catch {
        toast.error('Invalid backup file');
      }
    };
    input.click();
  };

  return (
    <div className="h-full overflow-y-auto px-4 py-4 space-y-4 max-w-lg mx-auto">
      <h2 className="font-display font-bold text-xl">Settings</h2>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Store className="h-4 w-4" /> Business Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Business Name</Label>
            <Input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="My Duka" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Shield className="h-4 w-4" /> KRA eTIMS
          </CardTitle>
          <CardDescription>Enable for VAT-registered businesses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Enable eTIMS</Label>
            <Switch checked={etimsEnabled} onCheckedChange={setEtimsEnabled} />
          </div>
          {etimsEnabled && (
            <div>
              <Label>KRA PIN</Label>
              <Input value={kraPin} onChange={e => setKraPin(e.target.value)} placeholder="e.g. A123456789B" />
              <p className="text-xs text-muted-foreground mt-1">
                Credentials are stored locally. Connect to Lovable Cloud for secure server-side storage.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Download className="h-4 w-4" /> Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full gap-2" onClick={handleBackup}>
            <Download className="h-4 w-4" /> Export Backup
          </Button>
          <Button variant="outline" className="w-full gap-2" onClick={handleRestore}>
            <Upload className="h-4 w-4" /> Restore Backup
          </Button>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full">Save Settings</Button>
    </div>
  );
}
