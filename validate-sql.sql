-- Quick validation script to test both SQL files
-- Run this AFTER running both multi-tenant SQL scripts

-- Check if all tables were created
DO $$
DECLARE
    table_count INTEGER;
    expected_tables TEXT[] := ARRAY[
        'organizations', 'profiles', 'organization_invitations',
        'categories', 'suppliers', 'customers', 'products',
        'stock_movements', 'sales_orders', 'sales_order_items',
        'purchase_orders', 'purchase_order_items'
    ];
    missing_tables TEXT[] := ARRAY[]::TEXT[];
    table_name TEXT;
BEGIN
    RAISE NOTICE '🔍 Validating multi-tenant setup...';
    RAISE NOTICE '';
    
    -- Check each expected table
    FOREACH table_name IN ARRAY expected_tables
    LOOP
        SELECT COUNT(*) INTO table_count
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = table_name;
        
        IF table_count = 0 THEN
            missing_tables := array_append(missing_tables, table_name);
        END IF;
    END LOOP;
    
    -- Report results
    IF array_length(missing_tables, 1) IS NULL THEN
        RAISE NOTICE '✅ All tables created successfully!';
        RAISE NOTICE '📊 Found % tables', array_length(expected_tables, 1);
    ELSE
        RAISE NOTICE '❌ Missing tables: %', array_to_string(missing_tables, ', ');
    END IF;
    
    RAISE NOTICE '';
    
    -- Check if functions were created
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_organization') THEN
        RAISE NOTICE '✅ Multi-tenant functions created';
    ELSE
        RAISE NOTICE '❌ Multi-tenant functions missing';
    END IF;
    
    -- Check if policies were created (count RLS policies)
    SELECT COUNT(*) INTO table_count
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    IF table_count > 0 THEN
        RAISE NOTICE '✅ RLS policies active (% policies)', table_count;
    ELSE
        RAISE NOTICE '❌ No RLS policies found';
    END IF;
    
    RAISE NOTICE '';
    
    -- Check demo organization
    SELECT COUNT(*) INTO table_count FROM organizations WHERE slug = 'demo-company';
    IF table_count > 0 THEN
        RAISE NOTICE '✅ Demo organization created';
    ELSE
        RAISE NOTICE 'ℹ️ No demo organization (this is fine)';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Multi-tenant validation complete!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Next steps:';
    RAISE NOTICE '1. Test user registration in your React app';
    RAISE NOTICE '2. Create some test data';
    RAISE NOTICE '3. Verify data isolation between organizations';
    
END
$$;
