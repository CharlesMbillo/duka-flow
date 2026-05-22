import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export type Database = {
  public: {
    Tables: {
      tenants: { Row: Tenant; Insert: Omit<Tenant, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Tenant> }
      user_profiles: { Row: UserProfile; Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>; Update: Partial<UserProfile> }
      products: { Row: Product; Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Product> }
      categories: { Row: Category; Insert: Omit<Category, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Category> }
      suppliers: { Row: Supplier; Insert: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Supplier> }
      inventory_movements: { Row: InventoryMovement; Insert: Omit<InventoryMovement, 'id' | 'created_at'>; Update: Partial<InventoryMovement> }
      sales: { Row: Sale; Insert: Omit<Sale, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Sale> }
      sale_items: { Row: SaleItem; Insert: Omit<SaleItem, 'id' | 'created_at'>; Update: Partial<SaleItem> }
      payments: { Row: Payment; Insert: Omit<Payment, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Payment> }
      customers: { Row: Customer; Insert: Omit<Customer, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Customer> }
      audit_logs: { Row: AuditLog; Insert: Omit<AuditLog, 'id' | 'created_at'>; Update: never }
      sync_queue: { Row: SyncQueueItem; Insert: Omit<SyncQueueItem, 'id' | 'created_at'>; Update: Partial<SyncQueueItem> }
    }
  }
}

export interface Tenant {
  id: string
  name: string
  slug: string
  business_type: string
  phone: string | null
  email: string | null
  address: string | null
  logo_url: string | null
  currency: string
  timezone: string
  settings: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  user_id: string
  tenant_id: string
  full_name: string
  role: 'cashier' | 'manager' | 'owner' | 'auditor' | 'admin'
  phone: string | null
  is_active: boolean
  last_login_at: string | null
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  tenant_id: string
  name: string
  description: string | null
  parent_id: string | null
  color: string
  icon: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  tenant_id: string
  name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  address: string | null
  tax_pin: string | null
  payment_terms: number
  credit_limit: number
  outstanding_balance: number
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  tenant_id: string
  category_id: string | null
  supplier_id: string | null
  name: string
  description: string | null
  sku: string | null
  barcode: string | null
  unit: string
  buying_price: number
  selling_price: number
  wholesale_price: number | null
  tax_rate: number
  reorder_level: number
  reorder_quantity: number
  image_url: string | null
  is_active: boolean
  is_service: boolean
  track_inventory: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface InventoryMovement {
  id: string
  tenant_id: string
  product_id: string
  movement_type: 'purchase' | 'sale' | 'return' | 'damage' | 'adjustment' | 'transfer' | 'opening'
  quantity: number
  unit_cost: number
  reference_id: string | null
  reference_type: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  sync_status: 'pending' | 'synced' | 'failed'
}

export interface Customer {
  id: string
  tenant_id: string
  name: string
  phone: string | null
  email: string | null
  id_number: string | null
  address: string | null
  credit_limit: number
  outstanding_balance: number
  loyalty_points: number
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Sale {
  id: string
  tenant_id: string
  customer_id: string | null
  cashier_id: string | null
  sale_number: string
  status: 'pending' | 'completed' | 'voided' | 'refunded' | 'partial_refund'
  subtotal: number
  discount_amount: number
  tax_amount: number
  total_amount: number
  amount_paid: number
  change_amount: number
  notes: string | null
  void_reason: string | null
  voided_by: string | null
  voided_at: string | null
  created_at: string
  updated_at: string
  sync_status: 'pending' | 'synced' | 'failed'
  local_id: string | null
}

export interface SaleItem {
  id: string
  tenant_id: string
  sale_id: string
  product_id: string
  quantity: number
  unit_price: number
  discount_amount: number
  tax_amount: number
  line_total: number
  created_at: string
}

export interface Payment {
  id: string
  tenant_id: string
  sale_id: string | null
  customer_id: string | null
  payment_method: 'cash' | 'mpesa' | 'card' | 'credit' | 'bank_transfer'
  amount: number
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'reversed'
  reference_number: string | null
  mpesa_receipt: string | null
  phone_number: string | null
  notes: string | null
  processed_by: string | null
  created_at: string
  updated_at: string
  sync_status: 'pending' | 'synced' | 'failed'
}

export interface AuditLog {
  id: string
  tenant_id: string
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  ip_address: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface SyncQueueItem {
  id: string
  tenant_id: string
  user_id: string | null
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  entity_type: string
  entity_id: string
  payload: Record<string, unknown>
  status: 'pending' | 'processing' | 'verified' | 'failed'
  attempts: number
  max_attempts: number
  error_message: string | null
  created_at: string
  processed_at: string | null
  next_retry_at: string
}
