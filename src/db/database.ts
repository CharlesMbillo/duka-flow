import Dexie, { type Table } from 'dexie';

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
  createdAt: Date;
  updatedAt: Date;
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
  createdAt: Date;
}

export interface EtimsQueueItem {
  id?: number;
  transactionId: number;
  receiptNumber: string;
  invoiceData: string; // JSON stringified
  status: 'queued' | 'submitting' | 'submitted' | 'failed';
  attempts: number;
  lastAttempt?: Date;
  kraInvoiceNumber?: string;
  errorMessage?: string;
  createdAt: Date;
}

export interface AppSettings {
  id?: number;
  key: string;
  value: string;
}

class KwaPOSDatabase extends Dexie {
  products!: Table<Product>;
  cartItems!: Table<CartItem>;
  transactions!: Table<Transaction>;
  etimsQueue!: Table<EtimsQueueItem>;
  settings!: Table<AppSettings>;

  constructor() {
    super('KwaPOSDB');

    this.version(1).stores({
      products: '++id, name, sku, barcode, category, taxCategory',
      cartItems: '++id, productId',
      transactions: '++id, receiptNumber, createdAt, kraSubmissionStatus',
      etimsQueue: '++id, transactionId, status, createdAt',
      settings: '++id, &key',
    });
  }
}

export const db = new KwaPOSDatabase();

// Tax rate helpers
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

// Generate receipt number
export function generateReceiptNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = now.toTimeString().slice(0, 8).replace(/:/g, '');
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `KP-${date}-${time}-${rand}`;
}

// Seed sample products
export async function seedSampleProducts() {
  const count = await db.products.count();
  if (count > 0) return;

  await db.products.bulkAdd([
    { name: 'Unga (2kg)', sku: 'UNG-001', price: 210, cost: 180, stock: 50, lowStockAlert: 10, taxCategory: 'zero_rated', category: 'Food', createdAt: new Date(), updatedAt: new Date() },
    { name: 'Sugar (1kg)', sku: 'SUG-001', price: 180, cost: 150, stock: 40, lowStockAlert: 8, taxCategory: 'zero_rated', category: 'Food', createdAt: new Date(), updatedAt: new Date() },
    { name: 'Cooking Oil (1L)', sku: 'OIL-001', price: 350, cost: 300, stock: 30, lowStockAlert: 5, taxCategory: 'standard_16', category: 'Food', createdAt: new Date(), updatedAt: new Date() },
    { name: 'Milk (500ml)', sku: 'MLK-001', price: 65, cost: 50, stock: 100, lowStockAlert: 20, taxCategory: 'zero_rated', category: 'Dairy', createdAt: new Date(), updatedAt: new Date() },
    { name: 'Bread (400g)', sku: 'BRD-001', price: 60, cost: 45, stock: 80, lowStockAlert: 15, taxCategory: 'zero_rated', category: 'Bakery', createdAt: new Date(), updatedAt: new Date() },
    { name: 'Tea Leaves (100g)', sku: 'TEA-001', price: 120, cost: 90, stock: 60, lowStockAlert: 10, taxCategory: 'standard_16', category: 'Beverages', createdAt: new Date(), updatedAt: new Date() },
    { name: 'Soap Bar', sku: 'SOP-001', price: 85, cost: 60, stock: 45, lowStockAlert: 10, taxCategory: 'standard_16', category: 'Household', createdAt: new Date(), updatedAt: new Date() },
    { name: 'Panadol (10 tabs)', sku: 'PAN-001', price: 50, cost: 30, stock: 200, lowStockAlert: 30, taxCategory: 'exempt', category: 'Pharmacy', createdAt: new Date(), updatedAt: new Date() },
    { name: 'Exercise Book (96pg)', sku: 'EXB-001', price: 45, cost: 30, stock: 150, lowStockAlert: 25, taxCategory: 'standard_16', category: 'Stationery', createdAt: new Date(), updatedAt: new Date() },
    { name: 'Airtime Card (100)', sku: 'AIR-100', price: 100, cost: 97, stock: 500, lowStockAlert: 50, taxCategory: 'exempt', category: 'Airtime', createdAt: new Date(), updatedAt: new Date() },
  ]);
}
