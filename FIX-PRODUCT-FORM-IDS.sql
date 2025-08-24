-- =====================================================
-- FIX PRODUCT FORM - MAKE CATEGORY_ID AND BRAND_ID NULLABLE
-- Allow products to be saved without specific category/brand UUIDs
-- Run this in Supabase SQL Editor Dashboard
-- =====================================================

BEGIN;

-- Step 1: Make category_id and brand_id nullable
-- This allows products to use text-based categories/brands instead of UUID references
ALTER TABLE public.products 
ALTER COLUMN category_id DROP NOT NULL;

ALTER TABLE public.products 
ALTER COLUMN brand_id DROP NOT NULL;

-- Step 2: Ensure the text-based category and brand columns exist and are nullable
-- These can store category/brand names as strings
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS category VARCHAR(100),
ADD COLUMN IF NOT EXISTS brand VARCHAR(100);

-- Step 3: Create some basic categories and brands in their respective tables
-- This provides real UUID options for the future

-- Insert basic categories if they don't exist
INSERT INTO public.categories (id, name, description, is_active, sort_order)
VALUES 
  (gen_random_uuid(), 'Chemical Fertilizer', 'Chemical fertilizer products', true, 1),
  (gen_random_uuid(), 'Organic Fertilizer', 'Organic fertilizer products', true, 2),
  (gen_random_uuid(), 'Bio Fertilizer', 'Bio fertilizer products', true, 3),
  (gen_random_uuid(), 'NPK Fertilizers', 'NPK fertilizer products', true, 4),
  (gen_random_uuid(), 'Seeds', 'Seed products', true, 5),
  (gen_random_uuid(), 'Pesticides', 'Pesticide products', true, 6),
  (gen_random_uuid(), 'Tools & Equipment', 'Tools and equipment', true, 7)
ON CONFLICT (name) DO NOTHING;

-- Insert basic brands if they don't exist
INSERT INTO public.brands (id, name, description, is_active)
VALUES 
  (gen_random_uuid(), 'Generic', 'Generic brand products', true),
  (gen_random_uuid(), 'Premium', 'Premium brand products', true),
  (gen_random_uuid(), 'Local', 'Local brand products', true)
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- Test product insertion with NULL UUIDs but with text category/brand
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
  category_id,    -- NULL UUID
  brand_id,       -- NULL UUID  
  category,       -- Text category
  brand,          -- Text brand
  is_active,
  organization_id,
  created_by,
  sku
) VALUES (
  'Test Product with Text Category',
  'TEST002',
  'Test product with text-based category and brand',
  'Chemical',
  'kg',
  100,
  50.00,
  75.00,
  '31054000',
  18.00,
  NULL,           -- NULL UUID category_id
  NULL,           -- NULL UUID brand_id
  'Chemical Fertilizer',  -- Text category
  'Generic',              -- Text brand
  true,
  NULL,
  NULL,
  'SKU-TEST002'
) ON CONFLICT (code) DO NOTHING;

-- Verification
SELECT 
  'Product form IDs fixed' as result,
  (SELECT COUNT(*) FROM public.products) as total_products,
  (SELECT COUNT(*) FROM public.categories) as total_categories,
  (SELECT COUNT(*) FROM public.brands) as total_brands;

-- Clean up test product
DELETE FROM public.products WHERE code = 'TEST002';
