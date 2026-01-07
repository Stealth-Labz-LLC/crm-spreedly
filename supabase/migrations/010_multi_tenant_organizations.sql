-- Migration: 010_multi_tenant_organizations.sql
-- Description: Add multi-tenant support with organizations, user profiles, and team members
-- Date: 2026-01-07

-- =====================================================
-- PART 1: Core Multi-Tenant Tables
-- =====================================================

-- Organizations table (primary tenant entity)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id SERIAL UNIQUE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,

  -- Subscription/billing
  plan VARCHAR(50) DEFAULT 'starter' CHECK (plan IN ('starter', 'professional', 'enterprise', 'custom')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('trial', 'active', 'suspended', 'cancelled')),
  trial_ends_at TIMESTAMPTZ,

  -- Limits per plan
  max_users INTEGER DEFAULT 5,
  max_api_calls_per_month INTEGER DEFAULT 10000,

  -- Branding
  logo_url TEXT,
  primary_color VARCHAR(7), -- hex color like #FF5733

  -- Settings
  timezone VARCHAR(50) DEFAULT 'UTC',
  currency VARCHAR(3) DEFAULT 'USD',

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for organizations
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_status ON organizations(status);
CREATE INDEX idx_organizations_plan ON organizations(plan);
CREATE INDEX idx_organizations_created_at ON organizations(created_at DESC);

-- Comment on organizations table
COMMENT ON TABLE organizations IS 'Primary tenant entity - each organization represents a separate business/company using the CRM';
COMMENT ON COLUMN organizations.slug IS 'URL-friendly identifier for organization';
COMMENT ON COLUMN organizations.max_users IS 'Maximum team members allowed based on plan';
COMMENT ON COLUMN organizations.max_api_calls_per_month IS 'API rate limit per organization';


-- User profiles table (links auth.users to organizations)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,

  -- Current active organization (for quick context lookup)
  current_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for user_profiles
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_current_org ON user_profiles(current_organization_id);

-- Comment on user_profiles table
COMMENT ON TABLE user_profiles IS 'Extended user profile information linked to auth.users';
COMMENT ON COLUMN user_profiles.current_organization_id IS 'The organization currently active for this user (for multi-org members)';


-- Organization members table (junction table with roles)
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Role-based access control
  role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('invited', 'active', 'suspended')),

  -- Permissions (for future granular control)
  permissions JSONB DEFAULT '{}',

  -- Invitation tracking
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, user_id)
);

-- Indexes for organization_members
CREATE INDEX idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX idx_org_members_role ON organization_members(role);
CREATE INDEX idx_org_members_status ON organization_members(status);
CREATE INDEX idx_org_members_org_user ON organization_members(organization_id, user_id);

-- Comment on organization_members table
COMMENT ON TABLE organization_members IS 'Junction table linking users to organizations with roles';
COMMENT ON COLUMN organization_members.role IS 'owner: full control, admin: manage team, member: basic access';
COMMENT ON COLUMN organization_members.permissions IS 'Future: granular permissions in JSONB format';


-- Organization invitations table (pending team invites)
CREATE TABLE organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),

  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),

  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  accepted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, email)
);

-- Indexes for organization_invitations
CREATE INDEX idx_org_invitations_org_id ON organization_invitations(organization_id);
CREATE INDEX idx_org_invitations_email ON organization_invitations(email);
CREATE INDEX idx_org_invitations_token ON organization_invitations(token);
CREATE INDEX idx_org_invitations_expires_at ON organization_invitations(expires_at);

-- Comment on organization_invitations table
COMMENT ON TABLE organization_invitations IS 'Pending team member invitations with time-limited tokens';
COMMENT ON COLUMN organization_invitations.token IS 'Unique token for invitation acceptance URL';
COMMENT ON COLUMN organization_invitations.expires_at IS 'Invitation expires after 7 days';


-- =====================================================
-- PART 2: Add organization_id to Existing Tables
-- =====================================================

-- Add organization_id to all tenant-scoped tables (only if they exist)
DO $$
BEGIN
  -- Customers
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_customers_org_id ON customers(organization_id);
    COMMENT ON COLUMN customers.organization_id IS 'Links customer to tenant organization';
  END IF;

  -- Products
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    ALTER TABLE products ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_products_org_id ON products(organization_id);
    COMMENT ON COLUMN products.organization_id IS 'Links product to tenant organization';
  END IF;

  -- Campaigns
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'campaigns') THEN
    ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_campaigns_org_id ON campaigns(organization_id);
    COMMENT ON COLUMN campaigns.organization_id IS 'Links campaign to tenant organization';
  END IF;

  -- Gateways
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gateways') THEN
    ALTER TABLE gateways ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_gateways_org_id ON gateways(organization_id);
    COMMENT ON COLUMN gateways.organization_id IS 'Links payment gateway to tenant organization';
  END IF;

  -- Orders
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_orders_org_id ON orders(organization_id);
    COMMENT ON COLUMN orders.organization_id IS 'Links order to tenant organization';
  END IF;

  -- API Settings
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'api_settings') THEN
    ALTER TABLE api_settings ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_api_settings_org_id ON api_settings(organization_id);
    COMMENT ON COLUMN api_settings.organization_id IS 'Links API key to tenant organization';
  END IF;

  -- Connected Domains
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'connected_domains') THEN
    ALTER TABLE connected_domains ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_connected_domains_org_id ON connected_domains(organization_id);
    COMMENT ON COLUMN connected_domains.organization_id IS 'Links custom domain to tenant organization';
  END IF;

  -- Leads (optional table)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_leads_org_id ON leads(organization_id);
    COMMENT ON COLUMN leads.organization_id IS 'Links lead to tenant organization';
  END IF;

  RAISE NOTICE 'Successfully added organization_id to all existing tables';
END $$;


-- =====================================================
-- PART 3: Row-Level Security (RLS) Helper Functions
-- =====================================================

-- Helper function to get all organizations a user belongs to
CREATE OR REPLACE FUNCTION public.user_organizations()
RETURNS SETOF UUID AS $$
  SELECT organization_id
  FROM public.organization_members
  WHERE user_id = auth.uid()
    AND status = 'active'
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.user_organizations() IS 'Returns UUIDs of all organizations the current user is an active member of';


-- Helper function to check if user is member of specific organization
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1
    FROM public.organization_members
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND status = 'active'
  )
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.is_org_member(UUID) IS 'Checks if current user is an active member of specified organization';


-- Helper function to get user's role in specific organization
CREATE OR REPLACE FUNCTION public.user_org_role(org_id UUID)
RETURNS TEXT AS $$
  SELECT role::TEXT
  FROM public.organization_members
  WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND status = 'active'
  LIMIT 1
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.user_org_role(UUID) IS 'Returns user role (owner/admin/member) in specified organization';


-- Helper function to check if user has owner or admin role
CREATE OR REPLACE FUNCTION public.is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1
    FROM public.organization_members
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND status = 'active'
      AND role IN ('owner', 'admin')
  )
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.is_org_admin(UUID) IS 'Checks if current user is owner or admin of specified organization';


-- =====================================================
-- PART 4: Row-Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can view their own organizations
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (id IN (SELECT public.user_organizations()));

CREATE POLICY "Owners and admins can update their organizations"
  ON organizations FOR UPDATE
  TO authenticated
  USING (public.is_org_admin(id))
  WITH CHECK (public.is_org_admin(id));

-- User Profiles: Users can view all profiles (for team pages), update their own
CREATE POLICY "Users can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Organization Members: View members of your organizations
CREATE POLICY "Users can view members of their organizations"
  ON organization_members FOR SELECT
  TO authenticated
  USING (organization_id IN (SELECT public.user_organizations()));

CREATE POLICY "Owners and admins can manage members"
  ON organization_members FOR ALL
  TO authenticated
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));

-- Organization Invitations: Only admins can manage invitations
CREATE POLICY "Admins can view invitations"
  ON organization_invitations FOR SELECT
  TO authenticated
  USING (public.is_org_admin(organization_id));

CREATE POLICY "Admins can create invitations"
  ON organization_invitations FOR INSERT
  TO authenticated
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY "Admins can delete invitations"
  ON organization_invitations FOR DELETE
  TO authenticated
  USING (public.is_org_admin(organization_id));

-- Update RLS policies for tenant-scoped tables (only if tables exist)
DO $$
BEGIN
  -- Customers
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
    DROP POLICY IF EXISTS "Allow authenticated users full access to customers" ON customers;
    CREATE POLICY "Users can access customers in their organizations"
      ON customers FOR ALL
      TO authenticated
      USING (organization_id IN (SELECT public.user_organizations()))
      WITH CHECK (organization_id IN (SELECT public.user_organizations()));
  END IF;

  -- Products
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    DROP POLICY IF EXISTS "Allow authenticated users full access to products" ON products;
    CREATE POLICY "Users can access products in their organizations"
      ON products FOR ALL
      TO authenticated
      USING (organization_id IN (SELECT public.user_organizations()))
      WITH CHECK (organization_id IN (SELECT public.user_organizations()));
  END IF;

  -- Campaigns
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'campaigns') THEN
    DROP POLICY IF EXISTS "Allow authenticated users full access to campaigns" ON campaigns;
    CREATE POLICY "Users can access campaigns in their organizations"
      ON campaigns FOR ALL
      TO authenticated
      USING (organization_id IN (SELECT public.user_organizations()))
      WITH CHECK (organization_id IN (SELECT public.user_organizations()));
  END IF;

  -- Gateways
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gateways') THEN
    DROP POLICY IF EXISTS "Allow authenticated users full access to gateways" ON gateways;
    CREATE POLICY "Users can access gateways in their organizations"
      ON gateways FOR ALL
      TO authenticated
      USING (organization_id IN (SELECT public.user_organizations()))
      WITH CHECK (organization_id IN (SELECT public.user_organizations()));
  END IF;

  -- Orders
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    DROP POLICY IF EXISTS "Allow authenticated users full access to orders" ON orders;
    CREATE POLICY "Users can access orders in their organizations"
      ON orders FOR ALL
      TO authenticated
      USING (organization_id IN (SELECT public.user_organizations()))
      WITH CHECK (organization_id IN (SELECT public.user_organizations()));
  END IF;

  -- API Settings
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'api_settings') THEN
    DROP POLICY IF EXISTS "Allow authenticated users full access to api_settings" ON api_settings;
    CREATE POLICY "Users can access api_settings in their organizations"
      ON api_settings FOR ALL
      TO authenticated
      USING (organization_id IN (SELECT public.user_organizations()))
      WITH CHECK (organization_id IN (SELECT public.user_organizations()));
  END IF;

  -- Connected Domains
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'connected_domains') THEN
    DROP POLICY IF EXISTS "Allow authenticated users full access to connected_domains" ON connected_domains;
    CREATE POLICY "Users can access connected_domains in their organizations"
      ON connected_domains FOR ALL
      TO authenticated
      USING (organization_id IN (SELECT public.user_organizations()))
      WITH CHECK (organization_id IN (SELECT public.user_organizations()));
  END IF;

  -- Leads
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN
    DROP POLICY IF EXISTS "Allow authenticated users full access to leads" ON leads;
    CREATE POLICY "Users can access leads in their organizations"
      ON leads FOR ALL
      TO authenticated
      USING (organization_id IN (SELECT public.user_organizations()))
      WITH CHECK (organization_id IN (SELECT public.user_organizations()));
  END IF;

  -- Customer Status History (inherits from customers)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customer_status_history') THEN
    DROP POLICY IF EXISTS "Allow authenticated users full access to customer_status_history" ON customer_status_history;
    CREATE POLICY "Users can access customer_status_history via customers"
      ON customer_status_history FOR ALL
      TO authenticated
      USING (
        customer_id IN (
          SELECT id FROM customers WHERE organization_id IN (SELECT public.user_organizations())
        )
      );
  END IF;

  -- API Request Log (inherits from api_settings)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'api_request_log') THEN
    DROP POLICY IF EXISTS "Allow authenticated users full access to api_request_log" ON api_request_log;
    CREATE POLICY "Users can access api_request_log via api_settings"
      ON api_request_log FOR ALL
      TO authenticated
      USING (
        api_key_id IN (
          SELECT id FROM api_settings WHERE organization_id IN (SELECT public.user_organizations())
        )
      );
  END IF;

  RAISE NOTICE 'Successfully updated RLS policies for all existing tables';
END $$;


-- =====================================================
-- PART 5: Triggers
-- =====================================================

-- Trigger to update updated_at timestamp on organizations
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at timestamp on user_profiles
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at timestamp on organization_members
CREATE TRIGGER update_organization_members_updated_at
  BEFORE UPDATE ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- =====================================================
-- PART 6: Functions for Organization Management
-- =====================================================

-- Function to create organization with owner
CREATE OR REPLACE FUNCTION create_organization_with_owner(
  p_user_id UUID,
  p_user_email VARCHAR,
  p_org_name VARCHAR,
  p_org_slug VARCHAR,
  p_plan VARCHAR DEFAULT 'starter'
)
RETURNS UUID AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Create organization
  INSERT INTO organizations (name, slug, plan, status)
  VALUES (p_org_name, p_org_slug, p_plan, 'active')
  RETURNING id INTO v_org_id;

  -- Create user profile
  INSERT INTO user_profiles (id, email, current_organization_id)
  VALUES (p_user_id, p_user_email, v_org_id)
  ON CONFLICT (id) DO UPDATE
  SET current_organization_id = v_org_id;

  -- Create organization member (owner)
  INSERT INTO organization_members (organization_id, user_id, role, status, joined_at)
  VALUES (v_org_id, p_user_id, 'owner', 'active', NOW());

  -- Create default API settings for organization
  INSERT INTO api_settings (
    organization_id,
    api_key,
    api_secret,
    rate_limit_per_minute,
    rate_limit_per_day,
    is_active
  )
  VALUES (
    v_org_id,
    encode(gen_random_bytes(24), 'hex'),
    encode(gen_random_bytes(32), 'hex'),
    60,
    10000,
    true
  );

  RETURN v_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_organization_with_owner IS 'Creates new organization with user as owner, includes user profile and default API settings';


-- Function to switch user's current organization
CREATE OR REPLACE FUNCTION switch_current_organization(
  p_user_id UUID,
  p_org_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_member BOOLEAN;
BEGIN
  -- Check if user is active member of the organization
  SELECT EXISTS(
    SELECT 1 FROM organization_members
    WHERE organization_id = p_org_id
      AND user_id = p_user_id
      AND status = 'active'
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RAISE EXCEPTION 'User is not an active member of this organization';
  END IF;

  -- Update current organization
  UPDATE user_profiles
  SET current_organization_id = p_org_id,
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION switch_current_organization IS 'Switches user current active organization after verifying membership';


-- =====================================================
-- PART 7: Initial Data & Comments
-- =====================================================

-- Note: Existing data migration is handled in a separate migration file (011_migrate_existing_data.sql)
-- This keeps the schema changes separate from data migration for easier rollback

-- Add helpful comments
COMMENT ON SCHEMA public IS 'Multi-tenant CRM schema with organization-level data isolation';
