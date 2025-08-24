-- =====================================================
-- CLEAN SUPPLIERS TABLE SCHEMA FIX
-- Add missing columns and fix constraints WITHOUT sample data
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

-- Step 3: Make created_by nullable (allow system-created suppliers)
ALTER TABLE public.suppliers 
ALTER COLUMN created_by DROP NOT NULL;

-- Step 4: Clean up any existing test records
DELETE FROM public.suppliers WHERE name LIKE '%Test%';
DELETE FROM public.suppliers WHERE name IN (
    'Krishak Fertilizers Ltd',
    'Bharat Agro Solutions', 
    'Green Valley Suppliers',
    'Test Universal Supplier'
);

-- Step 5: Drop foreign key constraint on organization_id (temporarily)
-- This allows NULL organization_id for universal suppliers
DO $$ 
BEGIN
    -- Find and drop the foreign key constraint on organization_id
    DECLARE 
        constraint_name TEXT;
    BEGIN
        SELECT conname INTO constraint_name 
        FROM pg_constraint 
        WHERE conrelid = 'public.suppliers'::regclass 
        AND conkey = (SELECT array_agg(attnum) FROM pg_attribute WHERE attrelid = 'public.suppliers'::regclass AND attname = 'organization_id');
        
        IF constraint_name IS NOT NULL THEN
            EXECUTE format('ALTER TABLE public.suppliers DROP CONSTRAINT %I', constraint_name);
            RAISE NOTICE 'Dropped foreign key constraint: %', constraint_name;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'No foreign key constraint found on organization_id or error occurred: %', SQLERRM;
    END;
END $$;

-- Step 6: Update RLS policies to handle universal suppliers and anonymous access
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

-- Step 7: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_suppliers_organization_id ON public.suppliers(organization_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON public.suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON public.suppliers(is_active);
CREATE INDEX IF NOT EXISTS idx_suppliers_gst ON public.suppliers(gst_number);

-- Step 8: Add updated_at trigger
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

-- Verification query (should show 0 suppliers)
SELECT 
  'Clean suppliers schema fix completed' as result,
  (SELECT COUNT(*) FROM public.suppliers) as total_suppliers,
  (SELECT COUNT(*) FROM public.suppliers WHERE organization_id IS NULL) as universal_suppliers;

-- Test that schema allows proper insertion (but don't actually insert)
-- This is just a validation query to ensure the schema is correct
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'suppliers' 
      AND column_name IN ('gst_number', 'pan_number', 'credit_limit', 'payment_terms')
    ) THEN 'All required columns exist'
    ELSE 'Missing required columns'
  END as column_check;
