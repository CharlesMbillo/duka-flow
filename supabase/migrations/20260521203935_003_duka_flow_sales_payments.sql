/*
  # Duka Flow - Sales, Customers, Payments, Audit
*/

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  id_number text,
  address text,
  credit_limit numeric(12,2) DEFAULT 0,
  outstanding_balance numeric(12,2) DEFAULT 0,
  loyalty_points integer DEFAULT 0,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view customers"
  ON customers FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Staff can insert customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Staff can update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));

-- ============================================================
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id),
  cashier_id uuid REFERENCES auth.users(id),
  sale_number text NOT NULL,
  status text DEFAULT 'completed' CHECK (status IN ('pending','completed','voided','refunded','partial_refund')),
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  discount_amount numeric(12,2) DEFAULT 0,
  tax_amount numeric(12,2) DEFAULT 0,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  amount_paid numeric(12,2) DEFAULT 0,
  change_amount numeric(12,2) DEFAULT 0,
  notes text,
  void_reason text,
  voided_by uuid REFERENCES auth.users(id),
  voided_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  sync_status text DEFAULT 'synced' CHECK (sync_status IN ('pending','synced','failed')),
  local_id text
);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view sales"
  ON sales FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Staff can insert sales"
  ON sales FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Staff can update sales"
  ON sales FOR UPDATE
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));

-- ============================================================
CREATE TABLE IF NOT EXISTS sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  quantity numeric(12,3) NOT NULL,
  unit_price numeric(12,2) NOT NULL,
  discount_amount numeric(12,2) DEFAULT 0,
  tax_amount numeric(12,2) DEFAULT 0,
  line_total numeric(12,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view sale items"
  ON sale_items FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Staff can insert sale items"
  ON sale_items FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));

-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sale_id uuid REFERENCES sales(id),
  customer_id uuid REFERENCES customers(id),
  payment_method text NOT NULL CHECK (payment_method IN ('cash','mpesa','card','credit','bank_transfer')),
  amount numeric(12,2) NOT NULL,
  status text DEFAULT 'completed' CHECK (status IN ('pending','processing','completed','failed','reversed')),
  reference_number text,
  mpesa_receipt text,
  phone_number text,
  notes text,
  processed_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  sync_status text DEFAULT 'synced' CHECK (sync_status IN ('pending','synced','failed'))
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view payments"
  ON payments FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Staff can insert payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Managers can update payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid() AND role IN ('manager','owner','admin')))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid() AND role IN ('manager','owner','admin')));

-- ============================================================
CREATE TABLE IF NOT EXISTS mpesa_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  payment_id uuid REFERENCES payments(id),
  transaction_type text NOT NULL CHECK (transaction_type IN ('stk_push','paybill','till','reversal')),
  phone_number text NOT NULL,
  amount numeric(12,2) NOT NULL,
  merchant_request_id text,
  checkout_request_id text,
  mpesa_receipt_number text,
  result_code integer,
  result_description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed','timeout')),
  callback_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE mpesa_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view mpesa transactions"
  ON mpesa_transactions FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Staff can insert mpesa transactions"
  ON mpesa_transactions FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Staff can update mpesa transactions"
  ON mpesa_transactions FOR UPDATE
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));

-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid() AND role IN ('manager','owner','admin','auditor')));

CREATE POLICY "Staff can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()));

-- ============================================================
CREATE TABLE IF NOT EXISTS sync_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  operation text NOT NULL CHECK (operation IN ('INSERT','UPDATE','DELETE')),
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  payload jsonb NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending','processing','verified','failed')),
  attempts integer DEFAULT 0,
  max_attempts integer DEFAULT 5,
  error_message text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  next_retry_at timestamptz DEFAULT now()
);

ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their sync queue"
  ON sync_queue FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert to sync queue"
  ON sync_queue FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their sync queue"
  ON sync_queue FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sales_tenant_created ON sales(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_cashier ON sales(tenant_id, cashier_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_payments_sale ON payments(sale_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_created ON payments(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status, next_retry_at);

CREATE OR REPLACE FUNCTION generate_sale_number(p_tenant_id uuid)
RETURNS text AS $$
DECLARE
  v_count integer;
  v_date text;
BEGIN
  SELECT COUNT(*) INTO v_count FROM sales WHERE tenant_id = p_tenant_id;
  v_date := to_char(now(), 'YYYYMMDD');
  RETURN 'INV-' || v_date || '-' || LPAD((v_count + 1)::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_sales_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trigger_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
