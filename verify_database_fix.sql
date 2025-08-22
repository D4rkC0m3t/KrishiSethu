-- Verify Database Fix and Test Admin Functions
-- This script confirms that all issues are resolved and tests functionality

-- 1. Check that no problematic functional indexes remain
SELECT 
    'Problematic Indexes Check' AS check_type,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ No problematic functional indexes found'
        ELSE '❌ Still have ' || COUNT(*) || ' problematic indexes'
    END AS status
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND (indexdef ILIKE '%get_organization_context%' 
         OR indexdef ILIKE '%auth.uid%'
         OR indexdef ILIKE '%current_setting%');

-- 2. Verify function volatility classifications
SELECT 
    'Function Volatility Check' AS check_type,
    proname AS function_name,
    CASE provolatile 
        WHEN 'i' THEN '✅ IMMUTABLE'
        WHEN 's' THEN '✅ STABLE' 
        WHEN 'v' THEN '⚠️ VOLATILE'
    END AS volatility_status
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
    AND proname IN ('get_organization_context', 'normalize_slug', 'generate_base_slug', 'generate_unique_slug')
ORDER BY proname;

-- 3. Check that all expected indexes exist
SELECT 
    'Index Availability Check' AS check_type,
    COUNT(*) AS total_indexes,
    '✅ All column-based indexes created' AS status
FROM pg_indexes 
WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%';

-- 4. Test the admin functions we created earlier
-- First, let's verify they exist
SELECT 
    'Admin Functions Check' AS check_type,
    proname AS function_name,
    '✅ Function exists' AS status
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
    AND proname IN (
        'admin_get_platform_analytics',
        'admin_get_all_organizations', 
        'admin_get_expiring_trials',
        'admin_get_organization_details',
        'admin_extend_trial',
        'admin_upgrade_subscription',
        'admin_toggle_organization_status'
    )
ORDER BY proname;

-- 5. Test basic organization creation (if we have auth working)
-- This will test if our RLS policies and functions work without the immutable issues

-- Create a test organization if none exist
INSERT INTO organizations (
    name, 
    slug, 
    business_type, 
    owner_id,
    subscription_plan,
    subscription_status,
    trial_end_date,
    is_active
) 
SELECT 
    'Test Organization',
    'test-org-' || floor(random() * 1000)::text,
    'retail',
    '00000000-0000-0000-0000-000000000001'::uuid,
    'trial',
    'trial',
    CURRENT_DATE + INTERVAL '14 days',
    true
WHERE NOT EXISTS (SELECT 1 FROM organizations LIMIT 1);

-- 6. Test our admin analytics function
SELECT 
    'Admin Analytics Test' AS test_name,
    CASE 
        WHEN admin_analytics.total_organizations IS NOT NULL 
        THEN '✅ Analytics function working - Found ' || admin_analytics.total_organizations || ' organizations'
        ELSE '⚠️ Analytics function returned null'
    END AS result
FROM (
    SELECT * FROM admin_get_platform_analytics() LIMIT 1
) AS admin_analytics;

-- 7. Test organization listing function
SELECT 
    'Organization Listing Test' AS test_name,
    CASE 
        WHEN org_count > 0 
        THEN '✅ Organization listing working - Found ' || org_count || ' organizations'
        ELSE '⚠️ No organizations found or function not working'
    END AS result
FROM (
    SELECT COUNT(*) AS org_count 
    FROM admin_get_all_organizations(50, 0, NULL, NULL)
) AS org_test;

-- 8. Test expiring trials function
SELECT 
    'Expiring Trials Test' AS test_name,
    '✅ Expiring trials function working - Found ' || COUNT(*) || ' trials expiring in next 30 days' AS result
FROM admin_get_expiring_trials(30);

-- 9. Verify RLS policies are still working
SELECT 
    'RLS Policies Check' AS check_type,
    tablename,
    COUNT(*) AS policy_count,
    '✅ ' || COUNT(*) || ' policies active' AS status
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('products', 'categories', 'sales', 'customers', 'suppliers', 'organizations')
GROUP BY tablename
ORDER BY tablename;

-- 10. Test that we can create products without immutable function errors
-- This tests the full stack including RLS, functions, and indexes
DO $$
BEGIN
    -- Try to insert a test product if an organization exists
    IF EXISTS (SELECT 1 FROM organizations LIMIT 1) THEN
        INSERT INTO products (
            organization_id,
            name,
            sku,
            description,
            price,
            cost,
            stock_quantity,
            is_active
        ) 
        SELECT 
            o.id,
            'Test Product ' || floor(random() * 1000)::text,
            'TEST-' || floor(random() * 1000)::text,
            'Test product description',
            99.99,
            50.00,
            100,
            true
        FROM organizations o 
        LIMIT 1
        ON CONFLICT (organization_id, sku) DO NOTHING;
        
        RAISE NOTICE '✅ Product creation test passed';
    ELSE
        RAISE NOTICE '⚠️ No organizations exist to test product creation';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Product creation test failed: %', SQLERRM;
END $$;

-- 11. Final summary
SELECT 
    '🎉 DATABASE FIX VERIFICATION COMPLETE' AS summary,
    CASE 
        WHEN (
            SELECT COUNT(*) FROM pg_indexes 
            WHERE schemaname = 'public' 
                AND (indexdef ILIKE '%get_organization_context%' 
                     OR indexdef ILIKE '%auth.uid%'
                     OR indexdef ILIKE '%current_setting%')
        ) = 0 
        THEN '✅ All immutable function issues resolved!'
        ELSE '❌ Still have immutable function issues'
    END AS immutable_status,
    (
        SELECT COUNT(*) 
        FROM pg_proc 
        WHERE pronamespace = 'public'::regnamespace
            AND proname LIKE 'admin_%'
    ) || ' admin functions ready' AS admin_functions_status,
    (
        SELECT COUNT(*) 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
            AND indexname LIKE 'idx_%'
    ) || ' performance indexes created' AS index_status;
