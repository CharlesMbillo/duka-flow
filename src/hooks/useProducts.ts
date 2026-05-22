import { useState, useEffect, useCallback } from 'react';
import { db, getAllStockLevels, type Product } from '@/db/database';
import { addStockMovement } from '@/lib/inventory';
import { subscribe } from '@/lib/dbEvents';

export function useProducts(searchQuery = '') {
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [version, setVersion] = useState(0);

  const bump = useCallback(() => setVersion(v => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [all, stockMap] = await Promise.all([db.products.getAll(), getAllStockLevels()]);
      if (cancelled) return;
      const withStock = all.map(p => ({ ...p, stock: stockMap.get(p.id!) ?? 0 }));
      const q = searchQuery.trim().toLowerCase();
      const filtered = q
        ? withStock.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            (p.barcode?.toLowerCase().includes(q) ?? false)
          )
        : withStock;
      setProducts(filtered);
      setLowStockProducts(withStock.filter(p => p.stock <= p.lowStockAlert));
    })();
    return () => { cancelled = true; };
  }, [searchQuery, version]);

  // Live updates: refresh when products, transactions, or ledger entries change
  useEffect(() => {
    const offP = subscribe('products', bump);
    const offT = subscribe('transactions', bump);
    const offL = subscribe('inventoryLedger', bump);
    return () => { offP(); offT(); offL(); };
  }, [bump]);

  const addProduct = useCallback(async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const { stock: initialStock, ...rest } = product;
    const id = await db.products.add({ ...rest, stock: 0, createdAt: now, updatedAt: now } as Product);
    if (initialStock && initialStock > 0) {
      await addStockMovement(id, 'purchase', initialStock, { reason: 'Initial stock' });
    }
    bump();
  }, [bump]);

  const updateProduct = useCallback(async (id: number, updates: Partial<Product>) => {
    const existing = await db.products.get(id);
    if (!existing) return;
    // Stock is ledger-derived; never write it back to the product record.
    const { stock: _ignored, ...safe } = updates;
    const updated = { ...existing, ...safe, updatedAt: new Date().toISOString() };
    await db.products.put(updated);
    bump();
  }, [bump]);

  const deleteProduct = useCallback(async (id: number) => {
    await db.products.delete(id);
    bump();
  }, [bump]);

  const adjustStock = useCallback(async (id: number, delta: number, reason: string) => {
    await addStockMovement(id, 'adjustment', delta, { reason });
    bump();
  }, [bump]);

  const receiveStock = useCallback(async (id: number, quantity: number, reason = 'Stock received') => {
    await addStockMovement(id, 'purchase', quantity, { reason });
    bump();
  }, [bump]);

  return { products, lowStockProducts, addProduct, updateProduct, deleteProduct, adjustStock, receiveStock, refresh: bump };
}
