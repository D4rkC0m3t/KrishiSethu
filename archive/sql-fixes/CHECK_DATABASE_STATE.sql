-- ============================================================================
-- 🔍 CHECK CURRENT DATABASE STATE
-- ============================================================================
-- Run this to see what's already in your database
-- ============================================================================

-- Check existing tables
SELECT 
    'TABLES' as object_type,
    table_name as name,
    'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check existing types/enums
SELECT 
    'TYPES' as object_type,
    typname as name,
    'EXISTS' as status
FROM pg_type 
WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND typtype = 'e'
ORDER BY typname;

-- Check existing functions
SELECT 
    'FUNCTIONS' as object_type,
    proname as name,
    'EXISTS' as status
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;

-- Check existing triggers
SELECT 
    'TRIGGERS' as object_type,
    trigger_name as name,
    event_object_table as table_name
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY trigger_name;

-- Check data in key tables
SELECT 'DATA - Categories' as info, count(*) as count FROM categories;
SELECT 'DATA - Brands' as info, count(*) as count FROM brands;
SELECT 'DATA - Suppliers' as info, count(*) as count FROM suppliers;
SELECT 'DATA - Customers' as info, count(*) as count FROM customers;
SELECT 'DATA - Products' as info, count(*) as count FROM products;

-- Check if auth.users table exists and has data
SELECT 'AUTH - Users' as info, count(*) as count FROM auth.users;