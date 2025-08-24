-- =============================================
-- CRITICAL PERFORMANCE INDEXES
-- Execute this in Supabase SQL Editor
-- =============================================

-- 🚀 These indexes will dramatically improve query performance
-- Run time: ~30 seconds total

-- 1. Products table foreign key indexes (CRITICAL)
-- These are essential for JOIN operations
CREATE INDEX IF NOT EXISTS idx_products_category_id 
    ON products(category_id) 
    WHERE category_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_brand_id 
    ON products(brand_id) 
    WHERE brand_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_supplier_id 
    ON products(supplier_id) 
    WHERE supplier_id IS NOT NULL;

-- 2. Frequently filtered columns
CREATE INDEX IF NOT EXISTS idx_products_active 
    ON products(is_active) 
    WHERE is_active = true;

-- 3. Low stock alert index (BUSINESS CRITICAL)
-- This enables fast low-stock queries
CREATE INDEX IF NOT EXISTS idx_products_low_stock 
    ON products(quantity, min_stock_level) 
    WHERE is_active = true AND quantity <= min_stock_level;

-- 4. Sales performance indexes
CREATE INDEX IF NOT EXISTS idx_sales_date 
    ON sales(sale_date DESC);

CREATE INDEX IF NOT EXISTS idx_sales_customer 
    ON sales(customer_id) 
    WHERE customer_id IS NOT NULL;

-- 5. Sale items performance
CREATE INDEX IF NOT EXISTS idx_sale_items_product 
    ON sale_items(product_id);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale 
    ON sale_items(sale_id);

-- 6. Text search optimization
CREATE INDEX IF NOT EXISTS idx_products_name_search 
    ON products USING gin(to_tsvector('english', name)) 
    WHERE is_active = true;

-- 7. Inventory value calculations
CREATE INDEX IF NOT EXISTS idx_products_inventory_value 
    ON products(quantity, purchase_price) 
    WHERE is_active = true AND quantity > 0;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check if indexes were created successfully
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('products', 'sales', 'sale_items')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Test performance improvement
EXPLAIN ANALYZE 
SELECT p.name, c.name as category, b.name as brand 
FROM products p
JOIN categories c ON p.category_id = c.id
JOIN brands b ON p.brand_id = b.id
WHERE p.is_active = true
LIMIT 10;

-- Test low stock query performance
EXPLAIN ANALYZE
SELECT name, quantity, min_stock_level
FROM products 
WHERE is_active = true 
  AND quantity <= min_stock_level
ORDER BY (quantity::float / min_stock_level::float) ASC;

-- =============================================
-- EXPECTED RESULTS
-- =============================================
-- ✅ Index Scan instead of Seq Scan for FK joins
-- ✅ Faster filtering on is_active column
-- ✅ Sub-second response for low stock alerts
-- ✅ Improved search performance on product names
-- ✅ Faster sales reporting queries
