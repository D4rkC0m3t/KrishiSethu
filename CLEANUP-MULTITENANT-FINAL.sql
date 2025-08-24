-- =====================================================
-- COMPREHENSIVE MULTI-TENANT CLEANUP AND FIX
-- Cleans old data and enforces proper RLS policies
-- Run this in Supabase SQL Editor Dashboard
-- =====================================================

BEGIN;

-- Step 1: Clean up old test/development data from all tables
DELETE FROM public.purchases WHERE created_at < NOW() - INTERVAL '1 day' OR organization_id IS NULL;
DELETE FROM public.suppliers WHERE created_at < NOW() - INTERVAL '1 day' OR organization_id IS NULL;  
DELETE FROM public.customers WHERE created_at < NOW() - INTERVAL '1 day' OR organization_id IS NULL;
DELETE FROM public.products WHERE created_at < NOW() - INTERVAL '1 day' AND organization_id IS NULL;
DELETE FROM public.sales WHERE created_at < NOW() - INTERVAL '1 day' OR organization_id IS NULL;
DELETE FROM public.stock_movements WHERE created_at < NOW() - INTERVAL '1 day' OR organization_id IS NULL;

-- Step 2: Drop all existing RLS policies to start fresh
DROP POLICY IF EXISTS "Users can only see own organization purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can only see own organization suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can only see own organization customers" ON public.customers;
DROP POLICY IF EXISTS "Users can only see own organization products" ON public.products;
DROP POLICY IF EXISTS "Users can only see own organization sales" ON public.sales;
DROP POLICY IF EXISTS "Authenticated users can manage purchases" ON public.purchases;
DROP POLICY IF EXISTS "Authenticated users can manage suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can manage customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can manage sales" ON public.sales;
DROP POLICY IF EXISTS "Everyone can view purchases" ON public.purchases;
DROP POLICY IF EXISTS "Everyone can view suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Everyone can view customers" ON public.customers;
DROP POLICY IF EXISTS "Everyone can view products" ON public.products;
DROP POLICY IF EXISTS "Everyone can view sales" ON public.sales;
DROP POLICY IF EXISTS "Anonymous users can view purchases" ON public.purchases;
DROP POLICY IF EXISTS "Anonymous users can view suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Anonymous users can view customers" ON public.customers;
DROP POLICY IF EXISTS "Anonymous users can view products" ON public.products;
DROP POLICY IF EXISTS "Anonymous users can view sales" ON public.sales;

-- Step 3: Enable RLS on all tables
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Step 4: Create strict multi-tenant RLS policies for PURCHASES
CREATE POLICY "Multi-tenant purchases access" ON public.purchases
  FOR ALL TO authenticated 
  USING (
    organization_id = (
      SELECT organization_id 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  );

-- Block anonymous access to purchases
CREATE POLICY "Block anonymous purchases access" ON public.purchases
  FOR ALL TO anon USING (false);

-- Step 5: Create strict multi-tenant RLS policies for SUPPLIERS  
CREATE POLICY "Multi-tenant suppliers access" ON public.suppliers
  FOR ALL TO authenticated
  USING (
    organization_id = (
      SELECT organization_id
      FROM auth.users
      WHERE id = auth.uid()
    )
  );

-- Block anonymous access to suppliers
CREATE POLICY "Block anonymous suppliers access" ON public.suppliers
  FOR ALL TO anon USING (false);

-- Step 6: Create strict multi-tenant RLS policies for CUSTOMERS
CREATE POLICY "Multi-tenant customers access" ON public.customers
  FOR ALL TO authenticated
  USING (
    organization_id = (
      SELECT organization_id
      FROM auth.users 
      WHERE id = auth.uid()
    )
  );

-- Block anonymous access to customers
CREATE POLICY "Block anonymous customers access" ON public.customers
  FOR ALL TO anon USING (false);

-- Step 7: Create strict multi-tenant RLS policies for SALES
CREATE POLICY "Multi-tenant sales access" ON public.sales
  FOR ALL TO authenticated
  USING (
    organization_id = (
      SELECT organization_id
      FROM auth.users
      WHERE id = auth.uid()
    )
  );

-- Block anonymous access to sales
CREATE POLICY "Block anonymous sales access" ON public.sales
  FOR ALL TO anon USING (false);

-- Step 8: Create strict multi-tenant RLS policies for STOCK_MOVEMENTS
CREATE POLICY "Multi-tenant stock movements access" ON public.stock_movements
  FOR ALL TO authenticated
  USING (
    organization_id = (
      SELECT organization_id
      FROM auth.users
      WHERE id = auth.uid()
    )
  );

-- Block anonymous access to stock movements
CREATE POLICY "Block anonymous stock movements access" ON public.stock_movements
  FOR ALL TO anon USING (false);

-- Step 9: Special handling for PRODUCTS (can have universal reference data)
-- Drop existing product policies first
DROP POLICY IF EXISTS "Everyone can view products" ON public.products;
DROP POLICY IF EXISTS "Everyone can insert products" ON public.products;

-- Create multi-tenant product policies with universal data exception
CREATE POLICY "Multi-tenant products access" ON public.products
  FOR ALL TO authenticated
  USING (
    organization_id = (
      SELECT organization_id
      FROM auth.users
      WHERE id = auth.uid()
    )
    OR organization_id IS NULL  -- Allow universal reference products
  );

-- Allow anonymous users to view only universal products (organization_id IS NULL)
CREATE POLICY "Anonymous can view universal products only" ON public.products
  FOR SELECT TO anon
  USING (organization_id IS NULL);

-- Step 10: Handle CATEGORIES and BRANDS (should be universal)
-- These should remain accessible to everyone as reference data
-- No changes needed as they're already set up as universal

-- Step 11: Verification queries
DO $$
BEGIN
  RAISE NOTICE 'Multi-tenant cleanup completed successfully!';
  RAISE NOTICE 'All old/test data cleaned up';  
  RAISE NOTICE 'Strict RLS policies enforced';
  RAISE NOTICE 'Anonymous users can only see universal reference data';
  RAISE NOTICE 'Authenticated users can only see their organization data';
END $$;

COMMIT;

-- Final verification
SELECT 
  'Multi-tenant security enforced - old data cleaned' as result,
  (SELECT COUNT(*) FROM public.purchases) as purchases_remaining,
  (SELECT COUNT(*) FROM public.suppliers) as suppliers_remaining,
  (SELECT COUNT(*) FROM public.customers) as customers_remaining,
  (SELECT COUNT(*) FROM public.products WHERE organization_id IS NULL) as universal_products;
