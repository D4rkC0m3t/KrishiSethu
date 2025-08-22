-- Fix Admin Setup - Diagnostic and Manual Creation
-- This script will check what got created and fix any missing pieces

-- 1. Check if admin_roles table now exists
SELECT 
    'admin_roles table check' AS check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'admin_roles'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END AS status;

-- 2. Check which admin functions were created
SELECT 
    'Admin functions created' AS check_name,
    COUNT(*) AS function_count,
    string_agg(proname, ', ' ORDER BY proname) AS functions_list
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
    AND proname LIKE '%admin%';

-- 3. If admin_roles table exists, let's manually create the super admin function
-- (This handles the case where the script partially ran)

CREATE OR REPLACE FUNCTION create_initial_super_admin(admin_email TEXT)
RETURNS TEXT AS $$
DECLARE
    admin_user_id UUID;
    result_message TEXT;
BEGIN
    -- Find user by email in auth.users
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = admin_email;
    
    IF NOT FOUND THEN
        RETURN 'Error: User with email ' || admin_email || ' not found. Please register this email first.';
    END IF;
    
    -- Check if admin_roles table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admin_roles'
    ) THEN
        RETURN 'Error: admin_roles table does not exist. Please run admin-management-functions.sql first.';
    END IF;
    
    -- Check if already an admin
    IF EXISTS (SELECT 1 FROM admin_roles WHERE user_id = admin_user_id) THEN
        RETURN 'User is already an admin.';
    END IF;
    
    -- Create super admin role
    INSERT INTO admin_roles (user_id, role, permissions, created_at)
    VALUES (
        admin_user_id,
        'super_admin',
        '["manage_organizations", "manage_subscriptions", "manage_admins", "view_analytics", "manage_platform"]'::JSONB,
        NOW()
    );
    
    result_message := 'Successfully created super admin for: ' || admin_email;
    RETURN result_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Also create the essential admin utility functions if missing
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_roles 
        WHERE user_id = auth.uid() 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_roles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin' 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Try to create super admin now
SELECT create_initial_super_admin('arjunin2020@gmail.com') AS result;

-- 6. Verify the super admin was created
SELECT 
    'Super admin verification' AS check_name,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_roles') 
        THEN '❌ admin_roles table still missing'
        WHEN EXISTS (SELECT 1 FROM admin_roles ar JOIN auth.users u ON ar.user_id = u.id WHERE u.email = 'arjunin2020@gmail.com' AND ar.role = 'super_admin')
        THEN '✅ Super admin created successfully!'
        ELSE '⚠️ Super admin not found - check if email exists in auth.users'
    END AS status;

-- 7. Show current admin users
SELECT 
    u.email,
    ar.role,
    ar.permissions,
    ar.created_at,
    ar.is_active
FROM admin_roles ar
JOIN auth.users u ON ar.user_id = u.id
WHERE ar.is_active = true
ORDER BY ar.created_at;
