-- =============================================
-- CRITICAL VALIDATION CONSTRAINTS
-- Execute this in Supabase SQL Editor
-- =============================================

-- 🛡️ These constraints enforce business rules and prevent invalid data
-- Essential for data integrity and business logic enforcement

-- =============================================
-- PRODUCTS TABLE CONSTRAINTS
-- =============================================

-- Prevent negative quantities (core business rule)
ALTER TABLE products 
ADD CONSTRAINT chk_products_quantity_non_negative 
CHECK (quantity >= 0);

-- Prevent negative purchase prices
ALTER TABLE products 
ADD CONSTRAINT chk_products_purchase_price_non_negative 
CHECK (purchase_price >= 0);

-- Prevent negative sale prices
ALTER TABLE products 
ADD CONSTRAINT chk_products_sale_price_non_negative 
CHECK (sale_price >= 0);

-- Ensure sale price is not less than purchase price (prevent losses)
ALTER TABLE products 
ADD CONSTRAINT chk_products_sale_price_reasonable 
CHECK (sale_price >= purchase_price);

-- Valid GST rate range (0% to 28% in India)
ALTER TABLE products 
ADD CONSTRAINT chk_products_gst_rate_valid 
CHECK (gst_rate >= 0 AND gst_rate <= 28);

-- Valid minimum stock level
ALTER TABLE products 
ADD CONSTRAINT chk_products_min_stock_non_negative 
CHECK (min_stock_level >= 0);

-- Product name cannot be empty
ALTER TABLE products 
ADD CONSTRAINT chk_products_name_not_empty 
CHECK (name IS NOT NULL AND trim(name) != '');

-- =============================================
-- CATEGORIES TABLE CONSTRAINTS
-- =============================================

-- Category name cannot be empty
ALTER TABLE categories 
ADD CONSTRAINT chk_categories_name_not_empty 
CHECK (name IS NOT NULL AND trim(name) != '');

-- =============================================
-- BRANDS TABLE CONSTRAINTS
-- =============================================

-- Brand name cannot be empty
ALTER TABLE brands 
ADD CONSTRAINT chk_brands_name_not_empty 
CHECK (name IS NOT NULL AND trim(name) != '');

-- =============================================
-- SALES TABLE CONSTRAINTS
-- =============================================

-- Prevent future sale dates (business rule)
ALTER TABLE sales 
ADD CONSTRAINT chk_sales_date_not_future 
CHECK (sale_date <= CURRENT_DATE);

-- Prevent negative total amounts
ALTER TABLE sales 
ADD CONSTRAINT chk_sales_total_amount_non_negative 
CHECK (total_amount >= 0);

-- Valid payment status
ALTER TABLE sales 
ADD CONSTRAINT chk_sales_payment_status_valid 
CHECK (payment_status IN ('paid', 'pending', 'cancelled', 'refunded'));

-- =============================================
-- SALE_ITEMS TABLE CONSTRAINTS
-- =============================================

-- Prevent negative quantities in sale items
ALTER TABLE sale_items 
ADD CONSTRAINT chk_sale_items_quantity_positive 
CHECK (quantity > 0);

-- Prevent negative unit prices
ALTER TABLE sale_items 
ADD CONSTRAINT chk_sale_items_unit_price_non_negative 
CHECK (unit_price >= 0);

-- Prevent negative total prices
ALTER TABLE sale_items 
ADD CONSTRAINT chk_sale_items_total_price_non_negative 
CHECK (total_price >= 0);

-- Ensure total_price = quantity * unit_price (data consistency)
ALTER TABLE sale_items 
ADD CONSTRAINT chk_sale_items_total_price_calculation 
CHECK (ABS(total_price - (quantity * unit_price)) < 0.01);

-- =============================================
-- SUPPLIERS TABLE CONSTRAINTS
-- =============================================

-- Supplier name cannot be empty
ALTER TABLE suppliers 
ADD CONSTRAINT chk_suppliers_name_not_empty 
CHECK (name IS NOT NULL AND trim(name) != '');

-- Valid email format (basic check)
ALTER TABLE suppliers 
ADD CONSTRAINT chk_suppliers_email_format 
CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Valid phone number (basic length check)
ALTER TABLE suppliers 
ADD CONSTRAINT chk_suppliers_phone_length 
CHECK (phone IS NULL OR length(trim(phone)) >= 10);

-- =============================================
-- CUSTOMERS TABLE CONSTRAINTS
-- =============================================

-- Customer name cannot be empty
ALTER TABLE customers 
ADD CONSTRAINT chk_customers_name_not_empty 
CHECK (name IS NOT NULL AND trim(name) != '');

-- Valid email format (basic check)
ALTER TABLE customers 
ADD CONSTRAINT chk_customers_email_format 
CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Valid phone number (basic length check)
ALTER TABLE customers 
ADD CONSTRAINT chk_customers_phone_length 
CHECK (phone IS NULL OR length(trim(phone)) >= 10);

-- =============================================
-- AUDIT FIELDS CONSTRAINTS (ALL TABLES)
-- =============================================

-- Ensure created_at is not in the distant future (prevent data errors)
DO $$
DECLARE 
    tbl_name TEXT;
    tables_with_timestamps TEXT[] := ARRAY['products', 'categories', 'brands', 'sales', 'sale_items', 'suppliers', 'customers'];
BEGIN
    FOREACH tbl_name IN ARRAY tables_with_timestamps
    LOOP
        -- Check if the table exists and has the columns
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = tbl_name AND column_name = 'created_at'
        ) THEN
            EXECUTE format('
                ALTER TABLE %I 
                ADD CONSTRAINT chk_%I_created_at_reasonable 
                CHECK (created_at <= NOW() + INTERVAL ''1 hour'')
            ', tbl_name, tbl_name);
        END IF;
        
        -- Ensure updated_at >= created_at (logical constraint)
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = tbl_name AND column_name = 'updated_at'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = tbl_name AND column_name = 'created_at'
        ) THEN
            EXECUTE format('
                ALTER TABLE %I 
                ADD CONSTRAINT chk_%I_updated_at_after_created 
                CHECK (updated_at >= created_at)
            ', tbl_name, tbl_name);
        END IF;
    END LOOP;
END $$;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- List all constraints that were added
SELECT 
    conrelid::regclass AS table_name,
    conname AS constraint_name,
    contype AS constraint_type,
    CASE contype 
        WHEN 'c' THEN 'CHECK'
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'u' THEN 'UNIQUE'
        ELSE contype::text
    END AS constraint_description
FROM pg_constraint 
WHERE conname LIKE 'chk_%'
ORDER BY conrelid::regclass::text, conname;

-- Test constraints with invalid data (should all fail)
-- Note: These INSERT statements are designed to fail to verify constraints work

/*
-- Test 1: Negative quantity (should fail)
INSERT INTO products (name, quantity, purchase_price, sale_price) 
VALUES ('Test Product', -1, 100, 150);

-- Test 2: Sale price less than purchase price (should fail)  
INSERT INTO products (name, quantity, purchase_price, sale_price)
VALUES ('Test Product 2', 10, 150, 100);

-- Test 3: Invalid GST rate (should fail)
INSERT INTO products (name, quantity, purchase_price, sale_price, gst_rate)
VALUES ('Test Product 3', 10, 100, 150, 35);

-- Test 4: Future sale date (should fail)
INSERT INTO sales (sale_date, total_amount, payment_status)
VALUES (CURRENT_DATE + 1, 100, 'paid');

-- Test 5: Invalid email (should fail)
INSERT INTO customers (name, email) 
VALUES ('Test Customer', 'invalid-email');
*/

-- =============================================
-- CONSTRAINT TESTING FUNCTION
-- =============================================

-- Function to test if constraints are working properly
CREATE OR REPLACE FUNCTION test_constraints()
RETURNS TABLE(
    test_name TEXT,
    expected_result TEXT,
    actual_result TEXT,
    status TEXT
) AS $$
BEGIN
    -- Test negative quantity constraint
    BEGIN
        INSERT INTO products (name, quantity, purchase_price, sale_price) 
        VALUES ('__TEST__', -1, 100, 150);
        
        RETURN QUERY SELECT 
            'Negative Quantity'::TEXT,
            'Should fail'::TEXT, 
            'Insert succeeded'::TEXT,
            'FAILED'::TEXT;
        
        -- Clean up if insert somehow succeeded
        DELETE FROM products WHERE name = '__TEST__';
        
    EXCEPTION WHEN check_violation THEN
        RETURN QUERY SELECT 
            'Negative Quantity'::TEXT,
            'Should fail'::TEXT,
            'Insert failed (correct)'::TEXT, 
            'PASSED'::TEXT;
    END;
    
    -- Test invalid GST rate constraint
    BEGIN
        INSERT INTO products (name, quantity, purchase_price, sale_price, gst_rate) 
        VALUES ('__TEST2__', 10, 100, 150, 35);
        
        RETURN QUERY SELECT 
            'Invalid GST Rate'::TEXT,
            'Should fail'::TEXT,
            'Insert succeeded'::TEXT,
            'FAILED'::TEXT;
            
        -- Clean up if insert somehow succeeded
        DELETE FROM products WHERE name = '__TEST2__';
        
    EXCEPTION WHEN check_violation THEN
        RETURN QUERY SELECT 
            'Invalid GST Rate'::TEXT,
            'Should fail'::TEXT,
            'Insert failed (correct)'::TEXT,
            'PASSED'::TEXT;
    END;
    
    -- Test sale price < purchase price constraint
    BEGIN
        INSERT INTO products (name, quantity, purchase_price, sale_price) 
        VALUES ('__TEST3__', 10, 150, 100);
        
        RETURN QUERY SELECT 
            'Sale < Purchase Price'::TEXT,
            'Should fail'::TEXT,
            'Insert succeeded'::TEXT,
            'FAILED'::TEXT;
            
        -- Clean up if insert somehow succeeded  
        DELETE FROM products WHERE name = '__TEST3__';
        
    EXCEPTION WHEN check_violation THEN
        RETURN QUERY SELECT 
            'Sale < Purchase Price'::TEXT,
            'Should fail'::TEXT,
            'Insert failed (correct)'::TEXT,
            'PASSED'::TEXT;
    END;
END;
$$ LANGUAGE plpgsql;

-- Run constraint tests
-- SELECT * FROM test_constraints();

-- =============================================
-- EXPECTED BENEFITS
-- =============================================

/*
✅ Data Integrity Enforcement
✅ Business Rule Validation  
✅ Prevents Invalid Stock Levels
✅ Ensures Pricing Logic
✅ Validates Customer/Supplier Data
✅ Automatic Error Prevention
✅ Database-Level Data Quality
✅ Reduced Application-Level Validation Burden
*/

-- Log completion
DO $$ 
DECLARE
    constraint_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO constraint_count 
    FROM pg_constraint 
    WHERE conname LIKE 'chk_%';
    
    RAISE NOTICE '=== VALIDATION CONSTRAINTS APPLIED SUCCESSFULLY ===';
    RAISE NOTICE 'Added % check constraints to enforce business rules', constraint_count;
    RAISE NOTICE 'Your database now prevents invalid data at the database level!';
END $$;
