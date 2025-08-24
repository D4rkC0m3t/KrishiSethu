-- =============================================
-- DATA VALIDATION CONSTRAINTS
-- Execute this in Supabase SQL Editor
-- =============================================

-- 🔒 These constraints enforce business rules and data integrity
-- Run time: ~10 seconds total

BEGIN;

-- =============================================
-- PRODUCTS TABLE CONSTRAINTS
-- =============================================

-- 1. Quantity must be non-negative
ALTER TABLE products 
    DROP CONSTRAINT IF EXISTS check_positive_quantity,
    ADD CONSTRAINT check_positive_quantity 
    CHECK (quantity >= 0);

-- 2. Purchase price must be positive
ALTER TABLE products 
    DROP CONSTRAINT IF EXISTS check_positive_purchase_price,
    ADD CONSTRAINT check_positive_purchase_price 
    CHECK (purchase_price > 0);

-- 3. Sale price must be positive
ALTER TABLE products 
    DROP CONSTRAINT IF EXISTS check_positive_sale_price,
    ADD CONSTRAINT check_positive_sale_price 
    CHECK (sale_price > 0);

-- 4. Sale price should be greater than purchase price (business rule)
ALTER TABLE products 
    DROP CONSTRAINT IF EXISTS check_sale_gt_purchase,
    ADD CONSTRAINT check_sale_gt_purchase 
    CHECK (sale_price >= purchase_price);

-- 5. Minimum stock level must be non-negative
ALTER TABLE products 
    DROP CONSTRAINT IF EXISTS check_positive_min_stock,
    ADD CONSTRAINT check_positive_min_stock 
    CHECK (min_stock_level >= 0);

-- 6. GST rate must be valid (0-28% in India)
ALTER TABLE products 
    DROP CONSTRAINT IF EXISTS check_valid_gst_rate,
    ADD CONSTRAINT check_valid_gst_rate 
    CHECK (gst_rate >= 0 AND gst_rate <= 28);

-- 7. Product name must not be empty
ALTER TABLE products 
    DROP CONSTRAINT IF EXISTS check_product_name_not_empty,
    ADD CONSTRAINT check_product_name_not_empty 
    CHECK (TRIM(name) != '' AND LENGTH(TRIM(name)) >= 3);

-- 8. Batch number must not be empty
ALTER TABLE products 
    DROP CONSTRAINT IF EXISTS check_batch_no_not_empty,
    ADD CONSTRAINT check_batch_no_not_empty 
    CHECK (TRIM(batch_no) != '');

-- 9. Unit must be valid
ALTER TABLE products 
    DROP CONSTRAINT IF EXISTS check_valid_unit,
    ADD CONSTRAINT check_valid_unit 
    CHECK (unit IN ('pcs', 'kg', 'gm', 'ltr', 'ml', 'boxes', 'packets'));

-- 10. Expiry date must be in the future
ALTER TABLE products 
    DROP CONSTRAINT IF EXISTS check_expiry_date_future,
    ADD CONSTRAINT check_expiry_date_future 
    CHECK (expiry_date > CURRENT_DATE);

-- =============================================
-- SALES TABLE CONSTRAINTS
-- =============================================

-- 1. Total amount must be positive
ALTER TABLE sales 
    DROP CONSTRAINT IF EXISTS check_positive_total_amount,
    ADD CONSTRAINT check_positive_total_amount 
    CHECK (total_amount > 0);

-- 2. Tax amount must be non-negative
ALTER TABLE sales 
    DROP CONSTRAINT IF EXISTS check_non_negative_tax,
    ADD CONSTRAINT check_non_negative_tax 
    CHECK (tax_amount >= 0);

-- 3. Amount paid must be non-negative
ALTER TABLE sales 
    DROP CONSTRAINT IF EXISTS check_non_negative_amount_paid,
    ADD CONSTRAINT check_non_negative_amount_paid 
    CHECK (amount_paid >= 0);

-- 4. Sale date must not be in the future
ALTER TABLE sales 
    DROP CONSTRAINT IF EXISTS check_sale_date_not_future,
    ADD CONSTRAINT check_sale_date_not_future 
    CHECK (sale_date <= CURRENT_DATE);

-- 5. Payment status must be valid
ALTER TABLE sales 
    DROP CONSTRAINT IF EXISTS check_valid_payment_status,
    ADD CONSTRAINT check_valid_payment_status 
    CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue'));

-- =============================================
-- SALE ITEMS TABLE CONSTRAINTS
-- =============================================

-- 1. Quantity must be positive
ALTER TABLE sale_items 
    DROP CONSTRAINT IF EXISTS check_positive_sale_quantity,
    ADD CONSTRAINT check_positive_sale_quantity 
    CHECK (quantity > 0);

-- 2. Unit price must be positive
ALTER TABLE sale_items 
    DROP CONSTRAINT IF EXISTS check_positive_unit_price,
    ADD CONSTRAINT check_positive_unit_price 
    CHECK (unit_price > 0);

-- 3. Total price must equal quantity * unit_price
ALTER TABLE sale_items 
    DROP CONSTRAINT IF EXISTS check_total_price_calculation,
    ADD CONSTRAINT check_total_price_calculation 
    CHECK (ABS(total_price - (quantity * unit_price)) < 0.01);

-- =============================================
-- CATEGORIES TABLE CONSTRAINTS
-- =============================================

-- 1. Category name must not be empty
ALTER TABLE categories 
    DROP CONSTRAINT IF EXISTS check_category_name_not_empty,
    ADD CONSTRAINT check_category_name_not_empty 
    CHECK (TRIM(name) != '' AND LENGTH(TRIM(name)) >= 2);

-- 2. Sort order must be positive
ALTER TABLE categories 
    DROP CONSTRAINT IF EXISTS check_positive_sort_order,
    ADD CONSTRAINT check_positive_sort_order 
    CHECK (sort_order > 0);

-- =============================================
-- BRANDS TABLE CONSTRAINTS
-- =============================================

-- 1. Brand name must not be empty
ALTER TABLE brands 
    DROP CONSTRAINT IF EXISTS check_brand_name_not_empty,
    ADD CONSTRAINT check_brand_name_not_empty 
    CHECK (TRIM(name) != '' AND LENGTH(TRIM(name)) >= 2);

-- =============================================
-- SUPPLIERS TABLE CONSTRAINTS
-- =============================================

-- 1. Supplier name must not be empty
ALTER TABLE suppliers 
    DROP CONSTRAINT IF EXISTS check_supplier_name_not_empty,
    ADD CONSTRAINT check_supplier_name_not_empty 
    CHECK (TRIM(name) != '' AND LENGTH(TRIM(name)) >= 2);

-- 2. Credit limit must be non-negative
ALTER TABLE suppliers 
    DROP CONSTRAINT IF EXISTS check_non_negative_credit_limit,
    ADD CONSTRAINT check_non_negative_credit_limit 
    CHECK (credit_limit >= 0);

-- 3. Outstanding amount must be non-negative
ALTER TABLE suppliers 
    DROP CONSTRAINT IF EXISTS check_non_negative_outstanding,
    ADD CONSTRAINT check_non_negative_outstanding 
    CHECK (outstanding_amount >= 0);

COMMIT;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check all constraints were created
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
    AND tc.constraint_name LIKE 'check_%'
ORDER BY tc.table_name, tc.constraint_name;

-- Test constraint enforcement (these should fail)
-- Uncomment to test:

/*
-- This should fail - negative quantity
INSERT INTO products (name, quantity) VALUES ('Test Product', -5);

-- This should fail - sale price less than purchase price
INSERT INTO products (name, purchase_price, sale_price) 
VALUES ('Test Product', 100, 50);

-- This should fail - invalid GST rate
INSERT INTO products (name, gst_rate) VALUES ('Test Product', 35);
*/

-- =============================================
-- EXPECTED RESULTS
-- =============================================
-- ✅ Data integrity enforced at database level
-- ✅ Invalid data cannot be inserted
-- ✅ Business rules automatically validated
-- ✅ Better error messages for invalid operations
-- ✅ Prevents data corruption scenarios
