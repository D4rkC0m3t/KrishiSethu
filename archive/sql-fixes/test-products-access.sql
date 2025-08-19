-- ============================================================================
-- TEST PRODUCTS TABLE ACCESS AFTER RLS FIXES
-- ============================================================================

-- 1. Check if products table exists
SELECT 
    '📋 TABLE EXISTENCE CHECK' as section,
    '' as spacer;

SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity THEN '🔒 RLS ENABLED' 
        ELSE '🔓 RLS DISABLED' 
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename = 'products';

-- 2. Check products table structure
SELECT 
    '📋 PRODUCTS TABLE STRUCTURE' as section,
    '' as spacer;

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check current RLS policies on products table
SELECT 
    '🔐 PRODUCTS TABLE RLS POLICIES' as section,
    '' as spacer;

SELECT 
    policyname,
    cmd as operation,
    permissive,
    LEFT(COALESCE(qual, 'No condition'), 100) as condition
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'products'
ORDER BY policyname;

-- 4. Check current authentication status
SELECT 
    '👤 CURRENT AUTH STATUS' as section,
    '' as spacer;

SELECT 
    CASE 
        WHEN auth.uid() IS NOT NULL THEN '✅ AUTHENTICATED'
        ELSE '❌ NOT AUTHENTICATED'
    END as auth_status,
    COALESCE(auth.uid()::text, 'No user ID') as user_id,
    auth.role() as auth_role;

-- 5. Test basic products table access
SELECT 
    '🧪 PRODUCTS ACCESS TEST' as section,
    '' as spacer;

-- Count products (should work regardless of content)
SELECT 
    COUNT(*) as total_products,
    'Products table accessible' as status
FROM products;

-- 6. Try to select sample products data
SELECT 
    '📦 SAMPLE PRODUCTS DATA' as section,
    '' as spacer;

SELECT 
    id,
    name,
    category,
    quantity,
    created_at
FROM products 
ORDER BY created_at DESC 
LIMIT 5;

-- 7. Check if we can insert test data (will fail if RLS blocks it)
DO $$
BEGIN
    -- Try to insert a test product
    BEGIN
        INSERT INTO products (
            name, 
            category, 
            quantity, 
            purchase_price, 
            sale_price,
            created_at,
            updated_at
        ) VALUES (
            'TEST_PRODUCT_ACCESS_CHECK',
            'Test Category',
            1,
            100.00,
            150.00,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Products table INSERT access: SUCCESS';
        
        -- Clean up test data
        DELETE FROM products WHERE name = 'TEST_PRODUCT_ACCESS_CHECK';
        RAISE NOTICE '✅ Test data cleaned up successfully';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Products table INSERT access: FAILED - %', SQLERRM;
    END;
END $$;

-- 8. Check related tables access
SELECT 
    '🔗 RELATED TABLES STATUS' as section,
    '' as spacer;

-- Check categories table
SELECT 
    'categories' as table_name,
    COUNT(*) as record_count,
    '✅ Accessible' as status
FROM categories
UNION ALL
-- Check brands table  
SELECT 
    'brands' as table_name,
    COUNT(*) as record_count,
    '✅ Accessible' as status
FROM brands
UNION ALL
-- Check suppliers table
SELECT 
    'suppliers' as table_name,
    COUNT(*) as record_count,
    '✅ Accessible' as status
FROM suppliers;

-- 9. Check if any policies are blocking access
SELECT 
    '⚠️ POTENTIAL POLICY ISSUES' as section,
    '' as spacer;

-- Check for policies that might be too restrictive
SELECT 
    tablename,
    policyname,
    cmd,
    'Might be blocking access' as warning
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('products', 'categories', 'brands', 'suppliers')
    AND (
        qual LIKE '%auth.uid()%' 
        OR qual LIKE '%users%'
        OR qual LIKE '%profiles%'
    )
ORDER BY tablename, policyname;

-- 10. Final diagnosis
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 ================================';
    RAISE NOTICE '🔍 PRODUCTS ACCESS DIAGNOSIS';
    RAISE NOTICE '🔍 ================================';
    RAISE NOTICE '';
    RAISE NOTICE '📝 If you see data above, products table is accessible';
    RAISE NOTICE '📝 If you see 0 products, the table might be empty';
    RAISE NOTICE '📝 If you see permission denied errors, RLS policies need adjustment';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Next steps if products not loading in app:';
    RAISE NOTICE '   1. Check browser console for JavaScript errors';
    RAISE NOTICE '   2. Verify Supabase client configuration';
    RAISE NOTICE '   3. Check if correct table name is being queried';
    RAISE NOTICE '   4. Ensure user is properly authenticated';
    RAISE NOTICE '';
END $$;
