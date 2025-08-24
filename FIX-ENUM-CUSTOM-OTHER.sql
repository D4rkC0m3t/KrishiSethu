-- =====================================================
-- FIX PRODUCT TYPE ENUM TO SUPPORT CUSTOM/OTHER
-- Adds "Custom/Other" to the product_type_enum
-- Run this in Supabase SQL Editor Dashboard
-- =====================================================

-- Step 1: Add Custom/Other to the product_type_enum
ALTER TYPE product_type_enum ADD VALUE IF NOT EXISTS 'Custom/Other';

-- Step 2: Verify the enum values
DO $$
BEGIN
    -- Show all enum values
    RAISE NOTICE 'Current product_type_enum values:';
    FOR r IN SELECT unnest(enum_range(NULL::product_type_enum)) as enum_value LOOP
        RAISE NOTICE '  - %', r.enum_value;
    END LOOP;
END $$;

-- Step 3: Test insertion (will be rolled back)
DO $$
DECLARE
    test_id UUID;
BEGIN
    -- Try to insert a test product with Custom/Other
    INSERT INTO products (name, category, type, unit, purchase_price, sale_price, stock_quantity, gst_rate)
    VALUES ('Test Custom Product', 'Chemical Fertilizer', 'Custom/Other', 'pcs', 100, 150, 10, 5)
    RETURNING id INTO test_id;
    
    RAISE NOTICE 'SUCCESS: Custom/Other type can be inserted (ID: %)', test_id;
    
    -- Clean up test record
    DELETE FROM products WHERE id = test_id;
    RAISE NOTICE 'Test record cleaned up';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: Could not insert Custom/Other: %', SQLERRM;
END $$;

-- Verification query
SELECT 'Product type enum updated to support Custom/Other' as result;
