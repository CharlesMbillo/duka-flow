import { useState, useEffect, useCallback } from 'react';
import { db, type Product } from '@/db/database';
import { subscribe } from '@/lib/dbEvents';

export function useProducts(searchQuery = '') {
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [version, setVersion] = useState(0);

  const bump = useCallback(() => setVersion(v => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const all = await db.products.getAll();
      if (cancelled) return;
      const q = searchQuery.trim().toLowerCase();
      const filtered = q
        ? all.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            (p.barcode?.toLowerCase().includes(q) ?? false)
          )
        : all;
      setProducts(filtered);
      setLowStockProducts(all.filter(p => p.stock <= p.lowStockAlert));
    })();
    return () => { cancelled = true; };
  }, [searchQuery, version]);

  // Live updates: refresh when products or transactions change (transactions decrement stock)
  useEffect(() => {
    const offP = subscribe('products', bump);
    const offT = subscribe('transactions', bump);
    return () => { offP(); offT(); };
  }, [bump]);

  const addProduct = useCallback(async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    await db.products.add({ ...product, createdAt: now, updatedAt: now } as Product);
    bump();
  }, []);

  const updateProduct = useCallback(async (id: number, updates: Partial<Product>) => {
    const existing = await db.products.get(id);
    if (!existing) return;
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await db.products.put(updated);
    bump();
  }, []);

  const deleteProduct = useCallback(async (id: number) => {
    await db.products.delete(id);
    bump();
  }, []);

  return { products, lowStockProducts, addProduct, updateProduct, deleteProduct, refresh: bump };
}
