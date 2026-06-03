import Dexie, { Table } from 'dexie';
import { Product } from '../../domains/inventory/types';
import { Sale, SuspendedCart } from '../../domains/sales/types';
import { Payment, MpesaTransaction } from '../../domains/payments/types';
import { Customer, CustomerDebt } from '../../domains/customers/types';
import { User } from '../../domains/auth/types';
import { AuditLog, SyncQueue } from '../../domains/shared/types';

/**
 * Dexie Database Configuration
 * Offline-first local database for Duka Flow
 */
export class DukaFlowDB extends Dexie {
  // Inventory
  products!: Table<Product>;
  inventoryMovements!: Table<any>; // InventoryMovement type
  stockAdjustments!: Table<any>;

  // Sales
  sales!: Table<Sale>;
  suspendedCarts!: Table<SuspendedCart>;

  // Payments
  payments!: Table<Payment>;
  mpesaTransactions!: Table<MpesaTransaction>;
  paymentQueues!: Table<any>;

  // Customers
  customers!: Table<Customer>;
  customerDebts!: Table<CustomerDebt>;

  // Auth
  users!: Table<User>;

  // System
  auditLogs!: Table<AuditLog>;
  syncQueues!: Table<SyncQueue>;

  constructor() {
    super('duka-flow');
    this.version(1).stores({
      // Inventory stores
      products: '++id, tenantId, sku, barcode, supplierId, isActive',
      inventoryMovements: '++id, tenantId, productId, type, createdAt, syncStatus',
      stockAdjustments: '++id, tenantId, productId, approvalStatus, createdAt',

      // Sales stores
      sales: '++id, tenantId, invoiceNumber, cashierId, customerId, status, createdAt, syncStatus',
      suspendedCarts: '++id, tenantId, cashierId, suspendedAt',

      // Payment stores
      payments: '++id, tenantId, saleId, status, createdAt, syncStatus',
      mpesaTransactions: '++id, tenantId, saleId, phoneNumber, status, createdAt, syncStatus',
      paymentQueues: '++id, tenantId, paymentId, action, status, createdAt',

      // Customer stores
      customers: '++id, tenantId, name, phone, email, type, isActive',
      customerDebts: '++id, tenantId, customerId, saleId, status, dueDate, createdAt',

      // Auth stores
      users: '++id, tenantId, email, role, isActive',

      // System stores
      auditLogs: '++id, tenantId, userId, action, entityType, entityId, createdAt',
      syncQueues: '++id, tenantId, entity, entityId, action, status, nextAttemptAt',
    });
  }
}

/**
 * Global database instance
 */
export const db = new DukaFlowDB();

/**
 * Database initialization
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // Test database connection
    await db.products.limit(1).toArray();
    console.log('✓ Duka Flow Database initialized successfully');
  } catch (error) {
    console.error('✗ Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Clear database for development/testing
 */
export async function clearDatabase(): Promise<void> {
  try {
    await db.delete();
    console.log('✓ Database cleared');
  } catch (error) {
    console.error('✗ Failed to clear database:', error);
    throw error;
  }
}

export default db;
