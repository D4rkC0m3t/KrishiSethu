-- Verify Admin Setup and Troubleshoot Super Admin Creation

-- 1. Check if the email exists in auth.users
SELECT 
    'Auth User Check' AS check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'arjunin2020@gmail.com')
        THEN '✅ Email exists in auth.users'
        ELSE '❌ Email NOT found in auth.users - Need to register first'
    END AS status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'arjunin2020@gmail.com')
        THEN (SELECT id::text FROM auth.users WHERE email = 'arjunin2020@gmail.com')
        ELSE 'No user ID found'
    END AS user_id;

-- 2. Check if admin_roles table has any records
SELECT 
    'Admin Roles Table' AS check_type,
    COUNT(*) AS total_records,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Has admin records'
        ELSE '⚠️ No admin records yet'
    END AS status
FROM admin_roles;

-- 3. Check for any existing admin users
SELECT 
    'Existing Admins' AS check_type,
    u.email,
    ar.role,
    ar.is_active,
    ar.created_at
FROM admin_roles ar
JOIN auth.users u ON ar.user_id = u.id
ORDER BY ar.created_at DESC;

-- 4. Try to create super admin again with better error handling
DO $$
DECLARE
    result_msg TEXT;
BEGIN
    -- Try to create super admin and capture result
    SELECT create_initial_super_admin('arjunin2020@gmail.com') INTO result_msg;
    RAISE NOTICE 'Super admin creation result: %', result_msg;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error creating super admin: %', SQLERRM;
END $$;

-- 5. Manual super admin creation if needed
-- This will work if the user exists but the function had issues
INSERT INTO admin_roles (user_id, role, permissions, created_at, is_active)
SELECT 
    u.id,
    'super_admin',
    '["manage_organizations", "manage_subscriptions", "manage_admins", "view_analytics", "manage_platform"]'::JSONB,
    NOW(),
    true
FROM auth.users u
WHERE u.email = 'arjunin2020@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM admin_roles ar WHERE ar.user_id = u.id
)
ON CONFLICT (user_id) DO NOTHING;

-- 6. Final verification
SELECT 
    'Final Super Admin Check' AS check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM admin_roles ar 
            JOIN auth.users u ON ar.user_id = u.id 
            WHERE u.email = 'arjunin2020@gmail.com' 
            AND ar.role = 'super_admin' 
            AND ar.is_active = true
        ) THEN '✅ Super admin successfully created!'
        WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'arjunin2020@gmail.com')
        THEN '⚠️ User exists but super admin role not assigned'
        ELSE '❌ User does not exist in auth system'
    END AS status;

-- 7. Show all current admin users
SELECT 
    'Current Admin Users' AS section,
    u.email,
    u.id as user_id,
    ar.role,
    ar.permissions,
    ar.is_active,
    ar.created_at
FROM admin_roles ar
JOIN auth.users u ON ar.user_id = u.id
ORDER BY ar.created_at DESC;

-- 8. Test admin functions
SELECT 
    'Admin Functions Test' AS test_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin')
        THEN '✅ is_admin function exists'
        ELSE '❌ is_admin function missing'
    END AS is_admin_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'admin_get_platform_analytics')
        THEN '✅ analytics function exists'
        ELSE '❌ analytics function missing'
    END AS analytics_status;
