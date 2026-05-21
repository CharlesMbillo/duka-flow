import { z } from 'zod';

export enum JournalEntryType {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

export enum AccountType {
  ASSET = 'asset',
  LIABILITY = 'liability',
  EQUITY = 'equity',
  REVENUE = 'revenue',
  EXPENSE = 'expense',
}

/**
 * Immutable Journal Entry
 * NEVER modified, only reversed
 */
export const journalEntrySchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  accountId: z.string().uuid(),
  referenceId: z.string().uuid(), // sale_id, payment_id, etc.
  referenceType: z.enum(['SALE', 'PAYMENT', 'ADJUSTMENT', 'RETURN']),
  amount: z.number().min(0),
  entryType: z.nativeEnum(JournalEntryType),
  description: z.string(),
  createdAt: z.date(),
  reversedAt: z.date().optional(),
  reversalEntryId: z.string().uuid().optional(),
  syncStatus: z.enum(['PENDING', 'SYNCED']),
});

export type JournalEntry = z.infer<typeof journalEntrySchema>;

export const accountSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.nativeEnum(AccountType),
  balance: z.number(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Account = z.infer<typeof accountSchema>;

/**
 * Trial Balance Report
 */
export const trialBalanceSchema = z.object({
  accounts: z.array(
    z.object({
      accountId: z.string().uuid(),
      code: z.string(),
      name: z.string(),
      balance: z.number(),
    })
  ),
  totalDebits: z.number(),
  totalCredits: z.number(),
  balanced: z.boolean(),
  asOfDate: z.date(),
});

export type TrialBalance = z.infer<typeof trialBalanceSchema>;