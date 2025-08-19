-- =====================================================
-- ADD ATTACHMENTS COLUMN TO PRODUCTS TABLE
-- Krishisethu Inventory Management System
-- =====================================================
-- Purpose: Add attachments column to existing products table
-- This fixes the "attachments column not found" error
-- =====================================================

-- Add attachments column to products table if it doesn't exist
DO $$ 
BEGIN
    -- Check if attachments column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'attachments'
        AND table_schema = 'public'
    ) THEN
        -- Add the attachments column
        ALTER TABLE public.products 
        ADD COLUMN attachments JSONB DEFAULT '[]';
        
        RAISE NOTICE '✅ Added attachments column to products table';
        
        -- Create index for better performance on attachments queries
        CREATE INDEX IF NOT EXISTS idx_products_attachments 
        ON products USING GIN(attachments);
        
        RAISE NOTICE '✅ Created GIN index on attachments column';
        
    ELSE
        RAISE NOTICE '⚠️ Attachments column already exists in products table';
    END IF;
END $$;

-- Add comment to document the column
COMMENT ON COLUMN products.attachments IS 'JSONB array storing file attachments with metadata (name, url, type, size, etc.)';

-- Verify the column was added
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'attachments'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE NOTICE '🎉 SUCCESS: attachments column is now available in products table';
        RAISE NOTICE '📋 Column type: JSONB with default value []';
        RAISE NOTICE '🔍 Index: GIN index created for efficient queries';
    ELSE
        RAISE NOTICE '❌ ERROR: attachments column was not created successfully';
    END IF;
END $$;

-- Show current products table structure for verification
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
AND table_schema = 'public'
ORDER BY ordinal_position;
