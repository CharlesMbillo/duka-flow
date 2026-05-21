export type TaxCategory = 'standard_16' | 'reduced_8' | 'exempt' | 'zero_rated';

export interface Product {
  id?: number;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  cost?: number;
  stock: number;
  lowStockAlert: number;
  taxCategory: TaxCategory;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id?: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  taxCategory: TaxCategory;
  taxAmount: number;
  total: number;
}

export interface Transaction {
  id?: number;
  receiptNumber: string;
  items: CartItem[];
  subtotal: number;
  totalTax: number;
  total: number;
  paymentMethod: 'cash';
  amountPaid: number;
  change: number;
  kraInvoiceNumber?: string;
  kraSubmissionStatus?: 'pending' | 'submitted' | 'failed' | 'not_applicable';
  createdAt: string;
  voided?: boolean;
  voidedAt?: string;
  voidReason?: string;
  voidedBy?: 'owner' | 'salesman';
}

export interface EtimsQueueItem {
  id?: number;
  transactionId: number;
  receiptNumber: string;
  invoiceData: string;
  status: 'queued' | 'submitting' | 'submitted' | 'failed';
  attempts: number;
  lastAttempt?: string;
  kraInvoiceNumber?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface AppSetting {
  id?: number;
  key: string;
  value: string;
}

// Tax helpers
export function getTaxRate(category: TaxCategory): number {
  switch (category) {
    case 'standard_16': return 0.16;
    case 'reduced_8': return 0.08;
    case 'exempt': return 0;
    case 'zero_rated': return 0;
  }
}

export function getTaxLabel(category: TaxCategory): string {
  switch (category) {
    case 'standard_16': return 'VAT 16%';
    case 'reduced_8': return 'VAT 8%';
    case 'exempt': return 'Exempt';
    case 'zero_rated': return 'Zero-rated';
  }
}

export function generateReceiptNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = now.toTimeString().slice(0, 8).replace(/:/g, '');
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `KP-${date}-${time}-${rand}`;
}

// Simple IndexedDB wrapper
const DB_NAME = 'KwaPOSDB';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('products')) {
        const store = db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('sku', 'sku', { unique: false });
        store.createIndex('barcode', 'barcode', { unique: false });
      }
      if (!db.objectStoreNames.contains('cartItems')) {
        const store = db.createObjectStore('cartItems', { keyPath: 'id', autoIncrement: true });
        store.createIndex('productId', 'productId', { unique: false });
      }
      if (!db.objectStoreNames.contains('transactions')) {
        db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('etimsQueue')) {
        db.createObjectStore('etimsQueue', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('settings')) {
        const store = db.createObjectStore('settings', { keyPath: 'id', autoIncrement: true });
        store.createIndex('key', 'key', { unique: true });
      }
    };
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };
    request.onerror = () => reject(request.error);
  });
}

// Generic CRUD helpers
async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getById<T>(storeName: string, id: number): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function add<T>(storeName: string, item: T): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.add(item);
    req.onsuccess = () => resolve(req.result as number);
    req.onerror = () => reject(req.error);
  });
}

async function put<T>(storeName: string, item: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function remove(storeName: string, id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function clearStore(storeName: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function getByIndex<T>(storeName: string, indexName: string, value: IDBValidKey): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const req = index.getAll(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

import { emit } from '@/lib/dbEvents';

// Domain-specific API. Mutations broadcast events so every view updates instantly.
export const db = {
  products: {
    getAll: () => getAll<Product>('products'),
    get: (id: number) => getById<Product>('products', id),
    add: async (p: Product) => { const r = await add('products', p); emit('products'); return r; },
    put: async (p: Product) => { await put('products', p); emit('products'); },
    delete: async (id: number) => { await remove('products', id); emit('products'); },
    clear: async () => { await clearStore('products'); emit('products'); },
  },
  cartItems: {
    getAll: () => getAll<CartItem>('cartItems'),
    getByProductId: (productId: number) => getByIndex<CartItem>('cartItems', 'productId', productId),
    add: async (item: CartItem) => { const r = await add('cartItems', item); emit('cartItems'); return r; },
    put: async (item: CartItem) => { await put('cartItems', item); emit('cartItems'); },
    delete: async (id: number) => { await remove('cartItems', id); emit('cartItems'); },
    clear: async () => { await clearStore('cartItems'); emit('cartItems'); },
  },
  transactions: {
    getAll: () => getAll<Transaction>('transactions'),
    get: (id: number) => getById<Transaction>('transactions', id),
    add: async (tx: Transaction) => { const r = await add('transactions', tx); emit('transactions'); return r; },
    put: async (tx: Transaction) => { await put('transactions', tx); emit('transactions'); },
    clear: async () => { await clearStore('transactions'); emit('transactions'); },
    void: async (id: number, reason: string, by: 'owner' | 'salesman') => {
      const tx = await getById<Transaction>('transactions', id);
      if (!tx || tx.voided) return;
      // Restore stock for each line item
      for (const item of tx.items) {
        const product = await getById<Product>('products', item.productId);
        if (product) {
          product.stock += item.quantity;
          product.updatedAt = new Date().toISOString();
          await put('products', product);
        }
      }
      tx.voided = true;
      tx.voidedAt = new Date().toISOString();
      tx.voidReason = reason;
      tx.voidedBy = by;
      await put('transactions', tx);
      // Queue a void/credit-note entry for eTIMS
      await add('etimsQueue', {
        transactionId: id,
        receiptNumber: tx.receiptNumber,
        invoiceData: JSON.stringify({ type: 'void', receiptNumber: tx.receiptNumber, reason, voidedAt: tx.voidedAt }),
        status: 'queued',
        attempts: 0,
        createdAt: new Date().toISOString(),
      } as EtimsQueueItem);
      emit('transactions');
      emit('products');
    },
  },
  etimsQueue: {
    getAll: () => getAll<EtimsQueueItem>('etimsQueue'),
    add: (item: EtimsQueueItem) => add('etimsQueue', item),
    put: (item: EtimsQueueItem) => put('etimsQueue', item),
  },
  settings: {
    getAll: () => getAll<AppSetting>('settings'),
    getByKey: async (key: string): Promise<AppSetting | undefined> => {
      const all = await getByIndex<AppSetting>('settings', 'key', key);
      return all[0];
    },
    put: async (s: AppSetting) => { await put('settings', s); emit('settings'); },
    add: async (s: AppSetting) => { const r = await add('settings', s); emit('settings'); return r; },
    clear: async () => { await clearStore('settings'); emit('settings'); },
  },
};

// Seed
export async function seedSampleProducts() {
  const existing = await db.products.getAll();
  if (existing.length > 0) return;

  const now = new Date().toISOString();
  const samples: Product[] = [
    { name: 'Unga (2kg)', sku: 'UNG-001', price: 210, cost: 180, stock: 50, lowStockAlert: 10, taxCategory: 'zero_rated', category: 'Food', createdAt: now, updatedAt: now },
    { name: 'Sugar (1kg)', sku: 'SUG-001', price: 180, cost: 150, stock: 40, lowStockAlert: 8, taxCategory: 'zero_rated', category: 'Food', createdAt: now, updatedAt: now },
    { name: 'Cooking Oil (1L)', sku: 'OIL-001', price: 350, cost: 300, stock: 30, lowStockAlert: 5, taxCategory: 'standard_16', category: 'Food', createdAt: now, updatedAt: now },
    { name: 'Milk (500ml)', sku: 'MLK-001', price: 65, cost: 50, stock: 100, lowStockAlert: 20, taxCategory: 'zero_rated', category: 'Dairy', createdAt: now, updatedAt: now },
    { name: 'Bread (400g)', sku: 'BRD-001', price: 60, cost: 45, stock: 80, lowStockAlert: 15, taxCategory: 'zero_rated', category: 'Bakery', createdAt: now, updatedAt: now },
    { name: 'Tea Leaves (100g)', sku: 'TEA-001', price: 120, cost: 90, stock: 60, lowStockAlert: 10, taxCategory: 'standard_16', category: 'Beverages', createdAt: now, updatedAt: now },
    { name: 'Soap Bar', sku: 'SOP-001', price: 85, cost: 60, stock: 45, lowStockAlert: 10, taxCategory: 'standard_16', category: 'Household', createdAt: now, updatedAt: now },
    { name: 'Panadol (10 tabs)', sku: 'PAN-001', price: 50, cost: 30, stock: 200, lowStockAlert: 30, taxCategory: 'exempt', category: 'Pharmacy', createdAt: now, updatedAt: now },
    { name: 'Exercise Book (96pg)', sku: 'EXB-001', price: 45, cost: 30, stock: 150, lowStockAlert: 25, taxCategory: 'standard_16', category: 'Stationery', createdAt: now, updatedAt: now },
    { name: 'Airtime Card (100)', sku: 'AIR-100', price: 100, cost: 97, stock: 500, lowStockAlert: 50, taxCategory: 'exempt', category: 'Airtime', createdAt: now, updatedAt: now },
  ];

  for (const p of samples) {
    await db.products.add(p);
  }
}
