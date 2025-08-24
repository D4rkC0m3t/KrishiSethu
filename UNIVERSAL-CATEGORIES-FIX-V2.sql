-- =====================================================
-- MAKE CATEGORIES UNIVERSAL + ADD CUSTOM COLUMN - V2
-- Handles created_by constraint for audit tracking
-- Run this in Supabase SQL Editor Dashboard
-- =====================================================

BEGIN;

-- Step 1: Make categories universal by allowing NULL values
ALTER TABLE public.categories 
ALTER COLUMN organization_id DROP NOT NULL,
ALTER COLUMN created_by DROP NOT NULL;

-- Step 2: Add custom column for additional categorization
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS custom_type TEXT,
ADD COLUMN IF NOT EXISTS color_code TEXT DEFAULT '#3B82F6',
ADD COLUMN IF NOT EXISTS icon TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Step 3: Ensure sort_order column exists
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Step 4: Fix RLS policies for universal access
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can view categories" ON public.categories;
DROP POLICY IF EXISTS "Anonymous users can view categories" ON public.categories;

-- Create universal access policies
CREATE POLICY "Everyone can view categories" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage categories" ON public.categories
  FOR ALL TO authenticated USING (true);

-- Step 5: Insert comprehensive agricultural categories (with NULL for audit fields)
DO $$
BEGIN
  -- Only insert if categories table is empty
  IF NOT EXISTS (SELECT 1 FROM public.categories LIMIT 1) THEN
    
    -- Insert categories with NULL for organization_id and created_by (universal data)
    INSERT INTO public.categories (name, description, sort_order, custom_type, color_code, icon, organization_id, created_by) VALUES 
      
      -- FERTILIZER CATEGORIES
      ('Compound Fertilizers', 'Multi-nutrient fertilizers with NPK combinations', 1, 'Primary Fertilizer', '#10B981', '🌱', NULL, NULL),
      ('Nitrogen Fertilizers', 'High nitrogen content fertilizers for leaf growth', 2, 'Primary Fertilizer', '#3B82F6', '🍃', NULL, NULL),
      ('Phosphorus Fertilizers', 'Phosphorus-rich fertilizers for root development', 3, 'Primary Fertilizer', '#8B5CF6', '🌿', NULL, NULL),
      ('Potassium Fertilizers', 'Potassium fertilizers for plant strength and disease resistance', 4, 'Primary Fertilizer', '#F59E0B', '💪', NULL, NULL),
      
      -- ORGANIC FERTILIZERS  
      ('Organic Fertilizers', 'Natural and organic fertilizer options', 5, 'Organic', '#059669', '🌾', NULL, NULL),
      ('Compost & Manure', 'Decomposed organic matter and animal waste fertilizers', 6, 'Organic', '#065F46', '♻️', NULL, NULL),
      ('Bio-fertilizers', 'Microbial fertilizers with beneficial bacteria and fungi', 7, 'Organic', '#047857', '🦠', NULL, NULL),
      ('Vermi Compost', 'Earthworm-processed organic fertilizer', 8, 'Organic', '#064E3B', '🪱', NULL, NULL),
      
      -- MICRONUTRIENTS
      ('Micronutrients', 'Essential trace elements for plant health', 9, 'Micronutrient', '#DC2626', '⚗️', NULL, NULL),
      ('Calcium Fertilizers', 'Calcium-based fertilizers for cell wall development', 10, 'Micronutrient', '#7C2D12', '🦴', NULL, NULL),
      ('Magnesium Fertilizers', 'Magnesium for chlorophyll formation', 11, 'Micronutrient', '#991B1B', '🧪', NULL, NULL),
      ('Iron Fertilizers', 'Iron supplements for chlorosis prevention', 12, 'Micronutrient', '#B91C1C', '🔬', NULL, NULL),
      
      -- SPECIALTY FERTILIZERS
      ('Liquid Fertilizers', 'Water-soluble liquid nutrient solutions', 13, 'Specialty', '#0EA5E9', '💧', NULL, NULL),
      ('Foliar Fertilizers', 'Leaf-applied fertilizers for quick absorption', 14, 'Specialty', '#06B6D4', '🌿', NULL, NULL),
      ('Controlled Release', 'Slow-release coated fertilizers', 15, 'Specialty', '#0891B2', '⏱️', NULL, NULL),
      ('Water Soluble', 'Completely water-soluble fertilizers', 16, 'Specialty', '#0E7490', '🫧', NULL, NULL),
      
      -- SEEDS & PLANTING
      ('Seeds', 'Agricultural seeds and planting materials', 17, 'Seeds', '#22C55E', '🌱', NULL, NULL),
      ('Vegetable Seeds', 'Seeds for vegetable cultivation', 18, 'Seeds', '#16A34A', '🥬', NULL, NULL),
      ('Crop Seeds', 'Field crop and cereal seeds', 19, 'Seeds', '#15803D', '🌾', NULL, NULL),
      ('Flower Seeds', 'Ornamental and flower seeds', 20, 'Seeds', '#166534', '🌸', NULL, NULL),
      
      -- PLANT PROTECTION
      ('Pesticides', 'Plant protection and pest control products', 21, 'Protection', '#EF4444', '🛡️', NULL, NULL),
      ('Insecticides', 'Insect pest control products', 22, 'Protection', '#DC2626', '🐛', NULL, NULL),
      ('Fungicides', 'Fungal disease control products', 23, 'Protection', '#B91C1C', '🍄', NULL, NULL),
      ('Herbicides', 'Weed control and management products', 24, 'Protection', '#991B1B', '🌿', NULL, NULL),
      ('Rodenticides', 'Rodent control products', 25, 'Protection', '#7F1D1D', '🐭', NULL, NULL),
      
      -- GROWTH REGULATORS
      ('Growth Regulators', 'Plant growth promoting and regulating substances', 26, 'Growth', '#A855F7', '📈', NULL, NULL),
      ('Root Promoters', 'Root development enhancing products', 27, 'Growth', '#9333EA', '🌱', NULL, NULL),
      ('Flowering Stimulants', 'Products to promote flowering and fruiting', 28, 'Growth', '#7C3AED', '🌺', NULL, NULL),
      
      -- SOIL & AMENDMENTS
      ('Soil Conditioners', 'Soil structure and health improvement products', 29, 'Soil', '#92400E', '🏔️', NULL, NULL),
      ('pH Adjusters', 'Soil pH modification products', 30, 'Soil', '#78350F', '⚖️', NULL, NULL),
      ('Mulches', 'Organic and inorganic mulching materials', 31, 'Soil', '#451A03', '🍂', NULL, NULL),
      
      -- EQUIPMENT & TOOLS
      ('Tools', 'Agricultural tools and hand implements', 32, 'Equipment', '#6B7280', '🔧', NULL, NULL),
      ('Irrigation', 'Watering and irrigation equipment', 33, 'Equipment', '#4B5563', '💧', NULL, NULL),
      ('Sprayers', 'Pesticide and fertilizer application equipment', 34, 'Equipment', '#374151', '💨', NULL, NULL),
      ('Measuring Tools', 'pH meters, moisture meters, scales', 35, 'Equipment', '#1F2937', '📏', NULL, NULL),
      
      -- PACKAGING & STORAGE
      ('Packaging', 'Storage containers, bags, and packaging materials', 36, 'Storage', '#F97316', '📦', NULL, NULL),
      ('Preservatives', 'Storage and preservation products', 37, 'Storage', '#EA580C', '🛡️', NULL, NULL);
      
    RAISE NOTICE 'Added 37 comprehensive agricultural categories with custom types';
    
  ELSE
    RAISE NOTICE 'Categories table already has data, skipping comprehensive insert';
  END IF;
END $$;

-- Step 6: Also fix brands while we're at it
DROP POLICY IF EXISTS "Authenticated users can manage brands" ON public.brands;
DROP POLICY IF EXISTS "Authenticated users can view brands" ON public.brands;
DROP POLICY IF EXISTS "Anonymous users can view brands" ON public.brands;

CREATE POLICY "Everyone can view brands" ON public.brands
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage brands" ON public.brands
  FOR ALL TO authenticated USING (true);

-- Add sample brands if empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.brands LIMIT 1) THEN
    INSERT INTO public.brands (name, description) VALUES 
      ('AgriCorp', 'Premium agricultural products and fertilizers'),
      ('FertMax', 'Maximum yield fertilizer solutions'),
      ('CropGrow', 'Complete crop nutrition systems'),
      ('NutriCorp', 'Essential plant nutrition products'),
      ('EcoFarm', 'Sustainable and organic farming solutions'),
      ('GreenGold', 'Gold standard in agricultural inputs'),
      ('BioNutri', 'Biological nutrition solutions'),
      ('SeedMaster', 'Quality seeds and planting materials'),
      ('PlantCare', 'Comprehensive plant care products'),
      ('HarvestMax', 'Maximum harvest solutions');
      
    RAISE NOTICE 'Added 10 agricultural brands';
  END IF;
END $$;

COMMIT;

-- Verification query
SELECT 
  'SUCCESS: Categories and Brands loaded!' as result,
  (SELECT COUNT(*) FROM public.categories) as categories_count,
  (SELECT COUNT(*) FROM public.brands) as brands_count,
  (SELECT COUNT(DISTINCT custom_type) FROM public.categories) as category_types;
