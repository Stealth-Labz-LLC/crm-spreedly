-- Campaign Categories Table
-- Version: 1.0.0
-- Stores campaign categories for organization

CREATE TABLE IF NOT EXISTS campaign_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_categories_name ON campaign_categories(name);

-- Enable RLS
ALTER TABLE campaign_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read access for authenticated users" ON campaign_categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON campaign_categories
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON campaign_categories
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON campaign_categories
  FOR DELETE TO authenticated USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_campaign_categories_updated_at
  BEFORE UPDATE ON campaign_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
