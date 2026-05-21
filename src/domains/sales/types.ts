import { z } from 'zod';

export enum SalesStatus {
  DRAFT = 'draft',
  COMPLETED = 'completed',
  VOIDED = 'voided',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  CASH = 'cash',
  MPESA = 'mpesa',
  CARD = 'card',
  CREDIT = 'credit',
}

export const saleItemSchema = z.object({
  id: z.string().uuid(),
  saleId: z.string().uuid(),
  productId: z.string().uuid(),
  productName: z.string(),
  sku: z.string(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  discount: z.number().min(0).default(0),
  total: z.number().min(0),
});

export type SaleItem = z.infer<typeof saleItemSchema>;

export const saleSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  invoiceNumber: z.string().unique(),
  cashierId: z.string().uuid(),
  customerId: z.string().uuid().optional(),
  items: z.array(saleItemSchema),
  subtotal: z.number().min(0),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  total: z.number().min(0),
  amountPaid: z.number().min(0),
  change: z.number().min(0).default(0),
  paymentMethod: z.nativeEnum(PaymentMethod),
  status: z.nativeEnum(SalesStatus),
  notes: z.string().optional(),
  createdAt: z.date(),
  completedAt: z.date().optional(),
  voidedAt: z.date().optional(),
  voidReason: z.string().optional(),
  receiptPrinted: z.boolean().default(false),
  syncStatus: z.enum(['PENDING', 'PROCESSING', 'VERIFIED', 'FAILED']),
  syncedAt: z.date().optional(),
});

export type Sale = z.infer<typeof saleSchema>;

/**
 * Suspended Cart - for resuming later
 */
export const suspendedCartSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  cashierId: z.string().uuid(),
  items: z.array(saleItemSchema),
  subtotal: z.number().min(0),
  suspendedAt: z.date(),
  resumedAt: z.date().optional(),
});

export type SuspendedCart = z.infer<typeof suspendedCartSchema>;