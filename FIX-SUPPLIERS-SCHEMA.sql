-- =====================================================
-- FIX SUPPLIERS TABLE SCHEMA
-- Add missing columns and fix RLS policies
-- Run this in Supabase SQL Editor Dashboard
-- =====================================================

BEGIN;

-- Step 1: Add missing columns to suppliers table
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS outstanding_amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS pan_number VARCHAR(10),
ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(100) DEFAULT '30 days',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Step 2: Update RLS policies to allow anonymous insert (for testing)
-- This is temporary for development - in production, users should be authenticated
DROP POLICY IF EXISTS "Multi-tenant suppliers access" ON public.suppliers;
DROP POLICY IF EXISTS "Block anonymous suppliers access" ON public.suppliers;

-- Allow authenticated users full access to their org data
CREATE POLICY "Multi-tenant suppliers access" ON public.suppliers
  FOR ALL TO authenticated 
  USING (
    organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid())
    OR organization_id IS NULL  -- Allow universal suppliers
  );

-- Allow anonymous users to insert and view suppliers (for development/testing)
CREATE POLICY "Anonymous suppliers development access" ON public.suppliers
  FOR ALL TO anon USING (true);

-- Step 3: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_suppliers_organization_id ON public.suppliers(organization_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON public.suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON public.suppliers(is_active);

-- Step 4: Add updated_at trigger
CREATE OR REPLACE FUNCTION update_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_suppliers_updated_at ON public.suppliers;
CREATE TRIGGER update_suppliers_updated_at 
  BEFORE UPDATE ON public.suppliers 
  FOR EACH ROW EXECUTE FUNCTION update_suppliers_updated_at();

COMMIT;

-- Test the fix
INSERT INTO public.suppliers (
  name, 
  contact_person, 
  phone, 
  email, 
  address, 
  credit_limit,
  is_active
) VALUES (
  'Test Supplier Schema Fix',
  'Test Contact',
  '9999999999',
  'test@supplier.com',
  JSONB_BUILD_OBJECT('street', 'Test Address', 'city', 'Test City', 'state', 'Test State'),
  50000,
  true
);

-- Verification
SELECT 
  'Suppliers table schema fixed' as result,
  (SELECT COUNT(*) FROM public.suppliers) as total_suppliers,
  (SELECT COUNT(*) FROM public.suppliers WHERE name = 'Test Supplier Schema Fix') as test_record_created;
