-- Migration: 011_migrate_existing_data.sql
-- Description: Migrate existing single-tenant data to multi-tenant structure with default organization
-- Date: 2026-01-07
-- NOTE: This migration ensures backward compatibility by creating a default organization for existing data

-- =====================================================
-- PART 1: Create Default Organization
-- =====================================================

DO $$
DECLARE
  v_default_org_id UUID;
  v_user_record RECORD;
  v_affected_customers INTEGER;
  v_affected_products INTEGER;
  v_affected_campaigns INTEGER;
  v_affected_gateways INTEGER;
  v_affected_orders INTEGER;
  v_affected_api_settings INTEGER;
  v_affected_domains INTEGER;
  v_affected_leads INTEGER;
BEGIN
  -- Create the default organization
  INSERT INTO organizations (
    name,
    slug,
    plan,
    status,
    max_users,
    max_api_calls_per_month,
    timezone,
    currency
  )
  VALUES (
    'Default Organization',
    'default',
    'enterprise', -- Give enterprise plan to existing users
    'active',
    999, -- High limit for existing organization
    999999, -- High API limit
    'UTC',
    'USD'
  )
  RETURNING id INTO v_default_org_id;

  RAISE NOTICE 'Created default organization with ID: %', v_default_org_id;

  -- =====================================================
  -- PART 2: Create User Profiles for Existing Users
  -- =====================================================

  -- Create user profiles for all existing auth users
  INSERT INTO user_profiles (id, email, current_organization_id, created_at)
  SELECT
    id,
    email,
    v_default_org_id,
    created_at
  FROM auth.users
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Created user profiles for existing users';

  -- =====================================================
  -- PART 3: Create Organization Memberships
  -- =====================================================

  -- Add all existing users as owners of the default organization
  INSERT INTO organization_members (
    organization_id,
    user_id,
    role,
    status,
    joined_at,
    created_at
  )
  SELECT
    v_default_org_id,
    id,
    'owner', -- All existing users get owner role
    'active',
    created_at,
    created_at
  FROM auth.users
  ON CONFLICT (organization_id, user_id) DO NOTHING;

  RAISE NOTICE 'Created organization memberships for existing users';

  -- =====================================================
  -- PART 4: Migrate Existing Data to Default Organization
  -- =====================================================

  -- Update customers (if table exists)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
    UPDATE customers
    SET organization_id = v_default_org_id
    WHERE organization_id IS NULL;

    GET DIAGNOSTICS v_affected_customers = ROW_COUNT;
    RAISE NOTICE 'Migrated % customers to default organization', v_affected_customers;
  ELSE
    RAISE NOTICE 'Customers table does not exist, skipping';
    v_affected_customers := 0;
  END IF;

  -- Update products (if table exists)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    UPDATE products
    SET organization_id = v_default_org_id
    WHERE organization_id IS NULL;

    GET DIAGNOSTICS v_affected_products = ROW_COUNT;
    RAISE NOTICE 'Migrated % products to default organization', v_affected_products;
  ELSE
    RAISE NOTICE 'Products table does not exist, skipping';
    v_affected_products := 0;
  END IF;

  -- Update campaigns (if table exists)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'campaigns') THEN
    UPDATE campaigns
    SET organization_id = v_default_org_id
    WHERE organization_id IS NULL;

    GET DIAGNOSTICS v_affected_campaigns = ROW_COUNT;
    RAISE NOTICE 'Migrated % campaigns to default organization', v_affected_campaigns;
  ELSE
    RAISE NOTICE 'Campaigns table does not exist, skipping';
    v_affected_campaigns := 0;
  END IF;

  -- Update gateways (if table exists)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gateways') THEN
    UPDATE gateways
    SET organization_id = v_default_org_id
    WHERE organization_id IS NULL;

    GET DIAGNOSTICS v_affected_gateways = ROW_COUNT;
    RAISE NOTICE 'Migrated % gateways to default organization', v_affected_gateways;
  ELSE
    RAISE NOTICE 'Gateways table does not exist, skipping';
    v_affected_gateways := 0;
  END IF;

  -- Update orders (if table exists)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    UPDATE orders
    SET organization_id = v_default_org_id
    WHERE organization_id IS NULL;

    GET DIAGNOSTICS v_affected_orders = ROW_COUNT;
    RAISE NOTICE 'Migrated % orders to default organization', v_affected_orders;
  ELSE
    RAISE NOTICE 'Orders table does not exist, skipping';
    v_affected_orders := 0;
  END IF;

  -- Update api_settings (if table exists)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'api_settings') THEN
    UPDATE api_settings
    SET organization_id = v_default_org_id
    WHERE organization_id IS NULL;

    GET DIAGNOSTICS v_affected_api_settings = ROW_COUNT;
    RAISE NOTICE 'Migrated % API settings to default organization', v_affected_api_settings;
  ELSE
    RAISE NOTICE 'API settings table does not exist, skipping';
    v_affected_api_settings := 0;
  END IF;

  -- Update connected_domains (if table exists)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'connected_domains') THEN
    UPDATE connected_domains
    SET organization_id = v_default_org_id
    WHERE organization_id IS NULL;

    GET DIAGNOSTICS v_affected_domains = ROW_COUNT;
    RAISE NOTICE 'Migrated % connected domains to default organization', v_affected_domains;
  ELSE
    RAISE NOTICE 'Connected domains table does not exist, skipping';
    v_affected_domains := 0;
  END IF;

  -- Update leads (if table exists)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN
    UPDATE leads
    SET organization_id = v_default_org_id
    WHERE organization_id IS NULL;

    GET DIAGNOSTICS v_affected_leads = ROW_COUNT;
    RAISE NOTICE 'Migrated % leads to default organization', v_affected_leads;
  ELSE
    RAISE NOTICE 'Leads table does not exist, skipping';
    v_affected_leads := 0;
  END IF;

  -- =====================================================
  -- PART 5: Create Default API Settings if None Exist
  -- =====================================================

  -- If no API settings exist for default org, create one
  IF v_affected_api_settings = 0 THEN
    INSERT INTO api_settings (
      organization_id,
      api_key,
      api_secret,
      rate_limit_per_minute,
      rate_limit_per_day,
      is_active
    )
    VALUES (
      v_default_org_id,
      encode(gen_random_bytes(24), 'hex'),
      encode(gen_random_bytes(32), 'hex'),
      120, -- Higher limit for default org
      999999,
      true
    );
    RAISE NOTICE 'Created default API settings for organization';
  END IF;

  -- =====================================================
  -- PART 6: Verify Migration
  -- =====================================================

  -- Count records that still have NULL organization_id (should be zero)
  RAISE NOTICE '=== Migration Verification ===';

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
    RAISE NOTICE 'Customers with NULL org_id: %', (SELECT COUNT(*) FROM customers WHERE organization_id IS NULL);
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    RAISE NOTICE 'Products with NULL org_id: %', (SELECT COUNT(*) FROM products WHERE organization_id IS NULL);
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'campaigns') THEN
    RAISE NOTICE 'Campaigns with NULL org_id: %', (SELECT COUNT(*) FROM campaigns WHERE organization_id IS NULL);
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gateways') THEN
    RAISE NOTICE 'Gateways with NULL org_id: %', (SELECT COUNT(*) FROM gateways WHERE organization_id IS NULL);
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    RAISE NOTICE 'Orders with NULL org_id: %', (SELECT COUNT(*) FROM orders WHERE organization_id IS NULL);
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'api_settings') THEN
    RAISE NOTICE 'API Settings with NULL org_id: %', (SELECT COUNT(*) FROM api_settings WHERE organization_id IS NULL);
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'connected_domains') THEN
    RAISE NOTICE 'Connected Domains with NULL org_id: %', (SELECT COUNT(*) FROM connected_domains WHERE organization_id IS NULL);
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN
    RAISE NOTICE 'Leads with NULL org_id: %', (SELECT COUNT(*) FROM leads WHERE organization_id IS NULL);
  END IF;

END $$;

-- =====================================================
-- PART 7: Make organization_id NOT NULL
-- =====================================================

-- Now that all records have organization_id, make it required (only for existing tables)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
    ALTER TABLE customers ALTER COLUMN organization_id SET NOT NULL;
    COMMENT ON COLUMN customers.organization_id IS 'Required - every customer must belong to an organization';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    ALTER TABLE products ALTER COLUMN organization_id SET NOT NULL;
    COMMENT ON COLUMN products.organization_id IS 'Required - every product must belong to an organization';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'campaigns') THEN
    ALTER TABLE campaigns ALTER COLUMN organization_id SET NOT NULL;
    COMMENT ON COLUMN campaigns.organization_id IS 'Required - every campaign must belong to an organization';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gateways') THEN
    ALTER TABLE gateways ALTER COLUMN organization_id SET NOT NULL;
    COMMENT ON COLUMN gateways.organization_id IS 'Required - every gateway must belong to an organization';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    ALTER TABLE orders ALTER COLUMN organization_id SET NOT NULL;
    COMMENT ON COLUMN orders.organization_id IS 'Required - every order must belong to an organization';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'api_settings') THEN
    ALTER TABLE api_settings ALTER COLUMN organization_id SET NOT NULL;
    COMMENT ON COLUMN api_settings.organization_id IS 'Required - every API key must belong to an organization';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'connected_domains') THEN
    ALTER TABLE connected_domains ALTER COLUMN organization_id SET NOT NULL;
    COMMENT ON COLUMN connected_domains.organization_id IS 'Required - every domain must belong to an organization';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN
    ALTER TABLE leads ALTER COLUMN organization_id SET NOT NULL;
    COMMENT ON COLUMN leads.organization_id IS 'Required - every lead must belong to an organization';
  END IF;

  RAISE NOTICE 'Set organization_id to NOT NULL for all existing tables';
END $$;

-- =====================================================
-- PART 8: Final Summary
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Multi-tenant migration completed successfully!';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Total organizations: %', (SELECT COUNT(*) FROM organizations);
  RAISE NOTICE 'Total user profiles: %', (SELECT COUNT(*) FROM user_profiles);
  RAISE NOTICE 'Total organization members: %', (SELECT COUNT(*) FROM organization_members);
  RAISE NOTICE '';
  RAISE NOTICE 'All existing users have been added to the "Default Organization"';
  RAISE NOTICE 'All existing data has been assigned to the "Default Organization"';
  RAISE NOTICE 'All existing users have "owner" role in the default organization';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Deploy application code with multi-tenant support';
  RAISE NOTICE '2. Test organization switching and data isolation';
  RAISE NOTICE '3. Existing users can continue using the system normally';
  RAISE NOTICE '4. New users will create their own organizations';
  RAISE NOTICE '==============================================';
END $$;
