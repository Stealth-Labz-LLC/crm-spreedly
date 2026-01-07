-- Custom CRM Database Schema
-- Version: 1.0.0
-- Konnektive-style CRM with Spreedly payment orchestration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CUSTOMERS
-- ============================================

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_created_at ON customers(created_at DESC);

-- ============================================
-- CUSTOMER ADDRESSES
-- ============================================

CREATE TABLE customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('billing', 'shipping')),
  is_default BOOLEAN DEFAULT false,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  address_1 VARCHAR(255),
  address_2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(2),
  phone VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customer_addresses_customer_id ON customer_addresses(customer_id);
CREATE INDEX idx_customer_addresses_type ON customer_addresses(type);

-- ============================================
-- CUSTOMER PAYMENT METHODS
-- ============================================

CREATE TABLE customer_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  spreedly_token VARCHAR(255) NOT NULL,
  card_type VARCHAR(50),
  last_four VARCHAR(4),
  exp_month INTEGER CHECK (exp_month >= 1 AND exp_month <= 12),
  exp_year INTEGER,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customer_payment_methods_customer_id ON customer_payment_methods(customer_id);
CREATE INDEX idx_customer_payment_methods_is_active ON customer_payment_methods(is_active);

-- ============================================
-- PRODUCTS
-- ============================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) UNIQUE,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  billing_type VARCHAR(20) DEFAULT 'onetime' CHECK (billing_type IN ('onetime', 'subscription')),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  currency VARCHAR(3) DEFAULT 'USD',
  billing_interval VARCHAR(20) CHECK (billing_interval IN ('day', 'week', 'month', 'year')),
  billing_interval_count INTEGER DEFAULT 1 CHECK (billing_interval_count >= 1),
  trial_days INTEGER DEFAULT 0 CHECK (trial_days >= 0),
  setup_fee DECIMAL(10,2) DEFAULT 0 CHECK (setup_fee >= 0),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_billing_type ON products(billing_type);

-- ============================================
-- GATEWAYS
-- ============================================

CREATE TABLE gateways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  spreedly_gateway_token VARCHAR(255) NOT NULL,
  gateway_type VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  monthly_cap DECIMAL(12,2),
  current_month_volume DECIMAL(12,2) DEFAULT 0,
  accepted_currencies TEXT[] DEFAULT ARRAY['USD'],
  accepted_card_types TEXT[] DEFAULT ARRAY['visa', 'mastercard', 'amex', 'discover'],
  min_amount DECIMAL(10,2),
  max_amount DECIMAL(10,2),
  descriptor VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gateways_is_active ON gateways(is_active);
CREATE INDEX idx_gateways_priority ON gateways(priority DESC);
CREATE INDEX idx_gateways_gateway_type ON gateways(gateway_type);

-- ============================================
-- ORDERS
-- ============================================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'paid', 'partially_paid',
    'fulfilling', 'shipped', 'completed',
    'cancelled', 'refunded', 'partially_refunded'
  )),
  payment_status VARCHAR(30) DEFAULT 'pending' CHECK (payment_status IN (
    'pending', 'authorized', 'paid', 'partially_paid',
    'refunded', 'partially_refunded', 'failed', 'voided'
  )),
  fulfillment_status VARCHAR(30) DEFAULT 'unfulfilled' CHECK (fulfillment_status IN (
    'unfulfilled', 'partial', 'fulfilled', 'shipped', 'delivered'
  )),
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  discount DECIMAL(10,2) DEFAULT 0 CHECK (discount >= 0),
  tax DECIMAL(10,2) DEFAULT 0 CHECK (tax >= 0),
  shipping DECIMAL(10,2) DEFAULT 0 CHECK (shipping >= 0),
  total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
  currency VARCHAR(3) DEFAULT 'USD',
  billing_address_id UUID REFERENCES customer_addresses(id) ON DELETE SET NULL,
  shipping_address_id UUID REFERENCES customer_addresses(id) ON DELETE SET NULL,
  ip_address VARCHAR(45),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- ============================================
-- ORDER ITEMS
-- ============================================

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- ============================================
-- TRANSACTIONS
-- ============================================

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  gateway_id UUID REFERENCES gateways(id) ON DELETE SET NULL,
  payment_method_id UUID REFERENCES customer_payment_methods(id) ON DELETE SET NULL,
  spreedly_transaction_token VARCHAR(255),
  type VARCHAR(20) NOT NULL CHECK (type IN ('authorize', 'capture', 'purchase', 'refund', 'void')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'declined', 'error')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  currency VARCHAR(3) DEFAULT 'USD',
  response_code VARCHAR(50),
  response_message TEXT,
  avs_result VARCHAR(10),
  cvv_result VARCHAR(10),
  error_code VARCHAR(50),
  error_detail TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_order_id ON transactions(order_id);
CREATE INDEX idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX idx_transactions_gateway_id ON transactions(gateway_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_spreedly_token ON transactions(spreedly_transaction_token);

-- ============================================
-- TRANSACTION LOGS
-- ============================================

CREATE TABLE transaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  request_body JSONB,
  response_body JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transaction_logs_transaction_id ON transaction_logs(transaction_id);

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gateways_updated_at
    BEFORE UPDATE ON gateways
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ORDER NUMBER SEQUENCE
-- ============================================

CREATE SEQUENCE order_number_seq START 1000;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := 'ORD-' || LPAD(nextval('order_number_seq')::text, 8, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION generate_order_number();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_logs ENABLE ROW LEVEL SECURITY;

-- Admin policy: Allow authenticated users full access (for admin portal)
-- In production, you'd add role-based checks

CREATE POLICY "Allow authenticated users full access to customers"
    ON customers FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to customer_addresses"
    ON customer_addresses FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to customer_payment_methods"
    ON customer_payment_methods FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to products"
    ON products FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to gateways"
    ON gateways FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to orders"
    ON orders FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to order_items"
    ON order_items FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to transactions"
    ON transactions FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to transaction_logs"
    ON transaction_logs FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Service role bypass (for Edge Functions)
-- The service_role key automatically bypasses RLS

-- ============================================
-- HELPER VIEWS
-- ============================================

-- Customer with aggregated data
CREATE VIEW customer_summary AS
SELECT
    c.*,
    COUNT(DISTINCT o.id) as total_orders,
    COALESCE(SUM(o.total), 0) as lifetime_value,
    MAX(o.created_at) as last_order_date
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id AND o.payment_status = 'paid'
GROUP BY c.id;

-- Gateway performance metrics
CREATE VIEW gateway_metrics AS
SELECT
    g.id,
    g.name,
    g.gateway_type,
    g.is_active,
    g.priority,
    g.monthly_cap,
    g.current_month_volume,
    COUNT(t.id) as total_transactions,
    COUNT(CASE WHEN t.status = 'succeeded' THEN 1 END) as successful_transactions,
    COUNT(CASE WHEN t.status = 'declined' THEN 1 END) as declined_transactions,
    CASE
        WHEN COUNT(t.id) > 0
        THEN ROUND(COUNT(CASE WHEN t.status = 'succeeded' THEN 1 END)::numeric / COUNT(t.id) * 100, 2)
        ELSE 0
    END as approval_rate
FROM gateways g
LEFT JOIN transactions t ON g.id = t.gateway_id
    AND t.created_at >= date_trunc('month', CURRENT_DATE)
GROUP BY g.id;

-- Daily revenue summary
CREATE VIEW daily_revenue AS
SELECT
    DATE(created_at) as date,
    COUNT(*) as order_count,
    SUM(total) as gross_revenue,
    SUM(CASE WHEN payment_status = 'refunded' THEN total ELSE 0 END) as refunds,
    SUM(CASE WHEN payment_status = 'paid' THEN total ELSE 0 END) as net_revenue
FROM orders
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Grant access to views
GRANT SELECT ON customer_summary TO authenticated;
GRANT SELECT ON gateway_metrics TO authenticated;
GRANT SELECT ON daily_revenue TO authenticated;
