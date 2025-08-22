-- Check User Registration Status and Fix Login Issues

-- 1. Check if the user exists in auth.users
SELECT 
    'Auth Users Check' AS check_type,
    id,
    email,
    email_confirmed_at,
    created_at,
    last_sign_in_at,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'arjunin2020@gmail.com';

-- 2. Check if user has a profile
SELECT 
    'User Profile Check' AS check_type,
    id,
    email,
    name,
    role,
    is_active,
    organization_id
FROM user_profiles 
WHERE email = 'arjunin2020@gmail.com';

-- 3. Check if user has admin role
SELECT 
    'Admin Role Check' AS check_type,
    ar.id,
    ar.user_id,
    ar.role,
    ar.permissions,
    ar.is_active,
    ar.created_at
FROM admin_roles ar
JOIN auth.users u ON ar.user_id = u.id
WHERE u.email = 'arjunin2020@gmail.com';

-- 4. If user exists but email not confirmed, let's confirm it manually
UPDATE auth.users 
SET 
    email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email = 'arjunin2020@gmail.com' 
    AND email_confirmed_at IS NULL;

-- 5. Try to create the super admin role again if it doesn't exist
INSERT INTO admin_roles (user_id, role, permissions, is_active, created_at)
SELECT 
    u.id,
    'super_admin',
    '{"manage_organizations": true, "manage_subscriptions": true, "manage_admins": true, "view_analytics": true, "manage_platform": true}'::jsonb,
    true,
    NOW()
FROM auth.users u
WHERE u.email = 'arjunin2020@gmail.com'
    AND NOT EXISTS (
        SELECT 1 FROM admin_roles ar WHERE ar.user_id = u.id
    );

-- 6. Final verification - show all related data
SELECT 
    'Final Status Check' AS check_type,
    u.email,
    u.email_confirmed_at IS NOT NULL AS email_confirmed,
    up.name,
    up.role AS profile_role,
    ar.role AS admin_role,
    ar.is_active AS admin_active
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
LEFT JOIN admin_roles ar ON u.id = ar.user_id
WHERE u.email = 'arjunin2020@gmail.com';
