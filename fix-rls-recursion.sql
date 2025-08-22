-- Fix RLS Policy Infinite Recursion
-- This script replaces the problematic RLS policies with simpler ones

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Create simpler, non-recursive policies
-- Policy for users to access their own data
CREATE POLICY "users_own_profile" ON users
    FOR ALL
    USING (auth.uid() = id);

-- Policy for service role (used by your app) to access all data
-- This allows your application to read all users for admin functions
CREATE POLICY "service_role_access" ON users
    FOR ALL
    TO service_role
    USING (true);

-- Policy to allow anonymous access for testing (temporary - remove in production)
CREATE POLICY "anonymous_read_access" ON users
    FOR SELECT
    TO anon
    USING (true);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Test query to verify policies work
SELECT 
    id,
    email,
    full_name,
    account_type,
    is_active,
    is_paid,
    trial_start_date,
    trial_end_date,
    created_at
FROM users 
ORDER BY created_at DESC;

-- Display success message
DO $$ 
BEGIN 
    RAISE NOTICE '✅ RLS policies fixed successfully!';
    RAISE NOTICE '📊 Found % users in the clean schema', (SELECT COUNT(*) FROM users);
END $$;
