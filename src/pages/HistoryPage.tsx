import { db, type Transaction } from '@/db/database';
import { Receipt, ChevronRight, Download, Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { subscribe } from '@/lib/dbEvents';
import { printReceipt, downloadSalesReport } from '@/lib/receipt';
import { toast } from 'sonner';

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [businessName, setBusinessName] = useState('KwaPOS');

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

  const handleExport = () => {
    if (transactions.length === 0) {
      toast.error('No sales to export yet');
      return;
    }
    downloadSalesReport(transactions);
    toast.success(`Exported ${transactions.length} sales`);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 shrink-0 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-xl">Sales History</h2>
          <p className="text-sm text-muted-foreground">{transactions.length} transactions</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
          <Download className="h-4 w-4" /> Report
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <Receipt className="h-12 w-12 mb-3 opacity-40" />
            <p>No sales yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx, i) => (
              <motion.button
                key={tx.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => setSelected(tx)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-card text-left hover:border-primary transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Receipt className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{tx.receiptNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(tx.createdAt), 'MMM d, yyyy · h:mm a')} · {tx.items.length} item(s)
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display font-bold text-sm">KES {tx.total.toLocaleString()}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display">Receipt</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <p className="font-display font-bold text-lg">KwaPOS</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(selected.createdAt), 'MMM d, yyyy · h:mm:ss a')}</p>
                  <p className="text-xs text-muted-foreground">Receipt: {selected.receiptNumber}</p>
                </div>

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
                    })}
                    size={120}
                  />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
