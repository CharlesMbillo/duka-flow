import { z } from 'zod';

export enum Role {
  OWNER = 'owner',
  MANAGER = 'manager',
  CASHIER = 'cashier',
  AUDITOR = 'auditor',
  ADMIN = 'admin',
}

export enum Permission {
  // Sales
  PROCESS_SALE = 'process_sale',
  VOID_SALE = 'void_sale',
  REFUND_SALE = 'refund_sale',
  OVERRIDE_PRICE = 'override_price',

  // Inventory
  VIEW_INVENTORY = 'view_inventory',
  ADJUST_STOCK = 'adjust_stock',
  APPROVE_ADJUSTMENT = 'approve_adjustment',
  MANAGE_PRODUCTS = 'manage_products',

  // Payments
  PROCESS_PAYMENT = 'process_payment',
  VIEW_PAYMENTS = 'view_payments',
  RECONCILE_PAYMENTS = 'reconcile_payments',

  // Reporting
  VIEW_REPORTS = 'view_reports',
  EXPORT_REPORTS = 'export_reports',

  // Users
  MANAGE_USERS = 'manage_users',
  MANAGE_ROLES = 'manage_roles',

  // Audit
  VIEW_AUDIT_LOG = 'view_audit_log',
}

export const rolePermissionsMap: Record<Role, Permission[]> = {
  [Role.CASHIER]: [
    Permission.PROCESS_SALE,
    Permission.VIEW_INVENTORY,
    Permission.PROCESS_PAYMENT,
  ],
  [Role.MANAGER]: [
    Permission.PROCESS_SALE,
    Permission.VOID_SALE,
    Permission.REFUND_SALE,
    Permission.VIEW_INVENTORY,
    Permission.ADJUST_STOCK,
    Permission.APPROVE_ADJUSTMENT,
    Permission.PROCESS_PAYMENT,
    Permission.VIEW_PAYMENTS,
    Permission.VIEW_REPORTS,
    Permission.VIEW_AUDIT_LOG,
  ],
  [Role.OWNER]: Object.values(Permission),
  [Role.AUDITOR]: [
    Permission.VIEW_INVENTORY,
    Permission.VIEW_PAYMENTS,
    Permission.VIEW_REPORTS,
    Permission.VIEW_AUDIT_LOG,
  ],
  [Role.ADMIN]: Object.values(Permission),
};

export const userSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  phoneNumber: z.string().optional(),
  role: z.nativeEnum(Role),
  isActive: z.boolean().default(true),
  lastLogin: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  syncStatus: z.enum(['SYNCED', 'PENDING']),
});

export type User = z.infer<typeof userSchema>;

export const authSessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  tenantId: z.string().uuid(),
  token: z.string(),
  expiresAt: z.date(),
  createdAt: z.date(),
});

export type AuthSession = z.infer<typeof authSessionSchema>;