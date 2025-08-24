-- Fix KrishiSethu database schema issues
-- Final version - simplified to work with actual schema

BEGIN;

-- =====================================================
-- PHASE 1: FIX USERS TABLE RLS POLICIES
-- =====================================================

-- Temporarily disable RLS on users table
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive RLS policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Re-enable RLS with fixed policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PHASE 2: CREATE MISSING BRANDS TABLE
-- =====================================================

-- Create brands table (it doesn't exist)
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on brands table
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for brands
CREATE POLICY "Authenticated users can manage brands" ON public.brands
  FOR ALL TO authenticated USING (true);

-- =====================================================
-- PHASE 3: ADD MISSING COLUMNS TO PRODUCTS TABLE
-- =====================================================

-- Create product type enum first
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_type_enum') THEN
    CREATE TYPE product_type_enum AS ENUM ('Chemical', 'Organic', 'Bio', 'NPK', 'Seeds', 'Pesticide', 'Tools');
  END IF;
END $$;

-- Add missing critical columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS type product_type_enum DEFAULT 'Chemical',
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'kg',
ADD COLUMN IF NOT EXISTS reorder_level INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS batch_no TEXT,
ADD COLUMN IF NOT EXISTS expiry_date DATE,
ADD COLUMN IF NOT EXISTS manufacturing_date DATE,
ADD COLUMN IF NOT EXISTS supplier TEXT,
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS gst_rate DECIMAL(5,2) DEFAULT 18.00,
ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb;

-- Add check constraint for status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'products_status_check'
  ) THEN
    ALTER TABLE public.products 
    ADD CONSTRAINT products_status_check 
    CHECK (status IN ('active', 'inactive', 'discontinued'));
  END IF;
END $$;

-- Add sort_order column to categories if it doesn't exist
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- =====================================================
-- PHASE 4: FIX RLS POLICIES ON EXISTING TABLES
-- =====================================================

-- Categories table policies
CREATE POLICY "Authenticated users can manage categories" ON public.categories
  FOR ALL TO authenticated USING (true);

-- Suppliers table policies  
CREATE POLICY "Authenticated users can manage suppliers" ON public.suppliers
  FOR ALL TO authenticated USING (true);

-- Customers table policies
CREATE POLICY "Authenticated users can manage customers" ON public.customers
  FOR ALL TO authenticated USING (true);

-- Products table policies (ensure they allow full access)
CREATE POLICY "Authenticated users can manage products" ON public.products
  FOR ALL TO authenticated USING (true);

-- =====================================================
-- PHASE 5: ADD DEFAULT REFERENCE DATA (SIMPLE INSERTS)
-- =====================================================

-- Insert default categories (simple insert, ignore duplicates by checking first)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Compound Fertilizers') THEN
    INSERT INTO public.categories (name, description, sort_order) 
    VALUES ('Compound Fertilizers', 'Multi-nutrient fertilizers with NPK combinations', 1);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Nitrogen Fertilizers') THEN
    INSERT INTO public.categories (name, description, sort_order) 
    VALUES ('Nitrogen Fertilizers', 'High nitrogen content fertilizers', 2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Phosphorus Fertilizers') THEN
    INSERT INTO public.categories (name, description, sort_order) 
    VALUES ('Phosphorus Fertilizers', 'Phosphorus-rich fertilizers for root development', 3);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Potassium Fertilizers') THEN
    INSERT INTO public.categories (name, description, sort_order) 
    VALUES ('Potassium Fertilizers', 'Potassium fertilizers for plant strength', 4);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Organic Fertilizers') THEN
    INSERT INTO public.categories (name, description, sort_order) 
    VALUES ('Organic Fertilizers', 'Natural and organic fertilizer options', 5);
  END IF;
END $$;

-- Insert default brands (simple insert, ignore duplicates)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.brands WHERE name = 'AgriCorp') THEN
    INSERT INTO public.brands (name, description) 
    VALUES ('AgriCorp', 'Premium agricultural products and fertilizers');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.brands WHERE name = 'FertMax') THEN
    INSERT INTO public.brands (name, description) 
    VALUES ('FertMax', 'Maximum yield fertilizer solutions');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.brands WHERE name = 'CropGrow') THEN
    INSERT INTO public.brands (name, description) 
    VALUES ('CropGrow', 'Complete crop nutrition systems');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.brands WHERE name = 'NutriCorp') THEN
    INSERT INTO public.brands (name, description) 
    VALUES ('NutriCorp', 'Essential plant nutrition products');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM public.brands WHERE name = 'EcoFarm') THEN
    INSERT INTO public.brands (name, description) 
    VALUES ('EcoFarm', 'Sustainable and organic farming solutions');
  END IF;
END $$;

-- =====================================================
-- PHASE 6: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_quantity ON public.products(quantity);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);

COMMIT;

-- Success message
SELECT 'KrishiSethu database schema fix completed successfully!' as result;
