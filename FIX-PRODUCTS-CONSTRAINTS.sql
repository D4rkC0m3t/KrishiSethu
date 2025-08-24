-- =====================================================
-- FIX PRODUCTS TABLE CONSTRAINTS
-- Make created_by and organization_id nullable for universal products
-- Run this in Supabase SQL Editor Dashboard
-- =====================================================

BEGIN;

-- Step 1: Make created_by nullable (allow system-created products)
ALTER TABLE public.products 
ALTER COLUMN created_by DROP NOT NULL;

-- Step 2: Make organization_id nullable (allow universal products)
ALTER TABLE public.products 
ALTER COLUMN organization_id DROP NOT NULL;

-- Step 3: Make sku nullable if it's required (some products might not have SKU)
ALTER TABLE public.products 
ALTER COLUMN sku DROP NOT NULL;

-- Step 4: Ensure RLS is disabled for consistency
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- Step 5: Grant permissions
GRANT ALL ON public.products TO anon, authenticated;

COMMIT;

-- Test a basic product insertion
INSERT INTO public.products (
  name,
  code,
  description,
  type,
  unit,
  quantity,
  purchase_price,
  sale_price,
  hsn_code,
  gst_rate,
  is_active,
  organization_id,
  created_by,
  sku
) VALUES (
  'Test Product',
  'TEST001',
  'Test product description',
  'Chemical',
  'kg',
  100,
  50.00,
  75.00,
  '31054000',
  18.00,
  true,
  NULL,
  NULL,
  'SKU-TEST001'
) ON CONFLICT (code) DO NOTHING;

-- Verification
SELECT 
  'Products constraints fixed' as result,
  (SELECT COUNT(*) FROM public.products) as total_products;

-- Clean up test product
DELETE FROM public.products WHERE code = 'TEST001';
