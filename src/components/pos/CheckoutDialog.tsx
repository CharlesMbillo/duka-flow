import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { type Transaction } from '@/db/database';
import { Check, Printer, Loader2 } from 'lucide-react';
import { usePrinter } from '@/hooks/usePrinter';

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onConfirm: (amountPaid: number) => Promise<Transaction>;
}

export function CheckoutDialog({ open, onOpenChange, total, onConfirm }: CheckoutDialogProps) {
  const [amountPaid, setAmountPaid] = useState('');
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);

  const paid = parseFloat(amountPaid) || 0;
  const change = paid - total;
  const canPay = paid >= total;

  const quickAmounts = [
    Math.ceil(total / 100) * 100,
    Math.ceil(total / 500) * 500,
    Math.ceil(total / 1000) * 1000,
  ].filter((v, i, a) => a.indexOf(v) === i && v >= total);

  const handleConfirm = async () => {
    if (!canPay) return;
    setLoading(true);
    try {
      const tx = await onConfirm(paid);
      setTransaction(tx);
    } catch (e) {
      console.error('Checkout failed:', e);
    }
    setLoading(false);
  };

  const handleClose = () => {
    setTransaction(null);
    setAmountPaid('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {transaction ? (
          <div className="flex flex-col items-center py-4 space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="font-display text-xl">Sale Complete!</DialogTitle>
            <div className="text-center space-y-1">
              <p className="text-sm text-muted-foreground">Receipt #{transaction.receiptNumber}</p>
              <p className="font-display font-bold text-2xl">KES {transaction.total.toLocaleString()}</p>
              {transaction.change > 0 && (
                <p className="text-lg text-secondary font-semibold">
                  Change: KES {transaction.change.toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                New Sale
              </Button>
              <Button className="flex-1 gap-2" onClick={handleClose}>
                <Printer className="h-4 w-4" /> Print
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Cash Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center py-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Amount Due</p>
                <p className="font-display font-bold text-3xl">KES {total.toLocaleString()}</p>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Amount Received</label>
                <Input
                  type="number"
                  placeholder="Enter amount..."
                  value={amountPaid}
                  onChange={e => setAmountPaid(e.target.value)}
                  className="text-xl font-display h-14 text-center"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                {quickAmounts.map(amt => (
                  <Button
                    key={amt}
                    variant="outline"
                    className="flex-1"
                    onClick={() => setAmountPaid(amt.toString())}
                  >
                    {amt.toLocaleString()}
                  </Button>
                ))}
              </div>

              {paid > 0 && (
                <div className={`text-center p-2 rounded-lg ${canPay ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                  <span className="font-semibold">
                    {canPay ? `Change: KES ${change.toLocaleString()}` : `Short: KES ${Math.abs(change).toLocaleString()}`}
                  </span>
                </div>
              )}

              <Button
                onClick={handleConfirm}
                disabled={!canPay || loading}
                className="w-full h-14 text-lg font-display font-bold"
              >
                {loading ? 'Processing...' : `Complete Sale`}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
