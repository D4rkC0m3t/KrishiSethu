-- =====================================================
-- ADD BARCODE COLUMN TO PRODUCTS TABLE
-- Run this SQL in: Supabase Dashboard > SQL Editor
-- =====================================================

-- Add barcode column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS barcode VARCHAR(255);

-- Add index on barcode for faster searches
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) 
WHERE barcode IS NOT NULL;

-- Add comment to document the column
COMMENT ON COLUMN products.barcode IS 'Product barcode or QR code for scanning';

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND table_schema = 'public' 
  AND column_name = 'barcode';
