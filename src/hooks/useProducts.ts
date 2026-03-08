import { useState, useCallback } from 'react';
import { db, type Product, type TaxCategory } from '@/db/database';
import { useLiveQuery } from 'dexie-react-hooks';

export function useProducts(searchQuery = '') {
  const products = useLiveQuery(
    () => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return db.products
          .filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.barcode?.toLowerCase().includes(q) ?? false))
          .toArray();
      }
      return db.products.toArray();
    },
    [searchQuery]
  ) ?? [];

  const lowStockProducts = useLiveQuery(
    () => db.products.filter(p => p.stock <= p.lowStockAlert).toArray()
  ) ?? [];

  const addProduct = useCallback(async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    return db.products.add({
      ...product,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }, []);

  const updateProduct = useCallback(async (id: number, updates: Partial<Product>) => {
    return db.products.update(id, { ...updates, updatedAt: new Date() });
  }, []);

  const deleteProduct = useCallback(async (id: number) => {
    return db.products.delete(id);
  }, []);

  return { products, lowStockProducts, addProduct, updateProduct, deleteProduct };
}
