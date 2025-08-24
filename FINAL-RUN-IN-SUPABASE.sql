-- =====================================================
-- MINIMAL FIX FOR KRISHISETHU INVENTORY LOADING ISSUE
-- Run this in Supabase SQL Editor Dashboard
-- =====================================================

BEGIN;

-- Create product type enum (required by your code)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_type_enum') THEN
    CREATE TYPE product_type_enum AS ENUM ('Chemical', 'Organic', 'Bio', 'NPK', 'Seeds', 'Pesticide', 'Tools');
  END IF;
END $$;

-- Add ALL missing columns to products table (this is the core fix)
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
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS gst_rate DECIMAL(5,2) DEFAULT 18.00,
ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb;

-- Create brands table (missing entirely)
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and create basic policy for brands
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage brands" ON public.brands
  FOR ALL TO authenticated USING (true);

-- Fix products table policies
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;
CREATE POLICY "Authenticated users can manage products" ON public.products
  FOR ALL TO authenticated USING (true);

-- Fix users table RLS (infinite recursion issue)
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_quantity ON public.products(quantity);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);

COMMIT;

-- Verification query - run this after to confirm it worked
SELECT 
  'SUCCESS: Products table now has ' || count(*) || ' columns' as result
FROM information_schema.columns 
WHERE table_name = 'products' AND table_schema = 'public';
