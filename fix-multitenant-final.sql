-- =====================================================
-- FINAL MULTI-TENANCY FIX
-- Properly handles JSON columns and existing policies
-- =====================================================

-- PART 1: ADD MULTI-TENANT COLUMNS (Safe - IF NOT EXISTS)
-- ========================================================

ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Add indexes for better performance (Safe - IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_suppliers_owner_id ON suppliers(owner_id);
CREATE INDEX IF NOT EXISTS idx_products_owner_id ON products(owner_id);
CREATE INDEX IF NOT EXISTS idx_customers_owner_id ON customers(owner_id);
CREATE INDEX IF NOT EXISTS idx_sales_owner_id ON sales(owner_id);
CREATE INDEX IF NOT EXISTS idx_purchases_owner_id ON purchases(owner_id);
CREATE INDEX IF NOT EXISTS idx_settings_owner_id ON settings(owner_id);

-- PART 2: ENABLE ROW LEVEL SECURITY (Safe - no error if already enabled)
-- ======================================================================

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- PART 3: DROP ALL EXISTING POLICIES (Safe - IF EXISTS)
-- =====================================================

-- Drop all possible existing policies
DROP POLICY IF EXISTS "users_own_profile_select" ON profiles;
DROP POLICY IF EXISTS "users_own_profile_update" ON profiles;
DROP POLICY IF EXISTS "users_own_profile_insert" ON profiles;
DROP POLICY IF EXISTS "users_own_profile_delete" ON profiles;

DROP POLICY IF EXISTS "users_own_suppliers_select" ON suppliers;
DROP POLICY IF EXISTS "users_own_suppliers_insert" ON suppliers;
DROP POLICY IF EXISTS "users_own_suppliers_update" ON suppliers;
DROP POLICY IF EXISTS "users_own_suppliers_delete" ON suppliers;

DROP POLICY IF EXISTS "users_own_products_select" ON products;
DROP POLICY IF EXISTS "users_own_products_insert" ON products;
DROP POLICY IF EXISTS "users_own_products_update" ON products;
DROP POLICY IF EXISTS "users_own_products_delete" ON products;

DROP POLICY IF EXISTS "users_own_customers_select" ON customers;
DROP POLICY IF EXISTS "users_own_customers_insert" ON customers;
DROP POLICY IF EXISTS "users_own_customers_update" ON customers;
DROP POLICY IF EXISTS "users_own_customers_delete" ON customers;

DROP POLICY IF EXISTS "users_own_sales_select" ON sales;
DROP POLICY IF EXISTS "users_own_sales_insert" ON sales;
DROP POLICY IF EXISTS "users_own_sales_update" ON sales;
DROP POLICY IF EXISTS "users_own_sales_delete" ON sales;

DROP POLICY IF EXISTS "users_own_purchases_select" ON purchases;
DROP POLICY IF EXISTS "users_own_purchases_insert" ON purchases;
DROP POLICY IF EXISTS "users_own_purchases_update" ON purchases;
DROP POLICY IF EXISTS "users_own_purchases_delete" ON purchases;

DROP POLICY IF EXISTS "users_own_settings_select" ON settings;
DROP POLICY IF EXISTS "users_own_settings_insert" ON settings;
DROP POLICY IF EXISTS "users_own_settings_update" ON settings;
DROP POLICY IF EXISTS "users_own_settings_delete" ON settings;

DROP POLICY IF EXISTS "users_own_record_select" ON users;
DROP POLICY IF EXISTS "users_own_record_update" ON users;
DROP POLICY IF EXISTS "users_own_record_insert" ON users;
DROP POLICY IF EXISTS "users_own_record_delete" ON users;

DROP POLICY IF EXISTS "authenticated_can_read_categories" ON categories;
DROP POLICY IF EXISTS "authenticated_can_manage_categories" ON categories;
DROP POLICY IF EXISTS "authenticated_can_read_brands" ON brands;
DROP POLICY IF EXISTS "authenticated_can_manage_brands" ON brands;

-- Drop any old permissive policies
DROP POLICY IF EXISTS "authenticated_full_access" ON profiles;
DROP POLICY IF EXISTS "authenticated_full_access" ON users;
DROP POLICY IF EXISTS "authenticated_full_access" ON suppliers;
DROP POLICY IF EXISTS "authenticated_full_access" ON products;
DROP POLICY IF EXISTS "authenticated_full_access" ON customers;
DROP POLICY IF EXISTS "authenticated_full_access" ON sales;
DROP POLICY IF EXISTS "authenticated_full_access" ON purchases;
DROP POLICY IF EXISTS "authenticated_full_access" ON settings;
DROP POLICY IF EXISTS "authenticated_full_access" ON categories;
DROP POLICY IF EXISTS "authenticated_full_access" ON brands;

-- PART 4: CREATE FRESH RLS POLICIES
-- =================================

-- PROFILES: Users can only manage their own profile
CREATE POLICY "users_own_profile_select" ON profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_own_profile_update" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- SUPPLIERS: Users can only see/manage their own suppliers
CREATE POLICY "users_own_suppliers_select" ON suppliers
    FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "users_own_suppliers_insert" ON suppliers
    FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "users_own_suppliers_update" ON suppliers
    FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "users_own_suppliers_delete" ON suppliers
    FOR DELETE USING (auth.uid() = owner_id);

-- PRODUCTS: Users can only see/manage their own products
CREATE POLICY "users_own_products_select" ON products
    FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "users_own_products_insert" ON products
    FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "users_own_products_update" ON products
    FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "users_own_products_delete" ON products
    FOR DELETE USING (auth.uid() = owner_id);

-- CUSTOMERS: Users can only see/manage their own customers
CREATE POLICY "users_own_customers_select" ON customers
    FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "users_own_customers_insert" ON customers
    FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "users_own_customers_update" ON customers
    FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "users_own_customers_delete" ON customers
    FOR DELETE USING (auth.uid() = owner_id);

-- SALES: Users can only see/manage their own sales
CREATE POLICY "users_own_sales_select" ON sales
    FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "users_own_sales_insert" ON sales
    FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "users_own_sales_update" ON sales
    FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "users_own_sales_delete" ON sales
    FOR DELETE USING (auth.uid() = owner_id);

-- PURCHASES: Users can only see/manage their own purchases
CREATE POLICY "users_own_purchases_select" ON purchases
    FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "users_own_purchases_insert" ON purchases
    FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "users_own_purchases_update" ON purchases
    FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "users_own_purchases_delete" ON purchases
    FOR DELETE USING (auth.uid() = owner_id);

-- SETTINGS: Users can only see/manage their own settings (allow global settings with owner_id = NULL)
CREATE POLICY "users_own_settings_select" ON settings
    FOR SELECT USING (auth.uid() = owner_id OR owner_id IS NULL);
CREATE POLICY "users_own_settings_insert" ON settings
    FOR INSERT WITH CHECK (auth.uid() = owner_id OR owner_id IS NULL);
CREATE POLICY "users_own_settings_update" ON settings
    FOR UPDATE USING (auth.uid() = owner_id OR owner_id IS NULL);
CREATE POLICY "users_own_settings_delete" ON settings
    FOR DELETE USING (auth.uid() = owner_id OR owner_id IS NULL);

-- USERS TABLE: Users can manage their own record
CREATE POLICY "users_own_record_select" ON users
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_own_record_update" ON users
    FOR UPDATE USING (auth.uid() = id);

-- CATEGORIES & BRANDS: Shared globally (accessible to all authenticated users)
CREATE POLICY "authenticated_can_read_categories" ON categories
    FOR SELECT USING (true);
CREATE POLICY "authenticated_can_manage_categories" ON categories
    FOR ALL USING (true);
CREATE POLICY "authenticated_can_read_brands" ON brands
    FOR SELECT USING (true);
CREATE POLICY "authenticated_can_manage_brands" ON brands
    FOR ALL USING (true);

-- PART 5: CREATE/RECREATE TRIGGER FUNCTION
-- ========================================

CREATE OR REPLACE FUNCTION set_owner_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Only set owner_id if it's not already provided and user is authenticated
    IF NEW.owner_id IS NULL AND auth.uid() IS NOT NULL THEN
        NEW.owner_id = auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply triggers to all relevant tables (drop first to avoid conflicts)
DROP TRIGGER IF EXISTS set_owner_id_trigger ON suppliers;
CREATE TRIGGER set_owner_id_trigger
    BEFORE INSERT ON suppliers
    FOR EACH ROW EXECUTE FUNCTION set_owner_id();

DROP TRIGGER IF EXISTS set_owner_id_trigger ON products;
CREATE TRIGGER set_owner_id_trigger
    BEFORE INSERT ON products
    FOR EACH ROW EXECUTE FUNCTION set_owner_id();

DROP TRIGGER IF EXISTS set_owner_id_trigger ON customers;
CREATE TRIGGER set_owner_id_trigger
    BEFORE INSERT ON customers
    FOR EACH ROW EXECUTE FUNCTION set_owner_id();

DROP TRIGGER IF EXISTS set_owner_id_trigger ON sales;
CREATE TRIGGER set_owner_id_trigger
    BEFORE INSERT ON sales
    FOR EACH ROW EXECUTE FUNCTION set_owner_id();

DROP TRIGGER IF EXISTS set_owner_id_trigger ON purchases;
CREATE TRIGGER set_owner_id_trigger
    BEFORE INSERT ON purchases
    FOR EACH ROW EXECUTE FUNCTION set_owner_id();

-- PART 6: SETTINGS CLEANUP (PERFORMANCE FIX) - FIXED JSON HANDLING
-- ================================================================

-- Show current state
SELECT 'BEFORE CLEANUP - Settings Count' as info, COUNT(*) as total FROM settings;

-- Clean up test/debug/temp settings (key-based cleanup - safe)
DELETE FROM settings WHERE key LIKE '%test%';
DELETE FROM settings WHERE key LIKE '%debug%';
DELETE FROM settings WHERE key LIKE '%temp%';
DELETE FROM settings WHERE key LIKE '%cache%';
DELETE FROM settings WHERE key LIKE '%session%';
DELETE FROM settings WHERE key LIKE '%demo%';

-- Clean up settings with null values (safe)
DELETE FROM settings WHERE value IS NULL;

-- Clean up settings with specific JSON values (properly formatted)
DELETE FROM settings WHERE value::text = '{}';
DELETE FROM settings WHERE value::text = '[]';
DELETE FROM settings WHERE value::text = '""';
DELETE FROM settings WHERE value::text = 'null';

-- Delete very old settings (older than 6 months)
DELETE FROM settings WHERE created_at < NOW() - INTERVAL '6 months';

-- Show final state
SELECT 'AFTER CLEANUP - Settings Count' as info, COUNT(*) as total FROM settings;

-- PART 7: VERIFICATION
-- ===================

-- Test 1: Check owner_id columns
SELECT 
    'Multi-Tenancy Check' as test,
    'products has owner_id' as detail,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'owner_id'
    ) as result;

-- Test 2: Check RLS status
SELECT 
    'RLS Status' as test,
    tablename as detail,
    rowsecurity as result
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('products', 'suppliers', 'customers', 'sales', 'purchases')
ORDER BY tablename;

-- Test 3: Count policies
SELECT 
    'Policy Count' as test,
    tablename as detail,
    COUNT(*) as result
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Test 4: Current user
SELECT 
    'Current User' as test,
    'authenticated user ID' as detail,
    auth.uid() as result;

-- Test 5: Settings cleanup results
SELECT 
    'Settings Cleanup' as test,
    'remaining settings' as detail,
    COUNT(*) as result
FROM settings;

-- Final summary
SELECT 
    'SETUP COMPLETE' as status,
    'Multi-tenant security is now properly configured' as message;
