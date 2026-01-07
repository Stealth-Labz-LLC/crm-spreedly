-- Add new product fields for Konnektive-style product management
-- Version: 1.0.1

-- Add new columns to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS category VARCHAR(100),
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS product_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS weight DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS qty_per_order INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS qty_available INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS msrp DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS fulfillment_type VARCHAR(50) DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS fulfillment_delay_hours INTEGER DEFAULT 0;

-- Create index for category
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Create product_categories table for managing categories
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES product_categories(id),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories
INSERT INTO product_categories (name, description, sort_order) VALUES
  ('Physical Products', 'Tangible goods that require shipping', 1),
  ('Digital Products', 'Downloadable or virtual products', 2),
  ('Subscriptions', 'Recurring billing products', 3),
  ('Services', 'One-time or recurring services', 4)
ON CONFLICT (name) DO NOTHING;

-- Enable RLS on product_categories
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view categories"
  ON product_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage categories"
  ON product_categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
