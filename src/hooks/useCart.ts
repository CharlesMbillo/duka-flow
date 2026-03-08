import { useState, useEffect, useCallback } from 'react';
import { db, type CartItem, type Product, getTaxRate, generateReceiptNumber, type Transaction } from '@/db/database';
import { useLiveQuery } from 'dexie-react-hooks';

export function useCart() {
  const cartItems = useLiveQuery(() => db.cartItems.toArray()) ?? [];

  const subtotal = cartItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const totalTax = cartItems.reduce((sum, item) => sum + item.taxAmount, 0);
  const total = subtotal + totalTax;

  const addToCart = useCallback(async (product: Product) => {
    const existing = await db.cartItems.where('productId').equals(product.id!).first();
    const taxRate = getTaxRate(product.taxCategory);

    if (existing) {
      const newQty = existing.quantity + 1;
      await db.cartItems.update(existing.id!, {
        quantity: newQty,
        taxAmount: product.price * newQty * taxRate,
        total: product.price * newQty,
      });
    } else {
      await db.cartItems.add({
        productId: product.id!,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price,
        taxCategory: product.taxCategory,
        taxAmount: product.price * taxRate,
        total: product.price,
      });
    }
  }, []);

  const updateQuantity = useCallback(async (cartItemId: number, quantity: number) => {
    if (quantity <= 0) {
      await db.cartItems.delete(cartItemId);
      return;
    }
    const item = await db.cartItems.get(cartItemId);
    if (!item) return;
    const taxRate = getTaxRate(item.taxCategory);
    await db.cartItems.update(cartItemId, {
      quantity,
      taxAmount: item.unitPrice * quantity * taxRate,
      total: item.unitPrice * quantity,
    });
  }, []);

  const removeFromCart = useCallback(async (cartItemId: number) => {
    await db.cartItems.delete(cartItemId);
  }, []);

  const clearCart = useCallback(async () => {
    await db.cartItems.clear();
  }, []);

  const checkout = useCallback(async (amountPaid: number): Promise<Transaction> => {
    const items = await db.cartItems.toArray();
    if (items.length === 0) throw new Error('Cart is empty');

    const sub = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const tax = items.reduce((s, i) => s + i.taxAmount, 0);
    const tot = sub + tax;

    const transaction: Transaction = {
      receiptNumber: generateReceiptNumber(),
      items: [...items],
      subtotal: sub,
      totalTax: tax,
      total: tot,
      paymentMethod: 'cash',
      amountPaid,
      change: amountPaid - tot,
      kraSubmissionStatus: 'not_applicable',
      createdAt: new Date(),
    };

    await db.transaction('rw', [db.transactions, db.products, db.cartItems], async () => {
      const txId = await db.transactions.add(transaction);
      transaction.id = txId as number;

      // Decrement stock
      for (const item of items) {
        const product = await db.products.get(item.productId);
        if (product) {
          await db.products.update(item.productId, {
            stock: Math.max(0, product.stock - item.quantity),
            updatedAt: new Date(),
          });
        }
      }

      await db.cartItems.clear();
    });

    return transaction;
  }, []);

  return {
    cartItems,
    subtotal,
    totalTax,
    total,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    checkout,
  };
}
