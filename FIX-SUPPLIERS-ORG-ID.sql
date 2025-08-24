-- =====================================================
-- FIX SUPPLIERS ORGANIZATION_ID CONSTRAINT
-- Allow NULL organization_id for universal suppliers
-- Run this in Supabase SQL Editor Dashboard
-- =====================================================

BEGIN;

-- Step 1: Drop the NOT NULL constraint on organization_id 
-- This allows universal suppliers that can be used by any organization
ALTER TABLE public.suppliers 
ALTER COLUMN organization_id DROP NOT NULL;

-- Step 2: Clean up the failed test record if it exists
DELETE FROM public.suppliers WHERE name = 'Test Supplier Schema Fix';

-- Step 3: Update RLS policies to handle NULL organization_id properly
DROP POLICY IF EXISTS "Multi-tenant suppliers access" ON public.suppliers;
DROP POLICY IF EXISTS "Anonymous suppliers development access" ON public.suppliers;

-- Allow authenticated users to see their org suppliers + universal suppliers
CREATE POLICY "Multi-tenant suppliers access" ON public.suppliers
  FOR ALL TO authenticated 
  USING (
    organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid())
    OR organization_id IS NULL  -- Universal suppliers visible to all
  );

-- Allow anonymous users full access (for development/testing)
CREATE POLICY "Anonymous suppliers development access" ON public.suppliers
  FOR ALL TO anon USING (true);

-- Step 4: COMMENTED OUT - Sample data insertion can cause phantom data
-- Uncomment below ONLY if you want to add sample suppliers
/*
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.suppliers LIMIT 1) THEN
    INSERT INTO public.suppliers (
      name, 
      contact_person, 
      phone, 
      email, 
      address,
      gst_number,
      is_active,
      organization_id
    ) VALUES 
    ('Krishak Fertilizers Ltd', 'Ramesh Kumar', '+91-9876543210', 'info@krishakfert.com', 
     JSONB_BUILD_OBJECT('street', 'Industrial Area Phase 2', 'city', 'Delhi', 'state', 'Delhi', 'pincode', '110020'), 
     '07AABCK1234Q1Z5', true, NULL),
    ('Bharat Agro Solutions', 'Priya Sharma', '+91-9876543211', 'sales@bharatagro.com', 
     JSONB_BUILD_OBJECT('street', 'Agricultural Complex', 'city', 'Pune', 'state', 'Maharashtra', 'pincode', '411001'), 
     '27AABCB1234Q1Z8', true, NULL),
    ('Green Valley Suppliers', 'Suresh Patel', '+91-9876543212', 'contact@greenvalley.com', 
     JSONB_BUILD_OBJECT('street', 'Fertilizer Hub', 'city', 'Ahmedabad', 'state', 'Gujarat', 'pincode', '380001'), 
     '24AABCG1234Q1Z9', true, NULL);
     
    RAISE NOTICE 'Added 3 universal suppliers as sample data';
  ELSE
    RAISE NOTICE 'Suppliers table already has data, skipping sample insert';
  END IF;
END $$;
*/

COMMIT;

-- COMMENTED OUT - Test insertion can cause phantom data
-- Uncomment below ONLY if you want to test insertion
/*
INSERT INTO public.suppliers (
  name, 
  contact_person, 
  phone, 
  email, 
  address, 
  is_active,
  organization_id
) VALUES (
  'Test Supplier - Universal',
  'Test Contact Person',
  '+91-1234567890',
  'test@universal.com',
  JSONB_BUILD_OBJECT('street', 'Test Address', 'city', 'Test City', 'state', 'Test State', 'pincode', '123456'),
  true,
  NULL  -- Universal supplier - no organization restriction
);
*/

-- Verification
SELECT 
  'Suppliers schema fix completed' as result,
  (SELECT COUNT(*) FROM public.suppliers) as total_suppliers,
  (SELECT COUNT(*) FROM public.suppliers WHERE organization_id IS NULL) as universal_suppliers;
