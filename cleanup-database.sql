-- COMPLETE DATABASE CLEANUP - Start Fresh
-- Run this FIRST to remove any existing schema conflicts

-- Drop all triggers first (to avoid dependency issues)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all triggers on all tables
    FOR r IN (
        SELECT n.nspname as schemaname, c.relname as tablename, t.tgname as triggername
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public'
        AND NOT t.tgisinternal
    ) LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.triggername) || 
                ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    
    RAISE NOTICE 'All triggers dropped';
END $$;

-- Drop all functions (except system functions)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname IN (
            'handle_updated_at',
            'get_user_organization', 
            'get_user_role',
            'is_org_owner_or_admin',
            'is_org_manager_or_above',
            'belongs_to_organization',
            'generate_entity_code',
            'generate_order_number',
            'handle_sales_stock_movement',
            'handle_new_user_registration',
            'handle_user_login',
            'switch_organization_context',
            'get_organization_limits',
            'can_add_user',
            'can_add_product'
        )
    ) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.nspname) || '.' || 
                quote_ident(r.proname) || '(' || r.args || ') CASCADE';
    END LOOP;
    
    RAISE NOTICE 'All custom functions dropped';
END $$;

-- Drop all RLS policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || 
                ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
    END LOOP;
    
    RAISE NOTICE 'All RLS policies dropped';
END $$;

-- Drop all tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS purchase_order_items CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS sales_order_items CASCADE;
DROP TABLE IF EXISTS sales_orders CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS organization_invitations CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Clean up any remaining sequences
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
        AND sequence_name LIKE '%_id_seq'
    ) LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.sequence_name) || ' CASCADE';
    END LOOP;
    
    RAISE NOTICE 'All sequences cleaned up';
END $$;

-- Verify cleanup
DO $$
DECLARE
    table_count INTEGER;
    function_count INTEGER;
    policy_count INTEGER;
BEGIN
    -- Check tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name IN (
        'organizations', 'profiles', 'organization_invitations',
        'categories', 'suppliers', 'customers', 'products',
        'stock_movements', 'sales_orders', 'sales_order_items',
        'purchase_orders', 'purchase_order_items'
    );
    
    -- Check functions
    SELECT COUNT(*) INTO function_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname LIKE '%organization%' OR p.proname LIKE '%user%' OR p.proname LIKE '%handle%';
    
    -- Check policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    RAISE NOTICE '';
    RAISE NOTICE '🧹 DATABASE CLEANUP COMPLETE!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Cleanup Results:';
    RAISE NOTICE '   Tables remaining: %', table_count;
    RAISE NOTICE '   Functions remaining: %', function_count;
    RAISE NOTICE '   Policies remaining: %', policy_count;
    RAISE NOTICE '';
    
    IF table_count = 0 AND function_count = 0 AND policy_count = 0 THEN
        RAISE NOTICE '✅ Database is completely clean!';
        RAISE NOTICE '🚀 Ready for fresh multi-tenant setup';
    ELSE
        RAISE NOTICE '⚠️  Some objects may still exist';
        RAISE NOTICE '💡 This is normal if you have other data';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '📋 Next Steps:';
    RAISE NOTICE '1. Run supabase-multitenant-schema.sql';
    RAISE NOTICE '2. Run supabase-multitenant-rls-clean.sql';
    RAISE NOTICE '3. Test your application';
    
END $$;
