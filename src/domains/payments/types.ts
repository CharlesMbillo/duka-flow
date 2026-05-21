import { z } from 'zod';

export enum PaymentStatus {
  INITIATED = 'initiated',
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REVERSED = 'reversed',
}

export enum PaymentGateway {
  MPESA_STK = 'mpesa_stk',
  MPESA_TILL = 'mpesa_till',
  MPESA_PAYBILL = 'mpesa_paybill',
  CARD = 'card',
  CASH = 'cash',
}

export const mpesaTransactionSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  saleId: z.string().uuid(),
  phoneNumber: z.string(),
  amount: z.number().min(0),
  gateway: z.nativeEnum(PaymentGateway),
  status: z.nativeEnum(PaymentStatus),
  mpesaCheckoutRequestId: z.string().optional(),
  mpesaResponseCode: z.string().optional(),
  mpesaReceiptNumber: z.string().optional(),
  mpesaTransactionDate: z.date().optional(),
  failureReason: z.string().optional(),
  retryCount: z.number().int().default(0),
  maxRetries: z.number().int().default(3),
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().optional(),
  syncStatus: z.enum(['PENDING', 'PROCESSING', 'VERIFIED', 'FAILED']),
});

export type MpesaTransaction = z.infer<typeof mpesaTransactionSchema>;

export const paymentSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  saleId: z.string().uuid(),
  amount: z.number().min(0),
  method: z.nativeEnum(PaymentGateway),
  status: z.nativeEnum(PaymentStatus),
  reference: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.date(),
  completedAt: z.date().optional(),
  syncStatus: z.enum(['PENDING', 'PROCESSING', 'VERIFIED', 'FAILED']),
});

export type Payment = z.infer<typeof paymentSchema>;

/**
 * Payment Queue Entry for async processing
 */
export const paymentQueueSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  paymentId: z.string().uuid(),
  action: z.enum(['CREATE', 'VERIFY', 'RETRY', 'REVERSE']),
  priority: z.number().int().default(0),
  createdAt: z.date(),
  processedAt: z.date().optional(),
  status: z.enum(['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED']),
  errorMessage: z.string().optional(),
});

export type PaymentQueue = z.infer<typeof paymentQueueSchema>;