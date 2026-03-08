import { useState, useEffect, useCallback } from 'react';
import { db, type Product, type TaxCategory } from '@/db/database';

export function useProducts(searchQuery = '') {
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [version, setVersion] = useState(0);

  const bump = () => setVersion(v => v + 1);

  useEffect(() => {
    (async () => {
      let all = await db.products.getAll();
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        all = all.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode?.toLowerCase().includes(q) ?? false)
        );
      }
      setProducts(all);
      const low = (await db.products.getAll()).filter(p => p.stock <= p.lowStockAlert);
      setLowStockProducts(low);
    })();
  }, [searchQuery, version]);

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
