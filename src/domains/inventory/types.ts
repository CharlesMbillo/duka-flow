import { z } from 'zod';

/**
 * Inventory Movement Types
 * Immutable ledger entries for all stock movements
 */
export enum InventoryMovementType {
  PURCHASE = 'purchase',
  SALE = 'sale',
  RETURN = 'return',
  DAMAGE = 'damage',
  ADJUSTMENT = 'adjustment',
  TRANSFER = 'transfer',
}

export const inventoryMovementSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  productId: z.string().uuid(),
  type: z.nativeEnum(InventoryMovementType),
  quantity: z.number().int(),
  reference: z.string().optional(), // sale_id, purchase_id, etc.
  notes: z.string().optional(),
  createdBy: z.string().uuid(),
  createdAt: z.date(),
  syncStatus: z.enum(['PENDING', 'PROCESSING', 'VERIFIED', 'FAILED']),
  syncedAt: z.date().optional(),
});

export type InventoryMovement = z.infer<typeof inventoryMovementSchema>;

/**
 * Product
 */
export const productSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string(),
  purchasePrice: z.number().min(0),
  sellingPrice: z.number().min(0),
  barcode: z.string().optional(),
  supplierId: z.string().uuid().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
  syncStatus: z.enum(['SYNCED', 'PENDING', 'FAILED']),
});

export type Product = z.infer<typeof productSchema>;

/**
 * Stock Level (computed from movements)
 */
export const stockLevelSchema = z.object({
  productId: z.string().uuid(),
  tenantId: z.string().uuid(),
  totalQuantity: z.number().int(),
  lastUpdated: z.date(),
});

export type StockLevel = z.infer<typeof stockLevelSchema>;

/**
 * Stock Adjustment Request
 */
export const stockAdjustmentSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  productId: z.string().uuid(),
  reason: z.enum(['damage', 'loss', 'correction', 'stock_take']),
  adjustedQuantity: z.number().int(),
  notes: z.string(),
  approvalStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  approvedBy: z.string().uuid().optional(),
  createdBy: z.string().uuid(),
  createdAt: z.date(),
  approvedAt: z.date().optional(),
});

export type StockAdjustment = z.infer<typeof stockAdjustmentSchema>;