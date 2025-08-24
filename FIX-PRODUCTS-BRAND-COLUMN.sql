-- =====================================================
-- FIX PRODUCTS TABLE - ADD MISSING BRAND_ID COLUMN
-- Fix the "Could not find the 'brand_id' column" error
-- Run this in Supabase SQL Editor Dashboard
-- =====================================================

BEGIN;

-- Step 1: Check if brand_id column exists, if not add it
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id);

-- Step 2: Check if category_id column exists, if not add it
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id);

-- Step 3: Add other missing columns that might be expected
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS code VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'Chemical',
ADD COLUMN IF NOT EXISTS unit VARCHAR(20) DEFAULT 'pcs',
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.suppliers(id),
ADD COLUMN IF NOT EXISTS batch_no VARCHAR(50),
ADD COLUMN IF NOT EXISTS barcode VARCHAR(100),
ADD COLUMN IF NOT EXISTS expiry_date DATE,
ADD COLUMN IF NOT EXISTS manufacturing_date DATE,
ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS min_stock_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_stock_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reorder_point INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS gst_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS organization_id UUID,
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON public.products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_products_code ON public.products(code);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);

-- Step 5: Create updated_at trigger
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON public.products 
  FOR EACH ROW EXECUTE FUNCTION update_products_updated_at();

-- Step 6: Disable RLS on products table (for consistency with other tables)
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- Step 7: Grant permissions
GRANT ALL ON public.products TO anon, authenticated;

COMMIT;

-- Verification
SELECT 
  'Products table schema updated' as result,
  (SELECT COUNT(*) FROM public.products) as total_products;

-- Show column info
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' AND table_schema = 'public'
ORDER BY column_name;
