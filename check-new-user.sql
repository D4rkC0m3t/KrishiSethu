-- Check if the new test user was created in the users table
-- Look for users created in the last few minutes

SELECT 
    id,
    email,
    full_name,
    account_type,
    is_active,
    created_at,
    'users_table' as source
FROM users 
WHERE created_at > NOW() - INTERVAL '10 minutes'
   OR email LIKE 'testuser%@gmail.com'
ORDER BY created_at DESC;

-- Also check what's in auth.users to see if the auth user exists
SELECT 
    id,
    email,
    created_at,
    raw_user_meta_data,
    'auth_users' as source
FROM auth.users 
WHERE email LIKE 'testuser%@gmail.com'
   OR created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC;

-- Check trigger function logs
-- This will show if there were any errors in the trigger
-- (Unfortunately, we can't see trigger warnings in this query, 
--  but we can see if the users exist in auth vs users table)

DO $$ 
DECLARE
    auth_count INTEGER;
    users_count INTEGER;
BEGIN 
    SELECT COUNT(*) INTO auth_count FROM auth.users WHERE email LIKE 'testuser%@gmail.com';
    SELECT COUNT(*) INTO users_count FROM users WHERE email LIKE 'testuser%@gmail.com';
    
    RAISE NOTICE 'Auth users with testuser emails: %', auth_count;
    RAISE NOTICE 'Users table with testuser emails: %', users_count;
    
    IF auth_count > users_count THEN
        RAISE NOTICE '⚠️ Mismatch! Some auth users were not created in users table - trigger may have failed';
    ELSE
        RAISE NOTICE '✅ All auth users have corresponding profiles in users table';
    END IF;
END $$;
