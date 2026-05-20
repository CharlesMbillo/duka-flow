import { useState, useEffect } from 'react';
import { db } from '@/db/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, Download, Upload, Store, Bluetooth, BluetoothOff, Printer, Users } from 'lucide-react';
import { toast } from 'sonner';
import { usePrinter } from '@/hooks/usePrinter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getOwnerPin, setOwnerPin, setRole } from '@/lib/roles';

export default function SettingsPage() {
  const [businessName, setBusinessName] = useState('');
  const [kraPin, setKraPin] = useState('');
  const [etimsEnabled, setEtimsEnabled] = useState(false);
  const [ownerPin, setOwnerPinState] = useState(getOwnerPin());
  const [newPin, setNewPin] = useState('');
  const printer = usePrinter();

  useEffect(() => {
    (async () => {
      const bn = await db.settings.getByKey('businessName');
      const kp = await db.settings.getByKey('kraPin');
      const et = await db.settings.getByKey('etimsEnabled');
      if (bn) setBusinessName(bn.value);
      if (kp) setKraPin(kp.value);
      if (et) setEtimsEnabled(et.value === 'true');
    })();
  }, []);

  const saveSetting = async (key: string, value: string) => {
    const existing = await db.settings.getByKey(key);
    if (existing) {
      existing.value = value;
      await db.settings.put(existing);
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
      products: await db.products.getAll(),
      transactions: await db.transactions.getAll(),
      settings: await db.settings.getAll(),
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
        if (data.products) {
          await db.products.clear();
          for (const p of data.products) await db.products.add(p);
        }
        if (data.transactions) {
          await db.transactions.clear();
          for (const t of data.transactions) await db.transactions.add(t);
        }
        if (data.settings) {
          await db.settings.clear();
          for (const s of data.settings) await db.settings.add(s);
        }
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
            <Printer className="h-4 w-4" /> Receipt Printer
          </CardTitle>
          <CardDescription>Connect a Bluetooth thermal printer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!printer.supported ? (
            <p className="text-sm text-muted-foreground">
              WebBluetooth is not supported in this browser. Use Chrome or Edge on Android.
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Status</Label>
                  <p className="text-sm text-muted-foreground">
                    {printer.connected ? (
                      <span className="text-primary font-medium flex items-center gap-1">
                        <Bluetooth className="h-3 w-3" /> {printer.deviceName}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <BluetoothOff className="h-3 w-3" /> Not connected
                      </span>
                    )}
                  </p>
                </div>
                {printer.connected ? (
                  <Button variant="outline" size="sm" onClick={printer.disconnect}>
                    Disconnect
                  </Button>
                ) : (
                  <Button size="sm" onClick={printer.connect} disabled={printer.connecting}>
                    {printer.connecting ? 'Scanning...' : 'Connect'}
                  </Button>
                )}
              </div>
              <div>
                <Label>Paper Width</Label>
                <Select value={printer.paperWidth} onValueChange={(v) => printer.changePaperWidth(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="58mm">58mm (32 chars)</SelectItem>
                    <SelectItem value="80mm">80mm (48 chars)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Users className="h-4 w-4" /> Team Access
          </CardTitle>
          <CardDescription>
            <span className="font-medium text-foreground">Owner</span> can manage inventory & settings. <span className="font-medium text-foreground">Salesman</span> can only sell and view history.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Owner PIN</Label>
            <Input
              type="password"
              inputMode="numeric"
              placeholder={`Current: ${'•'.repeat(ownerPin.length)}`}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Used to switch from Salesman to Owner. Default is 1234.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (newPin.length < 4) { toast.error('PIN must be at least 4 digits'); return; }
                setOwnerPin(newPin);
                setOwnerPinState(newPin);
                setNewPin('');
                toast.success('Owner PIN updated');
              }}
            >
              Update PIN
            </Button>
            <Button
              variant="outline"
              onClick={() => { setRole('salesman'); toast.success('Switched to Salesman'); }}
            >
              Hand off to Salesman
            </Button>
          </div>
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
