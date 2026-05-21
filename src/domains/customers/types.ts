import { z } from 'zod';

export enum CustomerType {
  RETAIL = 'retail',
  CREDIT_ACCOUNT = 'credit_account',
  CORPORATE = 'corporate',
}

export const customerSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  type: z.nativeEnum(CustomerType).default(CustomerType.RETAIL),
  creditLimit: z.number().min(0).default(0),
  totalDebt: z.number().min(0).default(0),
  totalPaid: z.number().min(0).default(0),
  lastPurchaseDate: z.date().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
  syncStatus: z.enum(['SYNCED', 'PENDING', 'FAILED']),
});

export type Customer = z.infer<typeof customerSchema>;

/**
 * Customer Debt Tracking
 */
export const customerDebtSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  customerId: z.string().uuid(),
  saleId: z.string().uuid(),
  amount: z.number().min(0),
  paidAmount: z.number().min(0).default(0),
  outstandingAmount: z.number().min(0),
  dueDate: z.date().optional(),
  status: z.enum(['ACTIVE', 'PAID', 'OVERDUE', 'WRITTEN_OFF']),
  createdAt: z.date(),
  paidAt: z.date().optional(),
  syncStatus: z.enum(['PENDING', 'SYNCED']),
});

export type CustomerDebt = z.infer<typeof customerDebtSchema>;

/**
 * Customer Payment
 */
export const customerPaymentSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  customerId: z.string().uuid(),
  debtIds: z.array(z.string().uuid()),
  amount: z.number().min(0),
  paymentMethod: z.string(),
  reference: z.string().optional(),
  createdAt: z.date(),
  syncStatus: z.enum(['PENDING', 'SYNCED']),
});

export type CustomerPayment = z.infer<typeof customerPaymentSchema>;