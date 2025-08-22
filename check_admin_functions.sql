-- Check if Admin Functions Already Exist
-- This will help us determine if we need to run admin-management-functions.sql again

-- 1. Check if admin_roles table exists
SELECT 
    'admin_roles table' AS component,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'admin_roles'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END AS status;

-- 2. Check if admin utility functions exist
SELECT 
    'Admin Utility Functions' AS component,
    string_agg(
        proname || ': ' || 
        CASE WHEN proname IS NOT NULL THEN '✅' ELSE '❌' END, 
        ', '
    ) AS status
FROM (
    SELECT proname 
    FROM pg_proc 
    WHERE pronamespace = 'public'::regnamespace
        AND proname IN ('is_admin', 'is_super_admin', 'get_admin_role')
) functions;

-- 3. Check if main admin management functions exist
SELECT 
    'Main Admin Functions' AS component,
    COUNT(*) || ' of 7 functions exist' AS status,
    string_agg(proname, ', ') AS existing_functions
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
    AND proname IN (
        'admin_get_all_organizations',
        'admin_get_organization_details', 
        'admin_extend_trial',
        'admin_upgrade_subscription',
        'admin_toggle_organization_status',
        'admin_get_platform_analytics',
        'admin_get_expiring_trials'
    );

-- 4. Check if create_initial_super_admin function exists
SELECT 
    'Initial Setup Function' AS component,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE pronamespace = 'public'::regnamespace
            AND proname = 'create_initial_super_admin'
        ) THEN '✅ create_initial_super_admin EXISTS'
        ELSE '❌ create_initial_super_admin MISSING'
    END AS status;

-- 5. Check if any admin users exist
SELECT 
    'Super Admin Users' AS component,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_roles') 
        THEN '⚠️ admin_roles table does not exist'
        WHEN EXISTS (SELECT 1 FROM admin_roles WHERE role = 'super_admin' AND is_active = true)
        THEN '✅ ' || (SELECT COUNT(*) FROM admin_roles WHERE role = 'super_admin' AND is_active = true) || ' super admin(s) exist'
        ELSE '⚠️ No super admins found'
    END AS status;

-- 6. Final recommendation
SELECT 
    '🎯 RECOMMENDATION' AS component,
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'admin_roles'
        ) THEN '❌ RUN admin-management-functions.sql - admin_roles table missing'
        WHEN (
            SELECT COUNT(*) FROM pg_proc 
            WHERE pronamespace = 'public'::regnamespace
            AND proname IN (
                'admin_get_all_organizations',
                'admin_get_organization_details', 
                'admin_extend_trial',
                'admin_upgrade_subscription',
                'admin_toggle_organization_status',
                'admin_get_platform_analytics',
                'admin_get_expiring_trials'
            )
        ) < 7 
        THEN '❌ RUN admin-management-functions.sql - Some admin functions missing'
        ELSE '✅ All admin functions exist - NO need to run admin-management-functions.sql again'
    END AS recommendation;
