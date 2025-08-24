-- =====================================================
-- Check Multi-Tenant Status
-- This script checks if proper multi-tenancy is set up
-- =====================================================

-- Check 1: Do owner_id columns exist?
SELECT 
    'products' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'owner_id'
    ) as has_owner_id_column;

SELECT 
    'suppliers' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'suppliers' AND column_name = 'owner_id'
    ) as has_owner_id_column;

-- Check 2: Is RLS enabled on tables?
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('products', 'suppliers', 'customers', 'sales', 'purchases')
ORDER BY tablename;

-- Check 3: What RLS policies exist?
SELECT 
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check 4: Sample data - do records have owner_id?
SELECT 'products' as table_name, 
       COUNT(*) as total_records,
       COUNT(owner_id) as records_with_owner_id,
       COUNT(DISTINCT owner_id) as unique_owners
FROM products;

SELECT 'suppliers' as table_name, 
       COUNT(*) as total_records,
       COUNT(owner_id) as records_with_owner_id,
       COUNT(DISTINCT owner_id) as unique_owners
FROM suppliers;

-- Check 5: Current authenticated user
SELECT auth.uid() as current_user_id;

-- Check 6: How many users exist in auth.users?
SELECT COUNT(*) as total_users FROM auth.users;
