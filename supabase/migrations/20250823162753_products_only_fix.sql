-- Minimal fix: Only add missing columns to products table
-- No data inserts or complex operations

BEGIN;

-- Create product type enum first
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_type_enum') THEN
    CREATE TYPE product_type_enum AS ENUM ('Chemical', 'Organic', 'Bio', 'NPK', 'Seeds', 'Pesticide', 'Tools');
  END IF;
END $$;

-- Add ALL missing critical columns to products table in one statement
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

COMMIT;

-- Success message
SELECT 'Products table columns added successfully!' as result;
