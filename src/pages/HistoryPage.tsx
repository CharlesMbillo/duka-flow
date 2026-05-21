import { db, type Transaction } from '@/db/database';
import { Receipt, ChevronRight, Download, Printer, Ban, ShieldAlert } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { subscribe } from '@/lib/dbEvents';
import { printReceipt, downloadSalesReport, downloadVoidReport } from '@/lib/receipt';
import { toast } from 'sonner';
import { useRole } from '@/hooks/useRole';
import { verifyOwnerPin } from '@/lib/roles';
import { cn } from '@/lib/utils';

type Filter = 'all' | 'active' | 'voided';

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [businessName, setBusinessName] = useState('KwaPOS');
  const [filter, setFilter] = useState<Filter>('all');
  const [voidOpen, setVoidOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [voidPin, setVoidPin] = useState('');
  const role = useRole();

  useEffect(() => {
    const load = async () => {
      const all = await db.transactions.getAll();
      setTransactions(all.reverse());
      const bn = await db.settings.getByKey('businessName');
      if (bn?.value) setBusinessName(bn.value);
    };
    load();
    return subscribe('transactions', load);
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'active') return transactions.filter((t) => !t.voided);
    if (filter === 'voided') return transactions.filter((t) => t.voided);
    return transactions;
  }, [transactions, filter]);

  const summary = useMemo(() => {
    const active = transactions.filter((t) => !t.voided);
    const voided = transactions.filter((t) => t.voided);
    return {
      activeCount: active.length,
      activeTotal: active.reduce((n, t) => n + t.total, 0),
      voidedCount: voided.length,
      voidedTotal: voided.reduce((n, t) => n + t.total, 0),
    };
  }, [transactions]);

  const handleExport = () => {
    const active = transactions.filter((t) => !t.voided);
    if (active.length === 0) {
      toast.error('No sales to export yet');
      return;
    }
    downloadSalesReport(transactions);
    toast.success(`Exported ${active.length} sales`);
  };

  const handleVoidReport = () => {
    const voided = transactions.filter((t) => t.voided);
    if (voided.length === 0) {
      toast.error('No voided sales yet');
      return;
    }
    downloadVoidReport(transactions);
    toast.success(`Exported ${voided.length} voided sales`);
  };

  const openVoidDialog = () => {
    setVoidReason('');
    setVoidPin('');
    setVoidOpen(true);
  };

  const confirmVoid = async () => {
    if (!selected?.id) return;
    if (voidReason.trim().length < 3) {
      toast.error('Please enter a reason (3+ chars)');
      return;
    }
    if (role !== 'owner' && !verifyOwnerPin(voidPin)) {
      toast.error('Owner PIN required');
      return;
    }
    await db.transactions.void(selected.id, voidReason.trim(), role);
    toast.success('Sale voided, stock restored');
    setVoidOpen(false);
    setSelected(null);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 shrink-0 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-xl">Sales History</h2>
            <p className="text-sm text-muted-foreground">
              {summary.activeCount} sales · KES {summary.activeTotal.toLocaleString()}
              {summary.voidedCount > 0 && (
                <span className="ml-2 text-destructive">
                  · {summary.voidedCount} voided
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
              <Download className="h-4 w-4" /> Sales
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleVoidReport}>
              <ShieldAlert className="h-4 w-4" /> Voids
            </Button>
          </div>
        </div>

        <div className="flex gap-1.5 text-xs">
          {(['all', 'active', 'voided'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1 rounded-full border capitalize transition-colors',
                filter === f
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <Receipt className="h-12 w-12 mb-3 opacity-40" />
            <p>No sales {filter !== 'all' ? `(${filter})` : 'yet'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((tx, i) => (
              <motion.button
                key={tx.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => setSelected(tx)}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors',
                  tx.voided
                    ? 'border-destructive/30 bg-destructive/5 hover:border-destructive/60'
                    : 'border-border bg-card hover:border-primary',
                )}
              >
                <div className={cn(
                  'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
                  tx.voided ? 'bg-destructive/10' : 'bg-primary/10',
                )}>
                  {tx.voided
                    ? <Ban className="h-5 w-5 text-destructive" />
                    : <Receipt className="h-5 w-5 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{tx.receiptNumber}</p>
                    {tx.voided && (
                      <span className="text-[10px] uppercase font-bold tracking-wide px-1.5 py-0.5 rounded bg-destructive/15 text-destructive">
                        Voided
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(tx.createdAt), 'MMM d, yyyy · h:mm a')} · {tx.items.length} item(s)
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn(
                    'font-display font-bold text-sm',
                    tx.voided && 'line-through text-muted-foreground',
                  )}>
                    KES {tx.total.toLocaleString()}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selected && !voidOpen} onOpenChange={(o) => { if (!o && !voidOpen) setSelected(null); }}>
        <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display flex items-center gap-2">
                  Receipt
                  {selected.voided && (
                    <span className="text-xs uppercase font-bold tracking-wide px-2 py-0.5 rounded bg-destructive/15 text-destructive">
                      Voided
                    </span>
                  )}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <p className="font-display font-bold text-lg">{businessName}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(selected.createdAt), 'MMM d, yyyy · h:mm:ss a')}</p>
                  <p className="text-xs text-muted-foreground">Receipt: {selected.receiptNumber}</p>
                </div>

                {selected.voided && (
                  <div className="text-xs rounded-md border border-destructive/30 bg-destructive/5 p-2 space-y-0.5">
                    <p className="font-semibold text-destructive">Voided {selected.voidedAt && `· ${format(new Date(selected.voidedAt), 'MMM d, h:mm a')}`}</p>
                    <p className="text-muted-foreground">By: {selected.voidedBy}</p>
                    {selected.voidReason && <p className="text-muted-foreground">Reason: {selected.voidReason}</p>}
                  </div>
                )}

                <div className="border-t border-dashed border-border pt-3 space-y-2">
                  {selected.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{item.productName} ×{item.quantity}</span>
                      <span>KES {(item.unitPrice * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-dashed border-border pt-3 space-y-1 text-sm">
                  <div className="flex justify-between"><span>Subtotal</span><span>KES {selected.subtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Tax</span><span>KES {selected.totalTax.toLocaleString()}</span></div>
                  <div className="flex justify-between font-bold text-base border-t border-border pt-1">
                    <span>Total</span><span>KES {selected.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Paid</span><span>KES {selected.amountPaid.toLocaleString()}</span>
                  </div>
                  {selected.change > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Change</span><span>KES {selected.change.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-center pt-2">
                  <QRCodeSVG
                    value={JSON.stringify({
                      receipt: selected.receiptNumber,
                      total: selected.total,
                      date: selected.createdAt,
                      voided: !!selected.voided,
                    })}
                    size={120}
                  />
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1 gap-2" onClick={() => printReceipt(selected, businessName)}>
                    <Printer className="h-4 w-4" /> Print
                  </Button>
                  {!selected.voided && (
                    <Button variant="destructive" className="flex-1 gap-2" onClick={openVoidDialog}>
                      <Ban className="h-4 w-4" /> Void Sale
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={voidOpen} onOpenChange={setVoidOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Void Sale</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This will reverse the sale and restore stock. A void entry is queued for KRA eTIMS.
            </p>
            <div>
              <label className="text-sm font-medium mb-1 block">Reason</label>
              <Textarea
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="e.g. wrong item, customer refund..."
                rows={3}
                autoFocus
              />
            </div>
            {role !== 'owner' && (
              <div>
                <label className="text-sm font-medium mb-1 block">Owner PIN</label>
                <Input
                  type="password"
                  inputMode="numeric"
                  value={voidPin}
                  onChange={(e) => setVoidPin(e.target.value)}
                  placeholder="Enter owner PIN"
                />
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setVoidOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmVoid}>Confirm Void</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
