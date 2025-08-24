-- =============================================
-- MIGRATION: REMOVE REDUNDANT CATEGORY/BRAND FIELDS
-- Execute this in Supabase SQL Editor AFTER backup
-- =============================================

-- ⚠️  WARNING: This migration will remove data columns
-- ⚠️  BACKUP your database before running this script!

-- This migration addresses database design issues by:
-- 1. Removing redundant 'category' and 'brand' text fields from products table
-- 2. Ensuring all data is properly normalized through foreign keys
-- 3. Creating a backup of data before deletion

-- =============================================
-- STEP 1: PRE-MIGRATION VALIDATION
-- =============================================

-- Check for products with category text but no category_id
DO $$ 
DECLARE
    orphaned_categories INTEGER;
    orphaned_brands INTEGER;
BEGIN
    -- Count products with category text but NULL category_id
    SELECT COUNT(*) INTO orphaned_categories
    FROM products 
    WHERE category IS NOT NULL 
      AND category != '' 
      AND category_id IS NULL;
    
    -- Count products with brand text but NULL brand_id  
    SELECT COUNT(*) INTO orphaned_brands
    FROM products 
    WHERE brand IS NOT NULL 
      AND brand != '' 
      AND brand_id IS NULL;
    
    IF orphaned_categories > 0 THEN
        RAISE WARNING 'Found % products with category text but no category_id. Migration may cause data loss!', orphaned_categories;
    END IF;
    
    IF orphaned_brands > 0 THEN
        RAISE WARNING 'Found % products with brand text but no brand_id. Migration may cause data loss!', orphaned_brands;
    END IF;
    
    -- Log summary
    RAISE NOTICE 'Pre-migration validation complete:';
    RAISE NOTICE '- Products with orphaned categories: %', orphaned_categories;  
    RAISE NOTICE '- Products with orphaned brands: %', orphaned_brands;
END $$;

-- =============================================
-- STEP 2: CREATE BACKUP TABLE
-- =============================================

-- Create backup table with current product data
DROP TABLE IF EXISTS products_backup_before_migration;

CREATE TABLE products_backup_before_migration AS 
SELECT 
    id,
    name,
    category,      -- Text field we're removing
    brand,         -- Text field we're removing  
    category_id,   -- FK we're keeping
    brand_id,      -- FK we're keeping
    created_at,
    updated_at
FROM products;

COMMENT ON TABLE products_backup_before_migration IS 
'Backup of products table before removing redundant category/brand text fields';

-- Log backup creation
DO $$ 
DECLARE
    backup_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO backup_count FROM products_backup_before_migration;
    RAISE NOTICE 'Created backup table with % product records', backup_count;
END $$;

-- =============================================
-- STEP 3: DATA RECONCILIATION (OPTIONAL SAFETY)
-- =============================================

-- Attempt to reconcile orphaned data by creating missing categories/brands
-- This is optional but helps prevent data loss

-- Create missing categories
INSERT INTO categories (name, description, created_at, updated_at)
SELECT DISTINCT 
    p.category as name,
    'Auto-created during migration from products.category field' as description,
    NOW() as created_at,
    NOW() as updated_at
FROM products p
WHERE p.category IS NOT NULL 
  AND p.category != ''
  AND p.category_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM categories c 
    WHERE LOWER(c.name) = LOWER(p.category)
  );

-- Create missing brands  
INSERT INTO brands (name, description, created_at, updated_at)
SELECT DISTINCT 
    p.brand as name,
    'Auto-created during migration from products.brand field' as description,
    NOW() as created_at,
    NOW() as updated_at
FROM products p
WHERE p.brand IS NOT NULL 
  AND p.brand != ''
  AND p.brand_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM brands b 
    WHERE LOWER(b.name) = LOWER(p.brand)
  );

-- Update products with missing category_id
UPDATE products 
SET category_id = c.id,
    updated_at = NOW()
FROM categories c
WHERE products.category IS NOT NULL
  AND products.category != ''
  AND products.category_id IS NULL
  AND LOWER(c.name) = LOWER(products.category);

-- Update products with missing brand_id
UPDATE products 
SET brand_id = b.id,
    updated_at = NOW()
FROM brands b
WHERE products.brand IS NOT NULL
  AND products.brand != ''
  AND products.brand_id IS NULL
  AND LOWER(b.name) = LOWER(products.brand);

-- =============================================
-- STEP 4: FINAL VALIDATION BEFORE COLUMN DROP
-- =============================================

DO $$ 
DECLARE
    remaining_orphans INTEGER;
BEGIN
    -- Check if we still have orphaned data
    SELECT COUNT(*) INTO remaining_orphans
    FROM products 
    WHERE (
        (category IS NOT NULL AND category != '' AND category_id IS NULL) OR
        (brand IS NOT NULL AND brand != '' AND brand_id IS NULL)
    );
    
    IF remaining_orphans > 0 THEN
        RAISE WARNING 'Still found % products with orphaned category/brand data!', remaining_orphans;
        RAISE NOTICE 'Review data manually before proceeding with column drop';
    ELSE
        RAISE NOTICE 'All category/brand data is properly normalized. Safe to proceed.';
    END IF;
END $$;

-- =============================================
-- STEP 5: DROP REDUNDANT COLUMNS
-- =============================================

-- Remove the redundant text columns
-- (Uncomment these lines when you're ready to execute)

/*
ALTER TABLE products DROP COLUMN IF EXISTS category;
ALTER TABLE products DROP COLUMN IF EXISTS brand;
*/

-- =============================================
-- STEP 6: POST-MIGRATION VERIFICATION
-- =============================================

-- Function to verify migration success
CREATE OR REPLACE FUNCTION verify_migration_success()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check 1: Verify columns are dropped
    RETURN QUERY
    SELECT 
        'Column Removal'::TEXT as check_name,
        CASE 
            WHEN NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'products' 
                AND column_name IN ('category', 'brand')
            ) THEN 'PASSED'
            ELSE 'FAILED'
        END as status,
        'Redundant category/brand columns removed' as details;
    
    -- Check 2: Verify data integrity
    RETURN QUERY
    SELECT 
        'Data Integrity'::TEXT as check_name,
        CASE 
            WHEN (SELECT COUNT(*) FROM products) = 
                 (SELECT COUNT(*) FROM products_backup_before_migration)
            THEN 'PASSED'
            ELSE 'WARNING'
        END as status,
        format('Products: %s, Backup: %s', 
            (SELECT COUNT(*) FROM products),
            (SELECT COUNT(*) FROM products_backup_before_migration)
        ) as details;
    
    -- Check 3: Foreign key relationships
    RETURN QUERY
    SELECT 
        'Foreign Keys'::TEXT as check_name,
        CASE 
            WHEN (
                SELECT COUNT(*) FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                LEFT JOIN brands b ON p.brand_id = b.id
                WHERE (p.category_id IS NOT NULL AND c.id IS NULL)
                   OR (p.brand_id IS NOT NULL AND b.id IS NULL)
            ) = 0 THEN 'PASSED'
            ELSE 'FAILED' 
        END as status,
        'All category_id and brand_id references are valid' as details;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- STEP 7: CLEANUP FUNCTIONS
-- =============================================

-- Function to rollback migration if needed
CREATE OR REPLACE FUNCTION rollback_migration()
RETURNS TEXT AS $$
DECLARE
    result_text TEXT;
BEGIN
    -- Check if backup exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'products_backup_before_migration'
    ) THEN
        RETURN 'ERROR: Backup table not found. Cannot rollback.';
    END IF;
    
    -- Add columns back
    ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT;
    
    -- Restore data from backup
    UPDATE products SET 
        category = backup.category,
        brand = backup.brand
    FROM products_backup_before_migration backup
    WHERE products.id = backup.id;
    
    result_text := format('Rollback completed. Restored category/brand data for %s products.',
        (SELECT COUNT(*) FROM products_backup_before_migration));
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- USAGE INSTRUCTIONS
-- =============================================

/*
MIGRATION EXECUTION STEPS:

1. BACKUP YOUR DATABASE FIRST!

2. Run this script up to Step 4 (validation)

3. Review any warnings about orphaned data

4. When ready, uncomment and execute the ALTER TABLE statements in Step 5:
   ALTER TABLE products DROP COLUMN IF EXISTS category;
   ALTER TABLE products DROP COLUMN IF EXISTS brand;

5. Verify success:
   SELECT * FROM verify_migration_success();

6. If needed, rollback:  
   SELECT rollback_migration();

7. After verification, cleanup backup:
   DROP TABLE products_backup_before_migration;
*/

-- =============================================
-- EXPECTED BENEFITS AFTER MIGRATION
-- =============================================

/*
✅ Eliminated data redundancy
✅ Enforced referential integrity  
✅ Reduced storage requirements
✅ Improved query performance
✅ Easier maintenance of category/brand data
✅ Better data consistency
✅ Simplified backup/restore operations
*/

-- Log migration preparation completion
DO $$ 
BEGIN
    RAISE NOTICE '=== MIGRATION PREPARATION COMPLETE ===';
    RAISE NOTICE 'Review the warnings above and execute Step 5 when ready';
    RAISE NOTICE 'Use verify_migration_success() to validate after execution';
END $$;
