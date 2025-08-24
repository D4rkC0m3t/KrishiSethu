-- =====================================================
-- COMPLETE SUPPLIERS TABLE SCHEMA FIX
-- Add ALL missing columns and fix constraints
-- Run this in Supabase SQL Editor Dashboard
-- =====================================================

BEGIN;

-- Step 1: Add ALL missing columns to suppliers table
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS gst_number VARCHAR(15),
ADD COLUMN IF NOT EXISTS pan_number VARCHAR(10),
ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS outstanding_amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(100) DEFAULT '30 days',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Step 2: Make organization_id nullable (allow universal suppliers)
ALTER TABLE public.suppliers 
ALTER COLUMN organization_id DROP NOT NULL;

-- Step 3: Clean up any failed test records
DELETE FROM public.suppliers WHERE name LIKE '%Test%';

-- Step 4: Update RLS policies to handle universal suppliers
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

-- Step 5: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_suppliers_organization_id ON public.suppliers(organization_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON public.suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON public.suppliers(is_active);
CREATE INDEX IF NOT EXISTS idx_suppliers_gst ON public.suppliers(gst_number);

-- Step 6: Add updated_at trigger
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

-- Step 7: COMMENTED OUT - Sample data insertion can cause phantom data
-- Uncomment below ONLY if you want to add sample suppliers
/*
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.suppliers LIMIT 1) THEN
    -- Insert sample suppliers without gst_number to avoid any column issues
    INSERT INTO public.suppliers (
      name, 
      contact_person, 
      phone, 
      email, 
      address,
      is_active,
      organization_id,
      payment_terms
    ) VALUES 
    ('Krishak Fertilizers Ltd', 'Ramesh Kumar', '+91-9876543210', 'info@krishakfert.com', 
     JSONB_BUILD_OBJECT('street', 'Industrial Area Phase 2', 'city', 'Delhi', 'state', 'Delhi', 'pincode', '110020'), 
     true, NULL, '30 days'),
    ('Bharat Agro Solutions', 'Priya Sharma', '+91-9876543211', 'sales@bharatagro.com', 
     JSONB_BUILD_OBJECT('street', 'Agricultural Complex', 'city', 'Pune', 'state', 'Maharashtra', 'pincode', '411001'), 
     true, NULL, '30 days'),
    ('Green Valley Suppliers', 'Suresh Patel', '+91-9876543212', 'contact@greenvalley.com', 
     JSONB_BUILD_OBJECT('street', 'Fertilizer Hub', 'city', 'Ahmedabad', 'state', 'Gujarat', 'pincode', '380001'), 
     true, NULL, '45 days');
     
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
  gst_number,
  pan_number,
  credit_limit,
  payment_terms,
  is_active,
  organization_id
) VALUES (
  'Test Universal Supplier',
  'Test Contact Person',
  '+91-1234567890',
  'test@supplier.com',
  JSONB_BUILD_OBJECT('street', 'Test Street', 'city', 'Test City', 'state', 'Test State', 'pincode', '123456'),
  '07AABCT1234Q1Z5',
  'AABCT1234Q',
  50000.00,
  '30 days',
  true,
  NULL
);
*/

-- Verification query
SELECT 
  'Complete suppliers schema fix successful' as result,
  (SELECT COUNT(*) FROM public.suppliers) as total_suppliers,
  (SELECT COUNT(*) FROM public.suppliers WHERE organization_id IS NULL) as universal_suppliers,
  (SELECT COUNT(*) FROM public.suppliers WHERE gst_number IS NOT NULL) as suppliers_with_gst;
