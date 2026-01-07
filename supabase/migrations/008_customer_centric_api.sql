-- ============================================
-- CUSTOMER-CENTRIC MODEL WITH API ACCESS
-- Konnektive-style: Everything flows through customers
-- External funnels connect via API key
-- ============================================

-- ============================================
-- API SETTINGS (Account-level)
-- ============================================

CREATE TABLE api_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key VARCHAR(64) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  api_secret VARCHAR(64) NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active BOOLEAN DEFAULT true,

  -- Rate limiting
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_day INTEGER DEFAULT 10000,

  -- Allowed origins (for CORS)
  allowed_origins TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Webhook settings
  webhook_url TEXT,
  webhook_events TEXT[] DEFAULT ARRAY['customer.created', 'order.created', 'order.paid', 'order.declined']::TEXT[],
  webhook_secret VARCHAR(64) DEFAULT encode(gen_random_bytes(32), 'hex'),

  -- Metadata
  name VARCHAR(100) DEFAULT 'Default API Key',
  description TEXT,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default API key
INSERT INTO api_settings (name, description)
VALUES ('Primary API Key', 'Main API key for external funnel integrations');

CREATE INDEX idx_api_settings_api_key ON api_settings(api_key);

-- ============================================
-- ENHANCE CUSTOMERS TABLE
-- Add funnel tracking fields
-- ============================================

-- Customer funnel status
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_status VARCHAR(30) DEFAULT 'prospect'
  CHECK (customer_status IN ('prospect', 'lead', 'partial', 'customer', 'declined', 'cancelled', 'refunded'));

-- Source tracking
ALTER TABLE customers ADD COLUMN IF NOT EXISTS source_campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS source_offer_id UUID REFERENCES campaign_offers(id) ON DELETE SET NULL;

-- UTM tracking
ALTER TABLE customers ADD COLUMN IF NOT EXISTS utm_source VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS utm_content VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS utm_term VARCHAR(255);

-- Session/Visit tracking
ALTER TABLE customers ADD COLUMN IF NOT EXISTS session_id VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS referrer TEXT;

-- Address fields (for checkout before order)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ship_address_1 VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ship_address_2 VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ship_city VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ship_state VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ship_postal_code VARCHAR(20);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ship_country VARCHAR(2) DEFAULT 'US';

ALTER TABLE customers ADD COLUMN IF NOT EXISTS bill_same_as_ship BOOLEAN DEFAULT true;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS bill_address_1 VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS bill_address_2 VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS bill_city VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS bill_state VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS bill_postal_code VARCHAR(20);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS bill_country VARCHAR(2) DEFAULT 'US';

-- Decline tracking
ALTER TABLE customers ADD COLUMN IF NOT EXISTS decline_count INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_decline_reason TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_decline_code VARCHAR(50);

-- Conversion tracking
ALTER TABLE customers ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS first_order_id UUID REFERENCES orders(id) ON DELETE SET NULL;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS lifetime_value DECIMAL(12,2) DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0;

-- Custom fields from funnel
ALTER TABLE customers ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customers_customer_status ON customers(customer_status);
CREATE INDEX IF NOT EXISTS idx_customers_source_campaign ON customers(source_campaign_id);
CREATE INDEX IF NOT EXISTS idx_customers_source_offer ON customers(source_offer_id);
CREATE INDEX IF NOT EXISTS idx_customers_session_id ON customers(session_id);
CREATE INDEX IF NOT EXISTS idx_customers_converted_at ON customers(converted_at);

-- ============================================
-- CUSTOMER STATUS HISTORY
-- Track status changes
-- ============================================

CREATE TABLE IF NOT EXISTS customer_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  from_status VARCHAR(30),
  to_status VARCHAR(30) NOT NULL,
  changed_by VARCHAR(100) DEFAULT 'system', -- 'system', 'api', 'admin', or user email
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customer_status_history_customer_id ON customer_status_history(customer_id);
CREATE INDEX idx_customer_status_history_created_at ON customer_status_history(created_at);

-- Trigger to track status changes
CREATE OR REPLACE FUNCTION track_customer_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.customer_status IS DISTINCT FROM NEW.customer_status THEN
        INSERT INTO customer_status_history (customer_id, from_status, to_status)
        VALUES (NEW.id, OLD.customer_status, NEW.customer_status);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS customer_status_change_trigger ON customers;
CREATE TRIGGER customer_status_change_trigger
    AFTER UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION track_customer_status_change();

-- ============================================
-- API REQUEST LOG
-- Track all external API requests
-- ============================================

CREATE TABLE api_request_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_settings(id) ON DELETE SET NULL,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  request_body JSONB,
  response_status INTEGER,
  response_body JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_request_log_api_key ON api_request_log(api_key_id);
CREATE INDEX idx_api_request_log_endpoint ON api_request_log(endpoint);
CREATE INDEX idx_api_request_log_created_at ON api_request_log(created_at DESC);

-- Partition by month for performance (optional, can be enabled later)
-- CREATE INDEX idx_api_request_log_created_at_brin ON api_request_log USING BRIN (created_at);

-- ============================================
-- CONNECTED DOMAINS
-- Track domains that can use specific campaigns
-- ============================================

CREATE TABLE connected_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain VARCHAR(255) NOT NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  ssl_verified BOOLEAN DEFAULT false,

  -- Settings
  allow_test_mode BOOLEAN DEFAULT false,
  auto_capture BOOLEAN DEFAULT true, -- Auto capture auth or wait

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(domain, campaign_id)
);

CREATE INDEX idx_connected_domains_domain ON connected_domains(domain);
CREATE INDEX idx_connected_domains_campaign ON connected_domains(campaign_id);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE api_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_request_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE connected_domains ENABLE ROW LEVEL SECURITY;

-- Authenticated users (admin) have full access
CREATE POLICY "Authenticated users can manage api_settings"
    ON api_settings FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view customer_status_history"
    ON customer_status_history FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view api_request_log"
    ON api_request_log FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage connected_domains"
    ON connected_domains FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

-- ============================================
-- VIEWS
-- ============================================

-- Customer funnel metrics
CREATE OR REPLACE VIEW customer_funnel_metrics AS
SELECT
    c.id as campaign_id,
    c.name as campaign_name,
    co.id as offer_id,
    co.name as offer_name,
    DATE(cust.created_at) as metric_date,
    COUNT(*) as total_customers,
    COUNT(CASE WHEN cust.customer_status IN ('lead', 'partial', 'customer', 'declined') THEN 1 END) as leads,
    COUNT(CASE WHEN cust.customer_status IN ('partial', 'customer', 'declined') THEN 1 END) as partials,
    COUNT(CASE WHEN cust.customer_status = 'customer' THEN 1 END) as customers,
    COUNT(CASE WHEN cust.customer_status = 'declined' THEN 1 END) as declined,
    SUM(CASE WHEN cust.customer_status = 'customer' THEN cust.lifetime_value ELSE 0 END) as revenue,
    ROUND(
        COUNT(CASE WHEN cust.customer_status = 'customer' THEN 1 END)::numeric /
        NULLIF(COUNT(*), 0) * 100, 2
    ) as conversion_rate
FROM campaigns c
LEFT JOIN campaign_offers co ON c.id = co.campaign_id
LEFT JOIN customers cust ON co.id = cust.source_offer_id
GROUP BY c.id, c.name, co.id, co.name, DATE(cust.created_at);

-- API usage summary
CREATE OR REPLACE VIEW api_usage_summary AS
SELECT
    DATE(created_at) as date,
    COUNT(*) as total_requests,
    COUNT(CASE WHEN response_status >= 200 AND response_status < 300 THEN 1 END) as successful,
    COUNT(CASE WHEN response_status >= 400 THEN 1 END) as failed,
    AVG(duration_ms) as avg_duration_ms
FROM api_request_log
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ============================================
-- UPDATE TRIGGERS
-- ============================================

CREATE TRIGGER update_api_settings_updated_at
    BEFORE UPDATE ON api_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connected_domains_updated_at
    BEFORE UPDATE ON connected_domains
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
