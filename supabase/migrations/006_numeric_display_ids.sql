-- Numeric Display IDs
-- Version: 1.0.0
-- Adds human-readable numeric IDs for display purposes

-- ============================================
-- CAMPAIGNS TABLE
-- ============================================

-- Add display_id column with auto-increment
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS display_id SERIAL;

-- Create unique index on display_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaigns_display_id ON campaigns(display_id);

-- ============================================
-- PRODUCTS TABLE
-- ============================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS display_id SERIAL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_display_id ON products(display_id);

-- ============================================
-- CUSTOMERS TABLE
-- ============================================

ALTER TABLE customers ADD COLUMN IF NOT EXISTS display_id SERIAL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_display_id ON customers(display_id);

-- ============================================
-- ORDERS TABLE
-- ============================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS display_id SERIAL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_display_id ON orders(display_id);

-- ============================================
-- GATEWAYS TABLE
-- ============================================

ALTER TABLE gateways ADD COLUMN IF NOT EXISTS display_id SERIAL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_gateways_display_id ON gateways(display_id);

-- ============================================
-- CAMPAIGN OFFERS TABLE
-- ============================================

ALTER TABLE campaign_offers ADD COLUMN IF NOT EXISTS display_id SERIAL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_offers_display_id ON campaign_offers(display_id);

-- ============================================
-- CAMPAIGN UPSELLS TABLE
-- ============================================

ALTER TABLE campaign_upsells ADD COLUMN IF NOT EXISTS display_id SERIAL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_upsells_display_id ON campaign_upsells(display_id);
