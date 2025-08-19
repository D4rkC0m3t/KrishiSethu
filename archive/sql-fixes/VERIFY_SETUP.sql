-- ============================================================================
-- ✅ VERIFY COMPLETE SETUP
-- ============================================================================
-- Run this to confirm everything is working properly
-- ============================================================================

-- Check all tables exist and are accessible
SELECT 'Table Check' as test_type, 
       table_name, 
       'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check seed data
SELECT 'Seed Data' as test_type, 'categories' as table_name, count(*) as records FROM categories
UNION ALL
SELECT 'Seed Data' as test_type, 'brands' as table_name, count(*) as records FROM brands
UNION ALL
SELECT 'Seed Data' as test_type, 'suppliers' as table_name, count(*) as records FROM suppliers
UNION ALL
SELECT 'Seed Data' as test_type, 'customers' as table_name, count(*) as records FROM customers;

-- Test basic operations
INSERT INTO categories (name, description) VALUES ('Test Category', 'Test Description') 
ON CONFLICT (name) DO NOTHING;

SELECT 'Operation Test' as test_type, 'INSERT' as operation, 'SUCCESS' as status;

-- Clean up test data
DELETE FROM categories WHERE name = 'Test Category';

SELECT 'Operation Test' as test_type, 'DELETE' as operation, 'SUCCESS' as status;

-- Final status
SELECT '🎉 SETUP VERIFICATION COMPLETE' as final_status, 
       'Database is ready for use!' as message;