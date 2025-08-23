-- Migration: Add subtotal and discount columns to sales table
-- Date: 2025-01-23
-- Purpose: Support discount tracking and subtotal storage in POS sales

-- Add the missing columns to the sales table
ALTER TABLE sales 
ADD COLUMN subtotal DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN discount DECIMAL(10,2) DEFAULT 0.00;

-- Add comments to document the columns
COMMENT ON COLUMN sales.subtotal IS 'Subtotal amount before discount and tax';
COMMENT ON COLUMN sales.discount IS 'Total discount amount applied to the sale';

-- Update existing records to calculate subtotal from total_amount and tax_amount
-- This is a best-effort calculation for existing data
UPDATE sales 
SET subtotal = COALESCE(total_amount - tax_amount, total_amount)
WHERE subtotal IS NULL OR subtotal = 0;

-- Verify the migration
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'sales' 
AND column_name IN ('subtotal', 'discount')
ORDER BY column_name;

-- Show sample data to verify
SELECT 
    id,
    sale_number,
    subtotal,
    discount,
    tax_amount,
    total_amount,
    created_at
FROM sales 
ORDER BY created_at DESC 
LIMIT 5;
