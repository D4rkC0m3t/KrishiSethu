-- =====================================================
-- Check Shared/Universal Data
-- This checks for any global data that might cause loading issues
-- =====================================================

-- Check Categories (shared globally)
SELECT 'Categories' as data_type, COUNT(*) as total_records FROM categories;
SELECT 'Categories Details' as section, id, name, description, is_active, sort_order, created_at FROM categories ORDER BY sort_order;

-- Check Brands (shared globally)
SELECT 'Brands' as data_type, COUNT(*) as total_records FROM brands;
SELECT 'Brands Details' as section, id, name, description, is_active, created_at FROM brands ORDER BY name;

-- Check for any system-wide settings
SELECT 'Settings' as data_type, COUNT(*) as total_records FROM settings;
SELECT 'Settings Details' as section, id, key, value, owner_id, created_at FROM settings ORDER BY key;

-- Check for audit logs (might accumulate over time)
SELECT 'Audit Logs' as data_type, COUNT(*) as total_records FROM audit_logs;
SELECT 'Recent Audit Logs' as section, id, table_name, action, record_id, created_at 
FROM audit_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Check for any stock movements (even with deleted products)
SELECT 'Stock Movements' as data_type, COUNT(*) as total_records FROM stock_movements;
SELECT 'Recent Stock Movements' as section, id, product_id, movement_type, quantity, movement_date 
FROM stock_movements 
ORDER BY movement_date DESC 
LIMIT 10;

-- Check for any orphaned sale_items or purchase_items
SELECT 'Sale Items' as data_type, COUNT(*) as total_records FROM sale_items;
SELECT 'Purchase Items' as data_type, COUNT(*) as total_records FROM purchase_items;

-- Check for any E-invoice data
SELECT 'E-invoices' as data_type, COUNT(*) as total_records FROM einvoices;
SELECT 'E-invoice Items' as data_type, COUNT(*) as total_records FROM einvoice_items;

-- Check for any customer payments/balances
SELECT 'Customer Payments' as data_type, COUNT(*) as total_records FROM customer_payments;
SELECT 'Customer Balances' as data_type, COUNT(*) as total_records FROM customer_balances;

-- Check database size and table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check for any large text/JSON data that might slow queries
SELECT 'Large Settings Values' as section, key, length(value) as value_length 
FROM settings 
WHERE length(value) > 1000 
ORDER BY length(value) DESC;

-- Check all table record counts
SELECT 'products' as table_name, COUNT(*) as records FROM products
UNION ALL
SELECT 'customers' as table_name, COUNT(*) as records FROM customers
UNION ALL
SELECT 'suppliers' as table_name, COUNT(*) as records FROM suppliers
UNION ALL
SELECT 'sales' as table_name, COUNT(*) as records FROM sales
UNION ALL
SELECT 'purchases' as table_name, COUNT(*) as records FROM purchases
UNION ALL
SELECT 'categories' as table_name, COUNT(*) as records FROM categories
UNION ALL
SELECT 'brands' as table_name, COUNT(*) as records FROM brands
UNION ALL
SELECT 'settings' as table_name, COUNT(*) as records FROM settings
UNION ALL
SELECT 'audit_logs' as table_name, COUNT(*) as records FROM audit_logs
UNION ALL
SELECT 'stock_movements' as table_name, COUNT(*) as records FROM stock_movements
UNION ALL
SELECT 'sale_items' as table_name, COUNT(*) as records FROM sale_items
UNION ALL
SELECT 'purchase_items' as table_name, COUNT(*) as records FROM purchase_items
ORDER BY records DESC;
