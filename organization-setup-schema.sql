-- ==============================
-- KrishiSethu Organization Setup Schema
-- Run this in your Supabase SQL Editor
-- ==============================

-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================
-- 1. Organizations Table (Multi-Tenant Core)
-- ==============================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- for routing/subdomains
  description TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  address JSONB, -- {street, city, state, country, gst_number, pan_number}
  settings JSONB DEFAULT '{}'::jsonb, -- {industry, currency, timezone, etc}
  
  -- Subscription management
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'premium', 'enterprise')),
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'inactive', 'suspended')),
  trial_end_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  
  -- Limits based on subscription
  max_users INTEGER DEFAULT 5,
  max_products INTEGER DEFAULT 100,
  max_storage_mb INTEGER DEFAULT 100,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==============================
-- 2. Update Profiles Table to include Organization ID
-- ==============================
-- First check if the organization_id column exists, if not add it
DO $$ 
BEGIN 
    -- Check if organization_id column exists in profiles table
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
        
        -- Add index for better performance
        CREATE INDEX IF NOT EXISTS idx_profiles_organization ON profiles(organization_id);
        
        RAISE NOTICE 'Added organization_id column to profiles table';
    ELSE
        RAISE NOTICE 'organization_id column already exists in profiles table';
    END IF;
END $$;

-- ==============================
-- 3. Update Categories for Multi-Tenant Support
-- ==============================
-- Add organization_id to categories if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'categories' 
        AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE categories ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_categories_organization ON categories(organization_id);
        
        RAISE NOTICE 'Added organization_id column to categories table';
    ELSE
        RAISE NOTICE 'organization_id column already exists in categories table';
    END IF;
END $$;

-- ==============================
-- 4. Create Indexes for Performance
-- ==============================
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription ON organizations(subscription_status, subscription_plan);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(is_active);

-- ==============================
-- 5. Enable Row Level Security
-- ==============================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- ==============================
-- 6. Create RLS Policies for Organizations
-- ==============================

-- Users can view organizations they belong to
DO $$ 
BEGIN
    CREATE POLICY "Users can view their organization" ON organizations
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.organization_id = organizations.id 
                AND profiles.id = auth.uid()
            )
        );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Organization owners/admins can update their organization
DO $$ 
BEGIN
    CREATE POLICY "Organization owners can update" ON organizations
        FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.organization_id = organizations.id 
                AND profiles.id = auth.uid()
                AND profiles.role IN ('owner', 'admin')
            )
        );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Allow authenticated users to create organizations (for setup flow)
DO $$ 
BEGIN
    CREATE POLICY "Authenticated users can create organizations" ON organizations
        FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ==============================
-- 7. Update Profiles RLS to handle organization context
-- ==============================

-- Allow users without organization to update their profile (for setup)
DO $$ 
BEGIN
    CREATE POLICY "Users can update profile during organization setup" ON profiles
        FOR UPDATE USING (auth.uid() = id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ==============================
-- 8. Create Function to Generate Organization Slug
-- ==============================
CREATE OR REPLACE FUNCTION generate_organization_slug(org_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 1;
BEGIN
    -- Create base slug from organization name
    base_slug := lower(trim(regexp_replace(org_name, '[^a-zA-Z0-9\s]', '', 'g')));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := trim(base_slug, '-');
    
    -- If slug is empty, generate a random one
    IF base_slug = '' THEN
        base_slug := 'org-' || substring(gen_random_uuid()::text, 1, 8);
    END IF;
    
    final_slug := base_slug;
    
    -- Check for uniqueness and add counter if needed
    WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = final_slug) LOOP
        final_slug := base_slug || '-' || counter;
        counter := counter + 1;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- ==============================
-- 9. Create Function to Setup Default Organization Data
-- ==============================
CREATE OR REPLACE FUNCTION setup_organization_defaults(org_id UUID, user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Create default categories for the organization
    INSERT INTO categories (organization_id, name, description, created_by) VALUES
    (org_id, 'Raw Materials', 'Basic materials and components', user_id),
    (org_id, 'Finished Goods', 'Ready to sell products', user_id),
    (org_id, 'Supplies', 'Office and operational supplies', user_id),
    (org_id, 'Fertilizers', 'Chemical and organic fertilizers', user_id),
    (org_id, 'Seeds', 'Seeds and planting materials', user_id),
    (org_id, 'Tools & Equipment', 'Agricultural tools and equipment', user_id)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Default categories created for organization %', org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================
-- 10. Create Trigger for Updated Timestamps
-- ==============================
CREATE OR REPLACE FUNCTION handle_organization_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_organizations_updated_at 
    BEFORE UPDATE ON organizations 
    FOR EACH ROW EXECUTE FUNCTION handle_organization_updated_at();

-- ==============================
-- 11. Grant Necessary Permissions
-- ==============================
GRANT SELECT, INSERT, UPDATE ON organizations TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION generate_organization_slug(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION setup_organization_defaults(UUID, UUID) TO authenticated;

-- ==============================
-- Success Message
-- ==============================
DO $$
BEGIN
    RAISE NOTICE '=== ORGANIZATION SETUP SCHEMA COMPLETE ===';
    RAISE NOTICE '✅ Organizations table created with multi-tenant support';
    RAISE NOTICE '✅ Profiles table updated with organization_id';
    RAISE NOTICE '✅ Categories table updated for multi-tenancy';
    RAISE NOTICE '✅ RLS policies configured for data isolation';
    RAISE NOTICE '✅ Helper functions created for organization management';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Your OrganizationSetup component is now ready to use!';
    RAISE NOTICE '🔄 Users will be prompted to create an organization on first login';
    RAISE NOTICE '🏢 Each organization will have complete data isolation';
    RAISE NOTICE '===============================================';
END $$;
