-- =====================================================
-- CREATE MISSING SETTINGS TABLE
-- Fix 404 errors by creating the settings table that the app expects
-- Run this in Supabase SQL Editor Dashboard
-- =====================================================

BEGIN;

-- Create settings table
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) NOT NULL,
  value JSONB,
  description TEXT,
  category VARCHAR(100) DEFAULT 'general',
  organization_id UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Ensure unique keys per organization (or global if organization_id is NULL)
  UNIQUE(key, organization_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_settings_key ON public.settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_organization_id ON public.settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_settings_category ON public.settings(category);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_settings_updated_at ON public.settings;
CREATE TRIGGER update_settings_updated_at 
  BEFORE UPDATE ON public.settings 
  FOR EACH ROW EXECUTE FUNCTION update_settings_updated_at();

-- Create RLS policies
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to see their org settings + global settings (NULL organization_id)
CREATE POLICY "Multi-tenant settings access" ON public.settings
  FOR ALL TO authenticated 
  USING (
    organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid())
    OR organization_id IS NULL  -- Global settings visible to all
    OR created_by = auth.uid()  -- Users can always see their own settings
  );

-- Allow anonymous users full access (for development/testing)
CREATE POLICY "Anonymous settings development access" ON public.settings
  FOR ALL TO anon USING (true);

-- Insert some default system settings (global, not organization-specific)
INSERT INTO public.settings (key, value, description, category, organization_id) VALUES 
  ('companyInfo.name', '"KrishiSethu Fertilizers"', 'Company name', 'company', NULL),
  ('companyInfo.logo', '"/Logo.png"', 'Company logo URL', 'company', NULL),
  ('companyInfo.phone', '"+91-9876543210"', 'Company phone number', 'company', NULL),
  ('companyInfo.email', '"info@krishisethu.com"', 'Company email', 'company', NULL),
  ('companyInfo.gstNumber', '"07AABCK1234Q1Z5"', 'Company GST number', 'company', NULL),
  ('taxSettings.defaultGstRate', '18', 'Default GST rate percentage', 'tax', NULL),
  ('taxSettings.enableGst', 'true', 'Enable GST calculations', 'tax', NULL),
  ('notifications.enabled', 'true', 'Enable notifications', 'notification', NULL),
  ('notifications.lowStockAlert', 'true', 'Enable low stock alerts', 'notification', NULL)
ON CONFLICT (key, organization_id) DO NOTHING;

COMMIT;

-- Verification
SELECT 
  'Settings table created successfully' as result,
  (SELECT COUNT(*) FROM public.settings) as total_settings,
  (SELECT COUNT(*) FROM public.settings WHERE organization_id IS NULL) as global_settings;
