import { useState, useEffect, useCallback } from 'react';
import { db, type CartItem, type Product, getTaxRate, generateReceiptNumber, type Transaction } from '@/db/database';

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [version, setVersion] = useState(0);

  const reload = useCallback(async () => {
    const items = await db.cartItems.getAll();
    setCartItems(items);
  }, []);

  useEffect(() => { reload(); }, [reload, version]);

  const bump = () => setVersion(v => v + 1);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const totalTax = cartItems.reduce((sum, item) => sum + item.taxAmount, 0);
  const total = subtotal + totalTax;

  const addToCart = useCallback(async (product: Product) => {
    const existing = (await db.cartItems.getByProductId(product.id!))[0];
    const taxRate = getTaxRate(product.taxCategory);

    if (existing) {
      const newQty = existing.quantity + 1;
      existing.quantity = newQty;
      existing.taxAmount = product.price * newQty * taxRate;
      existing.total = product.price * newQty;
      await db.cartItems.put(existing);
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
    bump();
  }, []);

  const updateQuantity = useCallback(async (cartItemId: number, quantity: number) => {
    if (quantity <= 0) {
      await db.cartItems.delete(cartItemId);
      bump();
      return;
    }
    const items = await db.cartItems.getAll();
    const item = items.find(i => i.id === cartItemId);
    if (!item) return;
    const taxRate = getTaxRate(item.taxCategory);
    item.quantity = quantity;
    item.taxAmount = item.unitPrice * quantity * taxRate;
    item.total = item.unitPrice * quantity;
    await db.cartItems.put(item);
    bump();
  }, []);

  const removeFromCart = useCallback(async (cartItemId: number) => {
    await db.cartItems.delete(cartItemId);
    bump();
  }, []);

  const clearCart = useCallback(async () => {
    await db.cartItems.clear();
    bump();
  }, []);

  const checkout = useCallback(async (amountPaid: number): Promise<Transaction> => {
    const items = await db.cartItems.getAll();
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
      createdAt: new Date().toISOString(),
    };

    const txId = await db.transactions.add(transaction);
    transaction.id = txId;

    // Decrement stock
    for (const item of items) {
      const product = await db.products.get(item.productId);
      if (product) {
        product.stock = Math.max(0, product.stock - item.quantity);
        product.updatedAt = new Date().toISOString();
        await db.products.put(product);
      }
    }

    await db.cartItems.clear();
    bump();
    return transaction;
  }, []);

  return { cartItems, subtotal, totalTax, total, addToCart, updateQuantity, removeFromCart, clearCart, checkout };
}
