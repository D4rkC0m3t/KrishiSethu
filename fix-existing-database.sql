-- =====================================================
-- TARGETED DATABASE FIX FOR KRISHISETHU
-- Based on CLI inspection - adds only missing columns/tables
-- =====================================================

-- =====================================================
-- PHASE 1: FIX USERS TABLE RLS POLICIES
-- =====================================================

-- Temporarily disable RLS on users table
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;

-- Drop all problematic RLS policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authentication users only" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.users;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON public.users;

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
CREATE POLICY "Authenticated users can view brands" ON public.brands
  FOR SELECT TO authenticated USING (true);

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
-- (only adds columns that don't exist)

-- Basic product info columns
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS type product_type_enum DEFAULT 'Chemical';

-- Inventory quantity columns
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'kg',
ADD COLUMN IF NOT EXISTS reorder_level INTEGER DEFAULT 10;

-- Pricing columns
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10,2) DEFAULT 0;

-- Batch and date tracking columns
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS batch_no TEXT,
ADD COLUMN IF NOT EXISTS expiry_date DATE,
ADD COLUMN IF NOT EXISTS manufacturing_date DATE;

-- Supplier and references
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS supplier TEXT,
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id);

-- Status and additional data
ALTER TABLE public.products 
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

-- =====================================================
-- PHASE 4: CREATE MISSING INDEXES
-- =====================================================

-- Create indexes for the new columns (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_type ON public.products(type);
CREATE INDEX IF NOT EXISTS idx_products_quantity ON public.products(quantity);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON public.products(supplier);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON public.products(brand_id);

-- =====================================================
-- PHASE 5: FIX RLS POLICIES ON EXISTING TABLES
-- =====================================================

-- Update RLS policies to allow authenticated users to insert data

-- Categories table policies
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON public.categories;
CREATE POLICY "Authenticated users can manage categories" ON public.categories
  FOR ALL TO authenticated USING (true);

-- Suppliers table policies  
DROP POLICY IF EXISTS "Authenticated users can manage suppliers" ON public.suppliers;
CREATE POLICY "Authenticated users can manage suppliers" ON public.suppliers
  FOR ALL TO authenticated USING (true);

-- Customers table policies
DROP POLICY IF EXISTS "Authenticated users can manage customers" ON public.customers;
CREATE POLICY "Authenticated users can manage customers" ON public.customers
  FOR ALL TO authenticated USING (true);

-- Products table policies (ensure they allow full access)
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;
CREATE POLICY "Authenticated users can manage products" ON public.products
  FOR ALL TO authenticated USING (true);

-- =====================================================
-- PHASE 6: ADD DEFAULT REFERENCE DATA
-- =====================================================

-- Insert default categories (if they don't exist)
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
  ('Tools', 'Agricultural tools and equipment', 10)
ON CONFLICT (name) DO NOTHING;

-- Insert default brands (if they don't exist)
INSERT INTO public.brands (name, description) VALUES 
  ('AgriCorp', 'Premium agricultural products and fertilizers'),
  ('FertMax', 'Maximum yield fertilizer solutions'),
  ('CropGrow', 'Complete crop nutrition systems'),
  ('NutriCrop', 'Essential plant nutrition products'),
  ('EcoFarm', 'Sustainable and organic farming solutions'),
  ('GreenGold', 'Gold standard in agricultural inputs'),
  ('BioNutri', 'Biological nutrition solutions'),
  ('SeedMaster', 'Quality seeds and planting materials')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- PHASE 7: CREATE TRIGGERS FOR NEW COLUMNS
-- =====================================================

-- Create updated_at trigger for brands table
DROP TRIGGER IF EXISTS update_brands_updated_at ON public.brands;
CREATE TRIGGER update_brands_updated_at
    BEFORE UPDATE ON public.brands
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICATION & SUCCESS MESSAGE
-- =====================================================

-- Verify the fixes worked
DO $$ 
DECLARE
    products_cols INTEGER;
    brands_exists BOOLEAN;
    categories_count INTEGER;
    brands_count INTEGER;
BEGIN
    -- Check products table column count
    SELECT COUNT(*) INTO products_cols 
    FROM information_schema.columns 
    WHERE table_name = 'products' AND table_schema = 'public';
    
    -- Check if brands table exists
    SELECT EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'brands' AND table_schema = 'public'
    ) INTO brands_exists;
    
    -- Count reference data
    SELECT COUNT(*) INTO categories_count FROM public.categories;
    SELECT COUNT(*) INTO brands_count FROM public.brands;
    
    RAISE NOTICE 'DATABASE FIX VERIFICATION:';
    RAISE NOTICE '========================';
    RAISE NOTICE 'Products table columns: %', products_cols;
    RAISE NOTICE 'Brands table exists: %', brands_exists;
    RAISE NOTICE 'Categories loaded: %', categories_count;
    RAISE NOTICE 'Brands loaded: %', brands_count;
    
    IF products_cols >= 20 AND brands_exists AND categories_count > 5 AND brands_count > 5 THEN
        RAISE NOTICE '✅ DATABASE FIX COMPLETED SUCCESSFULLY!';
        RAISE NOTICE '💡 Your inventory should now load properly.';
    ELSE
        RAISE NOTICE '⚠️  Some issues may remain. Check the logs above.';
    END IF;
END $$;

-- Final success message
SELECT 'KrishiSethu database fix completed! Missing columns added, RLS policies fixed, reference data loaded.' as result;
