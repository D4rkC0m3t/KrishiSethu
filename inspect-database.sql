-- DATABASE INSPECTION - See what currently exists
-- Run this to understand current database state

DO $$
DECLARE
    r RECORD;
    table_count INTEGER;
    function_count INTEGER;
    policy_count INTEGER;
    trigger_count INTEGER;
BEGIN
    RAISE NOTICE '🔍 INSPECTING CURRENT DATABASE STATE';
    RAISE NOTICE '=====================================';
    RAISE NOTICE '';
    
    -- Check existing tables
    RAISE NOTICE '📊 EXISTING TABLES:';
    SELECT COUNT(*) INTO table_count FROM information_schema.tables WHERE table_schema = 'public';
    RAISE NOTICE 'Total tables in public schema: %', table_count;
    
    FOR r IN (
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
    ) LOOP
        RAISE NOTICE '   - %', r.table_name;
    END LOOP;
    RAISE NOTICE '';
    
    -- Check existing functions
    RAISE NOTICE '⚡ EXISTING FUNCTIONS:';
    SELECT COUNT(*) INTO function_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public';
    RAISE NOTICE 'Total functions in public schema: %', function_count;
    
    FOR r IN (
        SELECT p.proname
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        ORDER BY p.proname
    ) LOOP
        RAISE NOTICE '   - %', r.proname;
    END LOOP;
    RAISE NOTICE '';
    
    -- Check existing triggers
    RAISE NOTICE '🎯 EXISTING TRIGGERS:';
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
    AND NOT t.tgisinternal;
    RAISE NOTICE 'Total triggers: %', trigger_count;
    
    FOR r IN (
        SELECT t.tgname as trigger_name, c.relname as table_name
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public'
        AND NOT t.tgisinternal
        ORDER BY c.relname, t.tgname
    ) LOOP
        RAISE NOTICE '   - % on %', r.trigger_name, r.table_name;
    END LOOP;
    RAISE NOTICE '';
    
    -- Check existing RLS policies
    RAISE NOTICE '🔒 EXISTING RLS POLICIES:';
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public';
    RAISE NOTICE 'Total RLS policies: %', policy_count;
    
    FOR r IN (
        SELECT tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'public'
        ORDER BY tablename, policyname
    ) LOOP
        RAISE NOTICE '   - % on %', r.policyname, r.tablename;
    END LOOP;
    RAISE NOTICE '';
    
    -- Check for multi-tenant specific objects
    RAISE NOTICE '🏢 MULTI-TENANT OBJECTS CHECK:';
    
    -- Check for organizations table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations' AND table_schema = 'public') THEN
        RAISE NOTICE '   ✅ organizations table exists';
    ELSE
        RAISE NOTICE '   ❌ organizations table missing';
    END IF;
    
    -- Check for profiles table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        RAISE NOTICE '   ✅ profiles table exists';
    ELSE
        RAISE NOTICE '   ❌ profiles table missing';
    END IF;
    
    -- Check for get_user_organization function
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'get_user_organization') THEN
        RAISE NOTICE '   ✅ get_user_organization function exists';
    ELSE
        RAISE NOTICE '   ❌ get_user_organization function missing';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎯 SUMMARY:';
    RAISE NOTICE '   Tables: %', table_count;
    RAISE NOTICE '   Functions: %', function_count;
    RAISE NOTICE '   Triggers: %', trigger_count;
    RAISE NOTICE '   RLS Policies: %', policy_count;
    RAISE NOTICE '';
    
    IF table_count > 0 OR function_count > 0 OR trigger_count > 0 THEN
        RAISE NOTICE '⚠️  DATABASE HAS EXISTING OBJECTS';
        RAISE NOTICE '💡 Run cleanup-database.sql first to start fresh';
    ELSE
        RAISE NOTICE '✅ DATABASE IS CLEAN';
        RAISE NOTICE '🚀 Ready for schema setup';
    END IF;
    
END $$;
