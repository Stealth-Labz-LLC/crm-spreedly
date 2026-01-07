-- Offer Billing Schedules
-- Version: 1.0.0
-- Adds subscription/recurring billing support to campaign offers

-- ============================================
-- ALTER CAMPAIGN_OFFERS TABLE
-- ============================================

-- Add billing schedule fields to campaign_offers
ALTER TABLE campaign_offers ADD COLUMN IF NOT EXISTS billing_type VARCHAR(20) DEFAULT 'one_time' CHECK (billing_type IN ('one_time', 'recurring', 'installment'));
ALTER TABLE campaign_offers ADD COLUMN IF NOT EXISTS gateway_id UUID REFERENCES gateways(id);
ALTER TABLE campaign_offers ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);
ALTER TABLE campaign_offers ADD COLUMN IF NOT EXISTS dynamic_descriptor VARCHAR(100);
ALTER TABLE campaign_offers ADD COLUMN IF NOT EXISTS qty_per_order INTEGER DEFAULT 1;
ALTER TABLE campaign_offers ADD COLUMN IF NOT EXISTS ship_price DECIMAL(10,2) DEFAULT 0;

-- Billing schedule options
ALTER TABLE campaign_offers ADD COLUMN IF NOT EXISTS final_billing_cycle INTEGER;
ALTER TABLE campaign_offers ADD COLUMN IF NOT EXISTS fixed_billing_day INTEGER CHECK (fixed_billing_day IS NULL OR (fixed_billing_day >= 1 AND fixed_billing_day <= 28));
ALTER TABLE campaign_offers ADD COLUMN IF NOT EXISTS persistent_rebill_day BOOLEAN DEFAULT false;
ALTER TABLE campaign_offers ADD COLUMN IF NOT EXISTS stagger_fulfillments BOOLEAN DEFAULT false;
ALTER TABLE campaign_offers ADD COLUMN IF NOT EXISTS stagger_payments BOOLEAN DEFAULT false;
ALTER TABLE campaign_offers ADD COLUMN IF NOT EXISTS use_chargeback_protection BOOLEAN DEFAULT false;
ALTER TABLE campaign_offers ADD COLUMN IF NOT EXISTS delay_fulfillment_on_rebill BOOLEAN DEFAULT false;
ALTER TABLE campaign_offers ADD COLUMN IF NOT EXISTS fulfillment_delay_days INTEGER DEFAULT 1;
ALTER TABLE campaign_offers ADD COLUMN IF NOT EXISTS bill_on_saturday BOOLEAN DEFAULT false;
ALTER TABLE campaign_offers ADD COLUMN IF NOT EXISTS bundle_subscriptions BOOLEAN DEFAULT false;
ALTER TABLE campaign_offers ADD COLUMN IF NOT EXISTS block_prepaid_cards BOOLEAN DEFAULT false;
ALTER TABLE campaign_offers ADD COLUMN IF NOT EXISTS stand_alone_transaction BOOLEAN DEFAULT false;

-- Trial options
ALTER TABLE campaign_offers ADD COLUMN IF NOT EXISTS trial_enabled BOOLEAN DEFAULT false;
ALTER TABLE campaign_offers ADD COLUMN IF NOT EXISTS trial_type VARCHAR(20) CHECK (trial_type IS NULL OR trial_type IN ('free', 'paid', 'shipping_only'));
ALTER TABLE campaign_offers ADD COLUMN IF NOT EXISTS trial_auth_type VARCHAR(20) DEFAULT 'none' CHECK (trial_auth_type IN ('none', 'full', 'partial'));
ALTER TABLE campaign_offers ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 0;
ALTER TABLE campaign_offers ADD COLUMN IF NOT EXISTS trial_price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE campaign_offers ADD COLUMN IF NOT EXISTS allow_multiple_trials BOOLEAN DEFAULT false;

-- Order limits
ALTER TABLE campaign_offers ADD COLUMN IF NOT EXISTS max_price DECIMAL(10,2);
ALTER TABLE campaign_offers ADD COLUMN IF NOT EXISTS max_quantity INTEGER;

-- ============================================
-- OFFER BILLING CYCLES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS offer_billing_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES campaign_offers(id) ON DELETE CASCADE,
  cycle_number INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  ship_price DECIMAL(10,2) DEFAULT 0,
  bill_delay_days INTEGER NOT NULL DEFAULT 30,
  is_shippable BOOLEAN DEFAULT true,
  product_id UUID REFERENCES products(id),
  combination_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(offer_id, cycle_number)
);

CREATE INDEX IF NOT EXISTS idx_offer_billing_cycles_offer_id ON offer_billing_cycles(offer_id);

-- Enable RLS
ALTER TABLE offer_billing_cycles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read access for authenticated users" ON offer_billing_cycles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON offer_billing_cycles
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON offer_billing_cycles
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON offer_billing_cycles
  FOR DELETE TO authenticated USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_offer_billing_cycles_updated_at
  BEFORE UPDATE ON offer_billing_cycles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
