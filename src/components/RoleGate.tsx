import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, ShieldCheck, User } from 'lucide-react';
import { setRole, verifyOwnerPin, type Role } from '@/lib/roles';
import { useRole } from '@/hooks/useRole';
import { toast } from 'sonner';

export function RoleGate({ children, requireOwner = false }: { children: React.ReactNode; requireOwner?: boolean }) {
  const role = useRole();
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState('');

  if (!requireOwner || role === 'owner') return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-4">
      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
        <Lock className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h2 className="font-display font-bold text-lg">Owner access required</h2>
        <p className="text-sm text-muted-foreground mt-1">Sign in as owner to manage this section.</p>
      </div>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <ShieldCheck className="h-4 w-4" /> Switch to Owner
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Enter owner PIN</DialogTitle>
            <DialogDescription>Default PIN is 1234. Change it in Settings.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>PIN</Label>
              <Input
                type="password"
                inputMode="numeric"
                autoFocus
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submit();
                }}
              />
            </div>
            <Button className="w-full" onClick={submit}>
              Unlock
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  function submit() {
    if (verifyOwnerPin(pin)) {
      setRole('owner');
      setOpen(false);
      setPin('');
      toast.success('Signed in as Owner');
    } else {
      toast.error('Incorrect PIN');
    }
  }
}

export function RoleSwitcher() {
  const role = useRole();
  const next: Role = role === 'owner' ? 'salesman' : 'owner';
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState('');

  if (role === 'owner') {
    return (
      <Button variant="ghost" size="sm" className="gap-2" onClick={() => { setRole('salesman'); toast.success('Switched to Salesman'); }}>
        <ShieldCheck className="h-4 w-4 text-primary" /> Owner
      </Button>
    );
  }

  return (
    <>
      <Button variant="ghost" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <User className="h-4 w-4" /> Salesman
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Switch to Owner</DialogTitle>
            <DialogDescription>Enter owner PIN (default 1234).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              type="password"
              inputMode="numeric"
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (verifyOwnerPin(pin)) { setRole('owner'); setOpen(false); setPin(''); toast.success('Signed in as Owner'); }
                  else toast.error('Incorrect PIN');
                }
              }}
            />
            <Button
              className="w-full"
              onClick={() => {
                if (verifyOwnerPin(pin)) { setRole('owner'); setOpen(false); setPin(''); toast.success('Signed in as Owner'); }
                else toast.error('Incorrect PIN');
              }}
            >
              Unlock
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
