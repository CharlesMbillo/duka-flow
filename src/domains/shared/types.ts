import { z } from 'zod';

export enum SyncStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED',
  SYNCED = 'SYNCED',
}

export const tenantSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  businessType: z.string(),
  phoneNumber: z.string(),
  email: z.string().email(),
  address: z.string(),
  city: z.string(),
  country: z.string(),
  taxId: z.string().optional(),
  kraPin: z.string().optional(),
  eTimsId: z.string().optional(),
  logoUrl: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Tenant = z.infer<typeof tenantSchema>;

/**
 * Audit Log Entry
 */
export const auditLogSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  userId: z.string().uuid(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string().uuid(),
  changes: z.record(z.unknown()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  createdAt: z.date(),
  syncStatus: z.enum(['PENDING', 'SYNCED']),
});

export type AuditLog = z.infer<typeof auditLogSchema>;

/**
 * Sync Queue Entry
 */
export const syncQueueSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  entity: z.string(),
  entityId: z.string().uuid(),
  action: z.enum(['CREATE', 'UPDATE', 'DELETE']),
  data: z.record(z.unknown()),
  attempts: z.number().int().default(0),
  maxAttempts: z.number().int().default(5),
  lastAttemptAt: z.date().optional(),
  nextAttemptAt: z.date(),
  status: z.enum(['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED']),
  error: z.string().optional(),
  createdAt: z.date(),
});

export type SyncQueue = z.infer<typeof syncQueueSchema>;

/**
 * API Response Wrapper
 */
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: z.unknown().optional(),
    })
    .optional(),
  timestamp: z.date(),
});

export type ApiResponse<T = unknown> = z.infer<typeof apiResponseSchema> & {
  data?: T;
};

/**
 * Pagination
 */
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  total: z.number().int(),
  pages: z.number().int(),
});

export type Pagination = z.infer<typeof paginationSchema>;