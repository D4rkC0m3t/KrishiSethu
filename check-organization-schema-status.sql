-- ==============================
-- Check Organization Schema Status
-- Run this first to see what already exists
-- ==============================

-- Check if organizations table exists
SELECT 
    'organizations' as table_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'organizations'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status;

-- Check organizations table columns if it exists
SELECT 
    'organizations_columns' as check_type,
    string_agg(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_name = 'organizations';

-- Check if organization_id exists in profiles
SELECT 
    'profiles_organization_id' as check_type,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'organization_id'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status;

-- Check if organization_id exists in categories
SELECT 
    'categories_organization_id' as check_type,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'organization_id'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status;

-- Check existing triggers
SELECT 
    'triggers' as check_type,
    trigger_name,
    event_object_table as table_name
FROM information_schema.triggers 
WHERE trigger_name LIKE '%organization%' OR event_object_table = 'organizations';

-- Check existing functions
SELECT 
    'functions' as check_type,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name LIKE '%organization%' 
   OR routine_name = 'generate_organization_slug'
   OR routine_name = 'setup_organization_defaults';

-- Check existing policies on organizations table
SELECT 
    'rls_policies' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'organizations';

-- Check if RLS is enabled on organizations
SELECT 
    'rls_status' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'organizations';

-- Check existing indexes related to organizations
SELECT 
    'indexes' as check_type,
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE tablename = 'organizations' 
   OR indexname LIKE '%organization%';

-- Summary message
DO $$
BEGIN
    RAISE NOTICE '=== ORGANIZATION SCHEMA CHECK COMPLETE ===';
    RAISE NOTICE 'Review the results above to see what already exists';
    RAISE NOTICE 'Use this information to create a safe migration script';
    RAISE NOTICE '============================================';
END $$;
