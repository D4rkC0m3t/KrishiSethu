-- SIMPLE DATABASE CLEANUP - Guaranteed to Work
-- Run this FIRST to completely clean your database

-- Drop all triggers manually (most common ones)
DROP TRIGGER IF EXISTS trigger_organizations_updated_at ON organizations;
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS trigger_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS trigger_suppliers_updated_at ON suppliers;
DROP TRIGGER IF EXISTS trigger_customers_updated_at ON customers;
DROP TRIGGER IF EXISTS trigger_products_updated_at ON products;
DROP TRIGGER IF EXISTS trigger_sales_orders_updated_at ON sales_orders;
DROP TRIGGER IF EXISTS trigger_purchase_orders_updated_at ON purchase_orders;
DROP TRIGGER IF EXISTS trigger_sales_stock_movement ON sales_order_items;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;

-- Drop all functions
DROP FUNCTION IF EXISTS handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS get_user_organization() CASCADE;
DROP FUNCTION IF EXISTS get_user_role() CASCADE;
DROP FUNCTION IF EXISTS is_org_owner_or_admin() CASCADE;
DROP FUNCTION IF EXISTS is_org_manager_or_above() CASCADE;
DROP FUNCTION IF EXISTS belongs_to_organization(UUID) CASCADE;
DROP FUNCTION IF EXISTS generate_entity_code(UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS generate_order_number(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS handle_sales_stock_movement() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user_registration() CASCADE;
DROP FUNCTION IF EXISTS handle_user_login() CASCADE;
DROP FUNCTION IF EXISTS switch_organization_context(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_organization_limits() CASCADE;
DROP FUNCTION IF EXISTS can_add_user() CASCADE;
DROP FUNCTION IF EXISTS can_add_product() CASCADE;

-- Drop all tables (CASCADE removes dependencies)
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

-- Simple verification
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name IN (
        'organizations', 'profiles', 'organization_invitations',
        'categories', 'suppliers', 'customers', 'products',
        'stock_movements', 'sales_orders', 'sales_order_items',
        'purchase_orders', 'purchase_order_items'
    );
    
    RAISE NOTICE '';
    RAISE NOTICE '🧹 SIMPLE CLEANUP COMPLETE!';
    RAISE NOTICE '';
    RAISE NOTICE 'Multi-tenant tables remaining: %', table_count;
    
    IF table_count = 0 THEN
        RAISE NOTICE '✅ All multi-tenant objects removed!';
        RAISE NOTICE '🚀 Database is ready for fresh setup';
    ELSE
        RAISE NOTICE '⚠️  Some tables still exist - may need manual cleanup';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '📋 Next Steps:';
    RAISE NOTICE '1. Run: supabase-multitenant-schema.sql';
    RAISE NOTICE '2. Run: supabase-multitenant-rls-clean.sql';
    RAISE NOTICE '3. Test your React app';
    
END $$;
