-- Campaign Management System
-- Version: 1.0.2
-- Konnektive-style campaign management with product binding, offers, and analytics

-- ============================================
-- CAMPAIGNS (Core Table)
-- ============================================

CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE,
  description TEXT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  campaign_type VARCHAR(50) DEFAULT 'web' CHECK (campaign_type IN ('phone', 'web', 'retail', 'wholesale')),
  category VARCHAR(100),
  currency VARCHAR(3) DEFAULT 'USD',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,

  -- Basic Options
  list_in_order_entry BOOLEAN DEFAULT true,
  quality_assurance BOOLEAN DEFAULT false,
  must_agree_tos BOOLEAN DEFAULT false,

  -- Billing Options
  preauth_only BOOLEAN DEFAULT false,
  route_to_pinless_debit BOOLEAN DEFAULT false,
  accept_cod BOOLEAN DEFAULT false,
  retail_orders BOOLEAN DEFAULT false,

  -- Card Blocking
  block_prepaid BOOLEAN DEFAULT false,
  block_debit BOOLEAN DEFAULT false,
  block_visa BOOLEAN DEFAULT false,
  block_mastercard BOOLEAN DEFAULT false,
  block_amex BOOLEAN DEFAULT false,
  block_discover BOOLEAN DEFAULT false,

  -- Shipping Options
  capture_on_shipment BOOLEAN DEFAULT false,
  bundle_fulfillment BOOLEAN DEFAULT false,
  fulfillment_delay_hours INTEGER DEFAULT 24,

  -- Other Options
  screen_with_fraud_manager BOOLEAN DEFAULT false,
  chargeback_blacklist BOOLEAN DEFAULT false,
  max_total_value DECIMAL(10,2) DEFAULT 0,
  min_total_value DECIMAL(10,2) DEFAULT 0,
  max_coupons INTEGER DEFAULT 1,
  reorder_days INTEGER DEFAULT 0,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_campaign_type ON campaigns(campaign_type);
CREATE INDEX idx_campaigns_slug ON campaigns(slug);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at DESC);

-- ============================================
-- CAMPAIGN PRODUCTS (Product Binding)
-- ============================================

CREATE TABLE campaign_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  price_override DECIMAL(10,2),
  discount_amount DECIMAL(10,2),
  discount_percent DECIMAL(5,2),
  quantity_limit INTEGER,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, product_id)
);

CREATE INDEX idx_campaign_products_campaign_id ON campaign_products(campaign_id);
CREATE INDEX idx_campaign_products_product_id ON campaign_products(product_id);
CREATE INDEX idx_campaign_products_position ON campaign_products(position);

-- ============================================
-- CAMPAIGN OFFERS (Promotional Offers)
-- ============================================

CREATE TABLE campaign_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  offer_type VARCHAR(50) DEFAULT 'standard' CHECK (offer_type IN ('standard', 'trial', 'continuity', 'upsell', 'downsell')),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  price_override DECIMAL(10,2),
  discount_type VARCHAR(20) CHECK (discount_type IN ('fixed', 'percentage', 'free')),
  discount_value DECIMAL(10,2),
  billing_model_id VARCHAR(100),
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaign_offers_campaign_id ON campaign_offers(campaign_id);
CREATE INDEX idx_campaign_offers_product_id ON campaign_offers(product_id);
CREATE INDEX idx_campaign_offers_offer_type ON campaign_offers(offer_type);
CREATE INDEX idx_campaign_offers_position ON campaign_offers(position);

-- ============================================
-- CAMPAIGN UPSELLS
-- ============================================

CREATE TABLE campaign_upsells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  upsell_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  discount_type VARCHAR(20) CHECK (discount_type IN ('fixed', 'percentage', 'free')),
  discount_value DECIMAL(10,2),
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaign_upsells_campaign_id ON campaign_upsells(campaign_id);
CREATE INDEX idx_campaign_upsells_trigger_product_id ON campaign_upsells(trigger_product_id);
CREATE INDEX idx_campaign_upsells_upsell_product_id ON campaign_upsells(upsell_product_id);

-- ============================================
-- CAMPAIGN COUNTRIES
-- ============================================

CREATE TABLE campaign_countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  country_code VARCHAR(2) NOT NULL,
  country_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, country_code)
);

CREATE INDEX idx_campaign_countries_campaign_id ON campaign_countries(campaign_id);
CREATE INDEX idx_campaign_countries_country_code ON campaign_countries(country_code);

-- ============================================
-- CAMPAIGN SHIPPING OPTIONS
-- ============================================

CREATE TABLE campaign_shipping_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  carrier VARCHAR(100),
  method VARCHAR(100),
  base_cost DECIMAL(10,2) DEFAULT 0,
  per_item_cost DECIMAL(10,2) DEFAULT 0,
  free_threshold DECIMAL(10,2),
  estimated_days_min INTEGER,
  estimated_days_max INTEGER,
  is_active BOOLEAN DEFAULT true,
  position INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaign_shipping_options_campaign_id ON campaign_shipping_options(campaign_id);
CREATE INDEX idx_campaign_shipping_options_position ON campaign_shipping_options(position);

-- ============================================
-- CAMPAIGN SALES TAX
-- ============================================

CREATE TABLE campaign_sales_tax (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  country_code VARCHAR(2) NOT NULL,
  state_code VARCHAR(10),
  tax_rate DECIMAL(5,4) NOT NULL,
  tax_name VARCHAR(100),
  is_inclusive BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, country_code, state_code)
);

CREATE INDEX idx_campaign_sales_tax_campaign_id ON campaign_sales_tax(campaign_id);
CREATE INDEX idx_campaign_sales_tax_country_state ON campaign_sales_tax(country_code, state_code);

-- ============================================
-- CAMPAIGN COUPONS
-- ============================================

CREATE TABLE campaign_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100),
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('fixed', 'percentage', 'free_shipping')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_order_value DECIMAL(10,2),
  max_uses INTEGER,
  uses_per_customer INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, code)
);

CREATE INDEX idx_campaign_coupons_campaign_id ON campaign_coupons(campaign_id);
CREATE INDEX idx_campaign_coupons_code ON campaign_coupons(code);
CREATE INDEX idx_campaign_coupons_is_active ON campaign_coupons(is_active);

-- ============================================
-- CAMPAIGN SURCHARGES
-- ============================================

CREATE TABLE campaign_surcharges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  surcharge_type VARCHAR(50) CHECK (surcharge_type IN ('handling', 'processing', 'rush', 'international', 'custom')),
  amount DECIMAL(10,2),
  percentage DECIMAL(5,2),
  apply_to VARCHAR(50) DEFAULT 'order' CHECK (apply_to IN ('order', 'shipping', 'product')),
  is_active BOOLEAN DEFAULT true,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaign_surcharges_campaign_id ON campaign_surcharges(campaign_id);

-- ============================================
-- CAMPAIGN SCRIPTS
-- ============================================

CREATE TABLE campaign_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  script_type VARCHAR(50) NOT NULL CHECK (script_type IN ('header', 'footer', 'checkout', 'thank_you', 'tracking')),
  script_content TEXT,
  is_active BOOLEAN DEFAULT true,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaign_scripts_campaign_id ON campaign_scripts(campaign_id);
CREATE INDEX idx_campaign_scripts_script_type ON campaign_scripts(script_type);

-- ============================================
-- CAMPAIGN CALL CENTERS
-- ============================================

CREATE TABLE campaign_call_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(50) NOT NULL,
  hours_of_operation VARCHAR(255),
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaign_call_centers_campaign_id ON campaign_call_centers(campaign_id);

-- ============================================
-- CAMPAIGN EMAILS
-- ============================================

CREATE TABLE campaign_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  email_type VARCHAR(50) NOT NULL CHECK (email_type IN ('confirmation', 'shipped', 'delivered', 'abandoned', 'subscription_reminder', 'trial_ending', 'custom')),
  name VARCHAR(100),
  subject VARCHAR(255) NOT NULL,
  body_html TEXT,
  body_text TEXT,
  from_name VARCHAR(100),
  from_email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaign_emails_campaign_id ON campaign_emails(campaign_id);
CREATE INDEX idx_campaign_emails_email_type ON campaign_emails(email_type);

-- ============================================
-- CAMPAIGN SMS
-- ============================================

CREATE TABLE campaign_sms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  sms_type VARCHAR(50) NOT NULL CHECK (sms_type IN ('confirmation', 'shipped', 'delivered', 'abandoned', 'subscription_reminder', 'custom')),
  name VARCHAR(100),
  message_template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaign_sms_campaign_id ON campaign_sms(campaign_id);
CREATE INDEX idx_campaign_sms_sms_type ON campaign_sms(sms_type);

-- ============================================
-- CAMPAIGN CUSTOM FIELDS
-- ============================================

CREATE TABLE campaign_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  field_name VARCHAR(100) NOT NULL,
  field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('text', 'number', 'select', 'checkbox', 'date', 'textarea', 'email', 'phone')),
  field_label VARCHAR(255) NOT NULL,
  placeholder VARCHAR(255),
  is_required BOOLEAN DEFAULT false,
  options JSONB DEFAULT '[]',
  validation_rules JSONB DEFAULT '{}',
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, field_name)
);

CREATE INDEX idx_campaign_custom_fields_campaign_id ON campaign_custom_fields(campaign_id);
CREATE INDEX idx_campaign_custom_fields_position ON campaign_custom_fields(position);

-- ============================================
-- CAMPAIGN TERMS OF SERVICE
-- ============================================

CREATE TABLE campaign_terms_of_service (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  version VARCHAR(20) NOT NULL,
  title VARCHAR(255) DEFAULT 'Terms of Service',
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  effective_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaign_terms_of_service_campaign_id ON campaign_terms_of_service(campaign_id);
CREATE INDEX idx_campaign_terms_of_service_is_active ON campaign_terms_of_service(is_active);

-- ============================================
-- CAMPAIGN BLOCKED BINS
-- ============================================

CREATE TABLE campaign_blocked_bins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  bin_prefix VARCHAR(8) NOT NULL,
  reason VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, bin_prefix)
);

CREATE INDEX idx_campaign_blocked_bins_campaign_id ON campaign_blocked_bins(campaign_id);
CREATE INDEX idx_campaign_blocked_bins_bin_prefix ON campaign_blocked_bins(bin_prefix);

-- ============================================
-- CAMPAIGN ANALYTICS
-- ============================================

CREATE TABLE campaign_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  orders_count INTEGER DEFAULT 0,
  orders_value DECIMAL(12,2) DEFAULT 0,
  refunds_count INTEGER DEFAULT 0,
  refunds_value DECIMAL(12,2) DEFAULT 0,
  conversion_rate DECIMAL(5,4) DEFAULT 0,
  avg_order_value DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, metric_date)
);

CREATE INDEX idx_campaign_analytics_campaign_id ON campaign_analytics(campaign_id);
CREATE INDEX idx_campaign_analytics_metric_date ON campaign_analytics(metric_date DESC);
CREATE INDEX idx_campaign_analytics_campaign_date ON campaign_analytics(campaign_id, metric_date DESC);

-- ============================================
-- LINK ORDERS TO CAMPAIGNS
-- ============================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_campaign_id ON orders(campaign_id);

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================

CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_offers_updated_at
    BEFORE UPDATE ON campaign_offers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_scripts_updated_at
    BEFORE UPDATE ON campaign_scripts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_emails_updated_at
    BEFORE UPDATE ON campaign_emails
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_sms_updated_at
    BEFORE UPDATE ON campaign_sms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_terms_of_service_updated_at
    BEFORE UPDATE ON campaign_terms_of_service
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_analytics_updated_at
    BEFORE UPDATE ON campaign_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_upsells ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_shipping_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_sales_tax ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_surcharges ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_call_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_sms ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_terms_of_service ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_blocked_bins ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users full access to campaigns"
    ON campaigns FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to campaign_products"
    ON campaign_products FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to campaign_offers"
    ON campaign_offers FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to campaign_upsells"
    ON campaign_upsells FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to campaign_countries"
    ON campaign_countries FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to campaign_shipping_options"
    ON campaign_shipping_options FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to campaign_sales_tax"
    ON campaign_sales_tax FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to campaign_coupons"
    ON campaign_coupons FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to campaign_surcharges"
    ON campaign_surcharges FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to campaign_scripts"
    ON campaign_scripts FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to campaign_call_centers"
    ON campaign_call_centers FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to campaign_emails"
    ON campaign_emails FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to campaign_sms"
    ON campaign_sms FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to campaign_custom_fields"
    ON campaign_custom_fields FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to campaign_terms_of_service"
    ON campaign_terms_of_service FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to campaign_blocked_bins"
    ON campaign_blocked_bins FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to campaign_analytics"
    ON campaign_analytics FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- HELPER VIEWS
-- ============================================

-- Campaign summary with aggregated data
CREATE VIEW campaign_summary AS
SELECT
    c.*,
    COUNT(DISTINCT cp.id) as products_count,
    COUNT(DISTINCT co.id) as offers_count,
    COUNT(DISTINCT cc.id) as countries_count,
    COALESCE(SUM(ca.orders_count), 0) as total_orders,
    COALESCE(SUM(ca.orders_value), 0) as total_revenue,
    COALESCE(AVG(ca.conversion_rate), 0) as avg_conversion_rate
FROM campaigns c
LEFT JOIN campaign_products cp ON c.id = cp.campaign_id
LEFT JOIN campaign_offers co ON c.id = co.campaign_id
LEFT JOIN campaign_countries cc ON c.id = cc.campaign_id
LEFT JOIN campaign_analytics ca ON c.id = ca.campaign_id
GROUP BY c.id;

GRANT SELECT ON campaign_summary TO authenticated;
