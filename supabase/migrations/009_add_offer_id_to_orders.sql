-- Add offer_id column to orders table
-- This was missing but is required by the checkout payment flow

ALTER TABLE orders ADD COLUMN IF NOT EXISTS offer_id UUID REFERENCES campaign_offers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_offer_id ON orders(offer_id);

-- Rename 'type' to 'address_type' in customer_addresses for clarity
-- The code expects address_type but schema originally had 'type'
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'customer_addresses' AND column_name = 'type') THEN
        ALTER TABLE customer_addresses RENAME COLUMN type TO address_type;
    END IF;
END $$;
 