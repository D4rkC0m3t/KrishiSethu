-- Complete Database Health Check for User Registration
-- Run this in your Supabase SQL Editor to verify everything is working

-- =================================================================
-- PART 1: Basic Table Structure Check
-- =================================================================

-- Check if users table exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'users'
        ) THEN '✅ Users table EXISTS'
        ELSE '❌ Users table MISSING - Run setup-users-table.sql'
    END as users_table_status;

-- Check users table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('id', 'email', 'name', 'role', 'account_type', 'is_active') 
        THEN '✅ Critical'
        ELSE '📝 Optional'
    END as importance
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY 
    CASE WHEN column_name = 'id' THEN 1
         WHEN column_name = 'email' THEN 2
         WHEN column_name = 'name' THEN 3
         WHEN column_name = 'role' THEN 4
         WHEN column_name = 'account_type' THEN 5
         ELSE 6
    END;

-- =================================================================
-- PART 2: RLS Policy Check
-- =================================================================

-- Check RLS is enabled
SELECT 
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS ENABLED'
        ELSE '❌ RLS DISABLED - Security risk!'
    END as rls_status
FROM pg_tables 
WHERE tablename = 'users' 
AND schemaname = 'public';

-- Check RLS policies
SELECT 
    policyname,
    cmd as command,
    permissive,
    roles,
    CASE 
        WHEN cmd = 'INSERT' AND policyname LIKE '%insert%' THEN '✅ Registration Policy'
        WHEN cmd = 'SELECT' AND policyname LIKE '%read%' THEN '✅ Read Policy'
        WHEN cmd = 'UPDATE' AND policyname LIKE '%update%' THEN '✅ Update Policy'
        ELSE '📝 Other Policy'
    END as policy_type
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY cmd, policyname;

-- =================================================================
-- PART 3: Trigger and Function Check
-- =================================================================

-- Check if handle_new_user function exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' 
            AND p.proname = 'handle_new_user'
        ) THEN '✅ handle_new_user function EXISTS'
        ELSE '❌ handle_new_user function MISSING'
    END as function_status;

-- Check if trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    CASE 
        WHEN trigger_name = 'on_auth_user_created' THEN '✅ Auto-registration trigger'
        ELSE '📝 Other trigger'
    END as trigger_type
FROM information_schema.triggers 
WHERE event_object_table = 'users'
   OR trigger_name LIKE '%auth%user%';

-- =================================================================
-- PART 4: Test Registration Capability
-- =================================================================

-- Show current user count
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE role = 'admin') as admin_users,
    COUNT(*) FILTER (WHERE role = 'trial') as trial_users,
    COUNT(*) FILTER (WHERE role = 'paid') as paid_users,
    COUNT(*) FILTER (WHERE is_active = true) as active_users,
    COUNT(*) FILTER (WHERE trial_end_date > NOW()) as users_with_active_trial
FROM users;

-- Show recent registrations (if any)
SELECT 
    email,
    name,
    role,
    account_type,
    is_active,
    trial_start_date,
    trial_end_date,
    created_at,
    CASE 
        WHEN trial_end_date > NOW() THEN '✅ Active Trial'
        WHEN is_paid = true THEN '✅ Paid Account'
        WHEN role = 'admin' THEN '✅ Admin Account'
        ELSE '❌ Expired/Inactive'
    END as account_status
FROM users 
ORDER BY created_at DESC 
LIMIT 5;

-- =================================================================
-- PART 5: Permission Check
-- =================================================================

-- Check table permissions for authenticated users
SELECT 
    table_name,
    privilege_type,
    grantee,
    CASE 
        WHEN privilege_type IN ('INSERT', 'SELECT', 'UPDATE') AND grantee = 'authenticated'
        THEN '✅ Required Permission'
        ELSE '📝 Other Permission'
    END as permission_status
FROM information_schema.role_table_grants 
WHERE table_name = 'users'
ORDER BY privilege_type;

-- =================================================================
-- PART 6: Quick Registration Test
-- =================================================================

-- This section shows what a registration would look like
-- (Commented out to avoid creating test data)

/*
-- Test registration simulation (DO NOT RUN in production)
INSERT INTO users (
    id, 
    email, 
    name, 
    role, 
    account_type, 
    is_active, 
    is_paid, 
    trial_start_date, 
    trial_end_date,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),  -- In real registration, this comes from auth.users
    'test-registration@example.com',
    'Test Registration User',
    'trial',
    'trial',
    true,
    false,
    NOW(),
    NOW() + INTERVAL '30 days',
    NOW(),
    NOW()
) 
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW();
*/

-- =================================================================
-- PART 7: Summary Report
-- =================================================================

SELECT 
    'REGISTRATION SETUP SUMMARY' as section,
    '' as detail
UNION ALL
SELECT 
    '================================',
    ''
UNION ALL
SELECT 
    'Tables:', 
    CASE WHEN EXISTS (SELECT FROM pg_tables WHERE tablename = 'users') 
         THEN '✅ users table exists' 
         ELSE '❌ users table missing' 
    END
UNION ALL
SELECT 
    'Security:', 
    CASE WHEN EXISTS (SELECT FROM pg_tables WHERE tablename = 'users' AND rowsecurity = true)
         THEN '✅ RLS enabled' 
         ELSE '❌ RLS disabled' 
    END
UNION ALL
SELECT 
    'Policies:', 
    CASE WHEN EXISTS (SELECT FROM pg_policies WHERE tablename = 'users' AND cmd = 'INSERT')
         THEN '✅ Insert policy exists' 
         ELSE '❌ Insert policy missing' 
    END
UNION ALL
SELECT 
    'Functions:', 
    CASE WHEN EXISTS (SELECT FROM pg_proc WHERE proname = 'handle_new_user')
         THEN '✅ Registration function exists' 
         ELSE '❌ Registration function missing' 
    END
UNION ALL
SELECT 
    'Permissions:', 
    CASE WHEN EXISTS (
        SELECT FROM information_schema.role_table_grants 
        WHERE table_name = 'users' 
        AND privilege_type = 'INSERT' 
        AND grantee = 'authenticated'
    ) THEN '✅ Insert permission granted' 
      ELSE '❌ Insert permission missing' 
    END;

-- =================================================================
-- NEXT STEPS (if issues found):
-- =================================================================

/*
If this health check reveals issues:

1. Missing users table → Run: setup-users-table.sql
2. RLS disabled → Run: ALTER TABLE users ENABLE ROW LEVEL SECURITY;
3. Missing policies → Run the policies section from setup-users-table.sql
4. Missing permissions → Run: GRANT ALL ON TABLE users TO authenticated;
5. Missing function → Run the function creation section from setup-users-table.sql

After fixing issues, run this health check again to verify.
*/
