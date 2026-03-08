import { type CartItem } from '@/db/database';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CartPanelProps {
  items: CartItem[];
  subtotal: number;
  totalTax: number;
  total: number;
  onUpdateQuantity: (id: number, qty: number) => void;
  onRemove: (id: number) => void;
  onClear: () => void;
  onCheckout: () => void;
}

export function CartPanel({ items, subtotal, totalTax, total, onUpdateQuantity, onRemove, onClear, onCheckout }: CartPanelProps) {
  return (
    <div className="flex flex-col h-full bg-card border-l border-border">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="font-display font-bold text-lg flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Cart ({items.length})
        </h2>
        {items.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear} className="text-destructive hover:text-destructive">
            Clear
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        <AnimatePresence mode="popLayout">
          {items.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-muted-foreground"
            >
              <ShoppingCart className="h-10 w-10 mb-2 opacity-30" />
              <p className="text-sm">Cart is empty</p>
            </motion.div>
          ) : (
            items.map(item => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-3 p-2 rounded-md bg-background"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    KES {item.unitPrice.toLocaleString()} × {item.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onUpdateQuantity(item.id!, item.quantity - 1)}
                    className="h-7 w-7 rounded-md border border-border flex items-center justify-center hover:bg-muted active:scale-95"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.id!, item.quantity + 1)}
                    className="h-7 w-7 rounded-md border border-border flex items-center justify-center hover:bg-muted active:scale-95"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <div className="text-right min-w-[70px]">
                  <p className="font-display font-bold text-sm">
                    KES {(item.unitPrice * item.quantity).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => onRemove(item.id!)}
                  className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {items.length > 0 && (
        <div className="border-t border-border p-4 space-y-3">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>KES {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax (VAT)</span>
              <span>KES {totalTax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-display font-bold text-lg pt-1 border-t border-border">
              <span>Total</span>
              <span className="text-primary">KES {total.toLocaleString()}</span>
            </div>
          </div>
          <Button
            onClick={onCheckout}
            className="w-full h-14 text-lg font-display font-bold bg-primary hover:bg-primary/90"
          >
            Charge KES {total.toLocaleString()}
          </Button>
        </div>
      )}
    </div>
  );
}
