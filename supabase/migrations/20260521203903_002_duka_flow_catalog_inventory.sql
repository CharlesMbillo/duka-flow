/*
  # Duka Flow - Catalog and Inventory Tables
  Creates categories, suppliers, products, and the inventory ledger.
*/

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  parent_id uuid REFERENCES categories(id),
  color text DEFAULT '#0ea5e9',
  icon text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Managers can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid() AND role IN ('manager','owner','admin')));

CREATE POLICY "Managers can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid() AND role IN ('manager','owner','admin')))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid() AND role IN ('manager','owner','admin')));

-- ============================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_name text,
  phone text,
  email text,
  address text,
  tax_pin text,
  payment_terms integer DEFAULT 30,
  credit_limit numeric(12,2) DEFAULT 0,
  outstanding_balance numeric(12,2) DEFAULT 0,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Managers can insert suppliers"
  ON suppliers FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid() AND role IN ('manager','owner','admin')));

CREATE POLICY "Managers can update suppliers"
  ON suppliers FOR UPDATE
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid() AND role IN ('manager','owner','admin')))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid() AND role IN ('manager','owner','admin')));

-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id),
  supplier_id uuid REFERENCES suppliers(id),
  name text NOT NULL,
  description text,
  sku text,
  barcode text,
  unit text DEFAULT 'pcs',
  buying_price numeric(12,2) DEFAULT 0,
  selling_price numeric(12,2) NOT NULL DEFAULT 0,
  wholesale_price numeric(12,2),
  tax_rate numeric(5,2) DEFAULT 0,
  reorder_level integer DEFAULT 5,
  reorder_quantity integer DEFAULT 10,
  image_url text,
  is_active boolean DEFAULT true,
  is_service boolean DEFAULT false,
  track_inventory boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view products"
  ON products FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Managers can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid() AND role IN ('manager','owner','admin')));

CREATE POLICY "Managers can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid() AND role IN ('manager','owner','admin')))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid() AND role IN ('manager','owner','admin')));

-- ============================================================
CREATE TABLE IF NOT EXISTS inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  movement_type text NOT NULL CHECK (movement_type IN ('purchase','sale','return','damage','adjustment','transfer','opening')),
  quantity numeric(12,3) NOT NULL,
  unit_cost numeric(12,2) DEFAULT 0,
  reference_id uuid,
  reference_type text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  sync_status text DEFAULT 'synced' CHECK (sync_status IN ('pending','synced','failed'))
);

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view inventory movements"
  ON inventory_movements FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Staff can insert inventory movements"
  ON inventory_movements FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(tenant_id, barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(tenant_id, category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON inventory_movements(tenant_id, product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created ON inventory_movements(tenant_id, created_at DESC);

CREATE OR REPLACE FUNCTION get_stock_level(p_product_id uuid)
RETURNS numeric AS $$
  SELECT COALESCE(SUM(quantity), 0)
  FROM inventory_movements
  WHERE product_id = p_product_id;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
