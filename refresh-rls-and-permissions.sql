-- =====================================================
-- REFRESH RLS AND PERMISSIONS
-- Fixes authentication cache and permission issues
-- =====================================================

-- Step 1: Refresh all RLS policies (force reload)
-- This clears any cached permission states

-- Temporarily disable and re-enable RLS to force refresh
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

ALTER TABLE purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Step 2: Refresh function security
-- Recreate the owner_id trigger function to ensure proper security context

CREATE OR REPLACE FUNCTION set_owner_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Force refresh of auth context
    IF NEW.owner_id IS NULL AND auth.uid() IS NOT NULL THEN
        NEW.owner_id = auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Clear any cached query plans
-- This forces PostgreSQL to regenerate execution plans with new RLS policies
DISCARD PLANS;

-- Step 4: Refresh authentication context
-- Check current user context
SELECT 
    'Auth Refresh Check' as test,
    auth.uid() as current_user_id,
    NOW() as refresh_time;

SELECT 'RLS Policies Refreshed Successfully' as status;
