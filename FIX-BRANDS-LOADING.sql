-- =====================================================
-- FIX BRANDS LOADING ISSUE
-- Run this in Supabase SQL Editor Dashboard
-- =====================================================

BEGIN;

-- Fix brands table RLS policies (ensure authenticated users can access)
DROP POLICY IF EXISTS "Authenticated users can manage brands" ON public.brands;
DROP POLICY IF EXISTS "Authenticated users can view brands" ON public.brands;

-- Create comprehensive policies for brands
CREATE POLICY "Authenticated users can view brands" ON public.brands
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage brands" ON public.brands
  FOR ALL TO authenticated USING (true);

-- Allow anonymous users to view brands (for dropdowns)
CREATE POLICY "Anonymous users can view brands" ON public.brands
  FOR SELECT TO anon USING (true);

-- Add sample brands data (check if exists first)
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

-- Also fix categories table policies (same issue likely)
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can view categories" ON public.categories;

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

-- Add sample categories data (check if exists first)
DO $$
BEGIN
  -- Only insert if categories table is empty
  IF NOT EXISTS (SELECT 1 FROM public.categories LIMIT 1) THEN
    INSERT INTO public.categories (name, description, sort_order) VALUES 
      ('Compound Fertilizers', 'Multi-nutrient fertilizers with NPK combinations', 1),
      ('Nitrogen Fertilizers', 'High nitrogen content fertilizers', 2),
      ('Phosphorus Fertilizers', 'Phosphorus-rich fertilizers for root development', 3),
      ('Potassium Fertilizers', 'Potassium fertilizers for plant strength', 4),
      ('Organic Fertilizers', 'Natural and organic fertilizer options', 5),
      ('Micronutrients', 'Essential micronutrient fertilizers', 6),
      ('Bio-fertilizers', 'Biological fertilizer solutions', 7),
      ('Seeds', 'Agricultural seeds and planting materials', 8),
      ('Pesticides', 'Plant protection products', 9),
      ('Tools', 'Agricultural tools and equipment', 10);
      
    RAISE NOTICE 'Added 10 sample categories';
  ELSE
    RAISE NOTICE 'Categories table already has data, skipping insert';
  END IF;
END $$;

COMMIT;

-- Verification query
SELECT 
  (SELECT COUNT(*) FROM public.brands) as brands_count,
  (SELECT COUNT(*) FROM public.categories) as categories_count;
