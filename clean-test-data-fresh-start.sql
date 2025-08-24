-- =====================================================
-- Clean Test Data for Fresh Start
-- This removes all test/demo data so you can start clean
-- =====================================================

-- IMPORTANT: This will DELETE all existing data!
-- Only run this if you want to start completely fresh

-- Step 1: Clean up all product-related data
DELETE FROM sale_items;
DELETE FROM purchase_items;
DELETE FROM stock_movements WHERE product_id IN (SELECT id FROM products);
DELETE FROM products;

-- Step 2: Clean up transaction data
DELETE FROM sales;
DELETE FROM purchases;

-- Step 3: Clean up related entities
DELETE FROM customers;
DELETE FROM suppliers;

-- Step 4: Reset settings to defaults
DELETE FROM settings WHERE owner_id IS NOT NULL;

-- Step 5: Keep categories and brands (they're global)
-- Don't delete categories and brands as they're shared

-- Step 6: Verify cleanup
SELECT 'products' as table_name, COUNT(*) as remaining_records FROM products
UNION ALL
SELECT 'customers' as table_name, COUNT(*) as remaining_records FROM customers
UNION ALL
SELECT 'suppliers' as table_name, COUNT(*) as remaining_records FROM suppliers
UNION ALL
SELECT 'sales' as table_name, COUNT(*) as remaining_records FROM sales
UNION ALL
SELECT 'purchases' as table_name, COUNT(*) as remaining_records FROM purchases;

-- You should see 0 records for all tables after running this script
-- Categories and brands will remain as they're shared globally
