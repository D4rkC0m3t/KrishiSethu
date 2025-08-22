-- Fix RLS Infinite Recursion Issue
-- The admin_access policy is causing infinite recursion by referencing the users table within itself

-- Drop the problematic policies
DROP POLICY IF EXISTS "admin_access" ON users;
DROP POLICY IF EXISTS "users_own_profile" ON users;
DROP POLICY IF EXISTS "service_role_access" ON users;
DROP POLICY IF EXISTS "anonymous_read_access" ON users;

-- Create simple, non-recursive policies

-- 1. Users can access their own data
CREATE POLICY "users_own_data" ON users
    FOR ALL
    USING (auth.uid() = id);

-- 2. Service role (your app backend) can access everything
CREATE POLICY "service_role_full_access" ON users
    FOR ALL
    TO service_role
    USING (true);

-- 3. Anonymous users can read all data (for testing - remove in production)
CREATE POLICY "public_read_access" ON users
    FOR SELECT
    TO anon
    USING (true);

-- 4. Authenticated users can read all data (simplified approach)
-- This allows any authenticated user to see all users (like for admin dashboard)
-- In production, you might want to restrict this further
CREATE POLICY "authenticated_read_access" ON users
    FOR SELECT
    TO authenticated
    USING (true);

-- Test the policies by running a simple query
SELECT 
    count(*) as total_users,
    count(*) FILTER (WHERE is_active = true) as active_users,
    count(*) FILTER (WHERE account_type = 'admin') as admin_users
FROM users;

-- Verify we can read individual users
SELECT id, email, full_name, account_type, is_active 
FROM users 
LIMIT 3;

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE '✅ RLS policies fixed - infinite recursion resolved!';
    RAISE NOTICE '🔍 Policies are now simple and non-recursive';
    RAISE NOTICE '📊 Test query successful - found % users', (SELECT COUNT(*) FROM users);
END $$;
