import { db } from '../dexie.db';
import { InventoryMovement, InventoryMovementType } from '../../../domains/inventory/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Inventory Movement Repository
 * Immutable ledger for stock movements
 */
export class InventoryMovementRepository {
  private tenantId: string;
  private userId: string;

  constructor(tenantId: string, userId: string) {
    this.tenantId = tenantId;
    this.userId = userId;
  }

  /**
   * Record a stock movement (immutable)
   */
  async record(
    productId: string,
    type: InventoryMovementType,
    quantity: number,
    reference?: string,
    notes?: string
  ): Promise<InventoryMovement> {
    const movement: InventoryMovement = {
      id: uuidv4(),
      tenantId: this.tenantId,
      productId,
      type,
      quantity,
      reference,
      notes,
      createdBy: this.userId,
      createdAt: new Date(),
      syncStatus: 'PENDING',
    };

    await db.inventoryMovements.add(movement);
    return movement;
  }

  /**
   * Get movement by ID
   */
  async getById(id: string): Promise<InventoryMovement | undefined> {
    return await db.inventoryMovements.get(id);
  }

  /**
   * Get all movements for a product
   */
  async getByProductId(productId: string): Promise<InventoryMovement[]> {
    return await db.inventoryMovements
      .where('productId')
      .equals(productId)
      .toArray();
  }

  /**
   * Get movements by type
   */
  async getByType(type: InventoryMovementType): Promise<InventoryMovement[]> {
    return await db.inventoryMovements
      .where('tenantId')
      .equals(this.tenantId)
      .filter((m) => m.type === type)
      .toArray();
  }

  /**
   * Get pending sync movements
   */
  async getPendingSync(): Promise<InventoryMovement[]> {
    return await db.inventoryMovements
      .where('tenantId')
      .equals(this.tenantId)
      .filter((m) => m.syncStatus === 'PENDING')
      .toArray();
  }

  /**
   * Calculate stock balance for a product
   * Sums all movements for the product
   */
  async calculateBalance(productId: string): Promise<number> {
    const movements = await this.getByProductId(productId);
    return movements.reduce((sum, m) => sum + m.quantity, 0);
  }

  /**
   * Get movements in date range
   */
  async getByDateRange(startDate: Date, endDate: Date): Promise<InventoryMovement[]> {
    return await db.inventoryMovements
      .where('createdAt')
      .between(startDate, endDate)
      .toArray();
  }

  /**
   * Update sync status
   */
  async updateSyncStatus(
    id: string,
    status: 'PENDING' | 'PROCESSING' | 'VERIFIED' | 'FAILED'
  ): Promise<void> {
    await db.inventoryMovements.update(id, {
      syncStatus: status,
      syncedAt: status === 'VERIFIED' ? new Date() : undefined,
    });
  }

  /**
   * Bulk mark as synced
   */
  async markAsSynced(ids: string[]): Promise<void> {
    const now = new Date();
    for (const id of ids) {
      await db.inventoryMovements.update(id, {
        syncStatus: 'VERIFIED',
        syncedAt: now,
      });
    }
  }
}
