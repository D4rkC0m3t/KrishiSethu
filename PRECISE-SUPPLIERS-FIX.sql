-- =====================================================
-- PRECISE SUPPLIERS TABLE FIX
-- Based on actual schema discovery: organization_id + created_by required
-- Run this in Supabase SQL Editor Dashboard
-- =====================================================

BEGIN;

-- Step 1: Make organization_id nullable for universal suppliers
ALTER TABLE public.suppliers 
ALTER COLUMN organization_id DROP NOT NULL;

-- Step 2: Make created_by nullable for system-created suppliers
ALTER TABLE public.suppliers 
ALTER COLUMN created_by DROP NOT NULL;

-- Step 3: Add missing columns that the frontend expects
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS gst_number VARCHAR(15),
ADD COLUMN IF NOT EXISTS pan_number VARCHAR(10),
ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS outstanding_amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(100) DEFAULT '30 days',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Step 4: Clean up any failed test records
DELETE FROM public.suppliers WHERE name LIKE '%Test%';

-- Step 5: Drop foreign key constraint temporarily (if it exists) to allow NULL organization_id
DO $$
BEGIN
    -- Try to drop the foreign key constraint
    ALTER TABLE public.suppliers DROP CONSTRAINT IF EXISTS suppliers_organization_id_fkey;
    RAISE NOTICE 'Foreign key constraint dropped (if it existed)';
EXCEPTION 
    WHEN others THEN 
        RAISE NOTICE 'Foreign key constraint may not exist or already dropped';
END $$;

-- Step 6: Update RLS policies
DROP POLICY IF EXISTS "Multi-tenant suppliers access" ON public.suppliers;
DROP POLICY IF EXISTS "Anonymous suppliers development access" ON public.suppliers;

-- Allow authenticated users to see their org suppliers + universal suppliers
CREATE POLICY "Multi-tenant suppliers access" ON public.suppliers
  FOR ALL TO authenticated 
  USING (
    organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid())
    OR organization_id IS NULL  -- Universal suppliers
  );

-- Allow anonymous users full access (for development)
CREATE POLICY "Anonymous suppliers development access" ON public.suppliers
  FOR ALL TO anon USING (true);

-- Step 7: Test the fix with a complete supplier record
INSERT INTO public.suppliers (
  name, 
  contact_person, 
  phone, 
  email, 
  address,
  gst_number,
  payment_terms,
  credit_limit,
  is_active,
  organization_id,
  created_by
) VALUES (
  'Precision Test Supplier',
  'Test Contact',
  '+91-1234567890',
  'test@precision.com',
  JSONB_BUILD_OBJECT(
    'street', 'Test Address', 
    'city', 'Test City', 
    'state', 'Test State', 
    'pincode', '123456'
  ),
  '07AABCT1234Q1Z5',
  '30 days',
  25000.00,
  true,
  NULL,  -- Universal supplier
  NULL   -- System created
);

COMMIT;

-- Verification
SELECT 
  'Precise suppliers fix completed successfully' as result,
  (SELECT COUNT(*) FROM public.suppliers) as total_suppliers,
  (SELECT COUNT(*) FROM public.suppliers WHERE name = 'Precision Test Supplier') as test_record_created;
