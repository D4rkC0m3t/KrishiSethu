-- =====================================================
-- FIX BRANDS LOADING ISSUE - V2
-- Handles organization_id requirement for multi-tenant setup
-- Run this in Supabase SQL Editor Dashboard
-- =====================================================

BEGIN;

-- Fix brands table RLS policies (ensure authenticated users can access)
DROP POLICY IF EXISTS "Authenticated users can manage brands" ON public.brands;
DROP POLICY IF EXISTS "Authenticated users can view brands" ON public.brands;
DROP POLICY IF EXISTS "Anonymous users can view brands" ON public.brands;

-- Create comprehensive policies for brands
CREATE POLICY "Authenticated users can view brands" ON public.brands
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage brands" ON public.brands
  FOR ALL TO authenticated USING (true);

-- Allow anonymous users to view brands (for dropdowns)
CREATE POLICY "Anonymous users can view brands" ON public.brands
  FOR SELECT TO anon USING (true);

-- Add sample brands data (brands table doesn't need organization_id)
DO $$
BEGIN
  -- Only insert if brands table is empty
  IF NOT EXISTS (SELECT 1 FROM public.brands LIMIT 1) THEN
    INSERT INTO public.brands (name, description) VALUES 
      ('AgriCorp', 'Premium agricultural products and fertilizers'),
      ('FertMax', 'Maximum yield fertilizer solutions'),
      ('CropGrow', 'Complete crop nutrition systems'),
      ('NutriCorp', 'Essential plant nutrition products'),
      ('EcoFarm', 'Sustainable and organic farming solutions'),
      ('GreenGold', 'Gold standard in agricultural inputs'),
      ('BioNutri', 'Biological nutrition solutions'),
      ('SeedMaster', 'Quality seeds and planting materials');
      
    RAISE NOTICE 'Added 8 sample brands';
  ELSE
    RAISE NOTICE 'Brands table already has data, skipping insert';
  END IF;
END $$;

-- Fix categories table policies but SKIP data insertion due to organization_id constraint
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can view categories" ON public.categories;
DROP POLICY IF EXISTS "Anonymous users can view categories" ON public.categories;

CREATE POLICY "Authenticated users can view categories" ON public.categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage categories" ON public.categories
  FOR ALL TO authenticated USING (true);

-- Allow anonymous users to view categories (for dropdowns)
CREATE POLICY "Anonymous users can view categories" ON public.categories
  FOR SELECT TO anon USING (true);

-- Add sort_order column to categories if missing
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- NOTE: Skipping categories data insert due to organization_id NOT NULL constraint
-- Categories will need to be added through the UI or with proper organization_id

-- Also fix suppliers and customers tables policies
DROP POLICY IF EXISTS "Authenticated users can manage suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Authenticated users can view suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Anonymous users can view suppliers" ON public.suppliers;

CREATE POLICY "Authenticated users can view suppliers" ON public.suppliers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage suppliers" ON public.suppliers
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Anonymous users can view suppliers" ON public.suppliers
  FOR SELECT TO anon USING (true);

-- Fix customers table policies
DROP POLICY IF EXISTS "Authenticated users can manage customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers;
DROP POLICY IF EXISTS "Anonymous users can view customers" ON public.customers;

CREATE POLICY "Authenticated users can view customers" ON public.customers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage customers" ON public.customers
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Anonymous users can view customers" ON public.customers
  FOR SELECT TO anon USING (true);

COMMIT;

-- Verification query
SELECT 
  (SELECT COUNT(*) FROM public.brands) as brands_count,
  (SELECT COUNT(*) FROM public.categories) as categories_count,
  'Brands loaded, categories need to be added via UI due to organization_id requirement' as note;
