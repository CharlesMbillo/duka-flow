import { useState, useEffect } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { db, type Product, type TaxCategory, type LedgerEntry, getTaxLabel } from '@/db/database';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, Trash2, AlertTriangle, Package, History, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const defaultProduct = {
  name: '', sku: '', barcode: '', price: 0, cost: 0, stock: 0, lowStockAlert: 5,
  taxCategory: 'standard_16' as TaxCategory, category: '',
};

const movementColor: Record<LedgerEntry['movementType'], string> = {
  purchase: 'bg-success/10 text-success',
  return: 'bg-success/10 text-success',
  sale: 'bg-primary/10 text-primary',
  damage: 'bg-destructive/10 text-destructive',
  adjustment: 'bg-warning/10 text-warning',
};

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const { products, lowStockProducts, addProduct, updateProduct, deleteProduct, adjustStock } = useProducts(search);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(defaultProduct);

  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [historyEntries, setHistoryEntries] = useState<LedgerEntry[]>([]);

  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [adjustDelta, setAdjustDelta] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');

  useEffect(() => {
    if (!historyProduct?.id) return;
    db.ledger.getByProduct(historyProduct.id).then(entries => {
      setHistoryEntries([...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    });
  }, [historyProduct]);

  const openAdd = () => { setEditing(null); setForm(defaultProduct); setDialogOpen(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, sku: p.sku, barcode: p.barcode || '', price: p.price, cost: p.cost || 0, stock: p.stock, lowStockAlert: p.lowStockAlert, taxCategory: p.taxCategory, category: p.category || '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.sku || form.price <= 0) {
      toast.error('Please fill in name, SKU, and price');
      return;
    }
    if (editing) {
      // Stock is no longer edited here; use the Adjust Stock dialog.
      const { stock, ...rest } = form;
      await updateProduct(editing.id!, rest);
      toast.success('Product updated');
    } else {
      await addProduct(form);
      toast.success('Product added');
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: number) => {
    await deleteProduct(id);
    toast.success('Product deleted');
  };

  const openAdjust = (p: Product) => {
    setAdjustProduct(p);
    setAdjustDelta(0);
    setAdjustReason('');
  };

  const handleAdjust = async () => {
    if (!adjustProduct?.id) return;
    if (!adjustDelta || !adjustReason.trim()) {
      toast.error('Enter a non-zero quantity and a reason');
      return;
    }
    await adjustStock(adjustProduct.id, adjustDelta, adjustReason.trim());
    toast.success(`Stock adjusted by ${adjustDelta > 0 ? '+' : ''}${adjustDelta}`);
    setAdjustProduct(null);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-xl">Inventory</h2>
          <Button onClick={openAdd} className="gap-2">
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </div>

        {lowStockProducts.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-warning/10 text-warning text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{lowStockProducts.length} product(s) low on stock</span>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {products.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <Package className="h-12 w-12 mb-3 opacity-40" />
            <p>No products yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {products.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.sku} · {getTaxLabel(p.taxCategory)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display font-bold text-sm">KES {p.price.toLocaleString()}</p>
                  <p className={`text-xs font-medium ${p.stock <= p.lowStockAlert ? 'text-warning' : 'text-muted-foreground'}`}>
                    {p.stock} in stock
                  </p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openAdjust(p)} title="Adjust stock" className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-muted">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setHistoryProduct(p)} title="Stock history" className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-muted">
                    <History className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => openEdit(p)} className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-muted">
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(p.id!)} className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-destructive/10 text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>SKU *</Label>
                <Input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} />
              </div>
              <div>
                <Label>Barcode</Label>
                <Input value={form.barcode} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Price (KES) *</Label>
                <Input type="number" value={form.price || ''} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label>Cost (KES)</Label>
                <Input type="number" value={form.cost || ''} onChange={e => setForm(f => ({ ...f, cost: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{editing ? 'Stock (use Adjust)' : 'Initial Stock'}</Label>
                <Input
                  type="number"
                  disabled={!!editing}
                  value={form.stock || ''}
                  onChange={e => setForm(f => ({ ...f, stock: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label>Low Stock Alert</Label>
                <Input type="number" value={form.lowStockAlert || ''} onChange={e => setForm(f => ({ ...f, lowStockAlert: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div>
              <Label>Tax Category</Label>
              <Select value={form.taxCategory} onValueChange={v => setForm(f => ({ ...f, taxCategory: v as TaxCategory }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard_16">VAT 16%</SelectItem>
                  <SelectItem value="reduced_8">VAT 8%</SelectItem>
                  <SelectItem value="exempt">Exempt</SelectItem>
                  <SelectItem value="zero_rated">Zero-rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Food, Pharmacy" />
            </div>
            <Button onClick={handleSave} className="w-full">
              {editing ? 'Update Product' : 'Add Product'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Adjust stock dialog */}
      <Dialog open={!!adjustProduct} onOpenChange={(o) => !o && setAdjustProduct(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Adjust Stock</DialogTitle>
          </DialogHeader>
          {adjustProduct && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {adjustProduct.name} — current stock: <span className="font-semibold text-foreground">{adjustProduct.stock}</span>
              </p>
              <div>
                <Label>Quantity change (+/-)</Label>
                <Input
                  type="number"
                  value={adjustDelta || ''}
                  onChange={e => setAdjustDelta(parseInt(e.target.value) || 0)}
                  placeholder="e.g. -3 for damage, +10 for recount"
                />
              </div>
              <div>
                <Label>Reason *</Label>
                <Input
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  placeholder="e.g. Damaged in transit, Stock recount"
                />
              </div>
              <Button onClick={handleAdjust} className="w-full">Apply Adjustment</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stock history dialog */}
      <Dialog open={!!historyProduct} onOpenChange={(o) => !o && setHistoryProduct(null)}>
        <DialogContent className="sm:max-w-md max-h-[80dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Stock History</DialogTitle>
          </DialogHeader>
          {historyProduct && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{historyProduct.name}</p>
              {historyEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No movements yet</p>
              ) : (
                historyEntries.map(e => (
                  <div key={e.id} className="flex items-center gap-3 p-2 rounded-md border border-border">
                    <Badge className={`${movementColor[e.movementType]} capitalize`} variant="outline">
                      {e.movementType}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground truncate">{e.reason || '—'}</p>
                      <p className="text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleString()}</p>
                    </div>
                    <span className={`font-display font-bold text-sm ${e.quantity >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {e.quantity > 0 ? '+' : ''}{e.quantity}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
