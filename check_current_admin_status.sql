-- Check Current Admin Status

-- 1. Check if admin_roles table exists and what's in it
SELECT 'admin_roles table contents' AS check_type, * FROM admin_roles;

-- 2. Check auth users that might be admins
SELECT 'auth.users with admin emails' AS check_type, id, email, created_at 
FROM auth.users 
WHERE email IN ('arjunin2020@gmail.com', 'arjunpeter@krishisethu.com', 'admin@krishisethu.com');

-- 3. Check if the create_initial_super_admin function works
SELECT create_initial_super_admin('arjunin2020@gmail.com') AS result;
