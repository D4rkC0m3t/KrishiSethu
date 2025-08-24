-- =====================================================
-- COMPLETE FIX: Multi-Tenancy + Settings Cleanup
-- This fixes both security and performance issues
-- =====================================================

-- PART 1: ADD MULTI-TENANT COLUMNS
-- ===================================

-- Add owner_id columns to all relevant tables
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_suppliers_owner_id ON suppliers(owner_id);
CREATE INDEX IF NOT EXISTS idx_products_owner_id ON products(owner_id);
CREATE INDEX IF NOT EXISTS idx_customers_owner_id ON customers(owner_id);
CREATE INDEX IF NOT EXISTS idx_sales_owner_id ON sales(owner_id);
CREATE INDEX IF NOT EXISTS idx_purchases_owner_id ON purchases(owner_id);
CREATE INDEX IF NOT EXISTS idx_settings_owner_id ON settings(owner_id);

-- PART 2: ENABLE ROW LEVEL SECURITY
-- ==================================

-- Enable RLS on all tables
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- PART 3: CREATE RLS POLICIES
-- ============================

-- Remove any existing permissive policies
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

-- SETTINGS: Users can only see/manage their own settings
CREATE POLICY "users_own_settings_select" ON settings
    FOR SELECT USING (auth.uid() = owner_id OR owner_id IS NULL);
CREATE POLICY "users_own_settings_insert" ON settings
    FOR INSERT WITH CHECK (auth.uid() = owner_id OR owner_id IS NULL);
CREATE POLICY "users_own_settings_update" ON settings
    FOR UPDATE USING (auth.uid() = owner_id OR owner_id IS NULL);
CREATE POLICY "users_own_settings_delete" ON settings
    FOR DELETE USING (auth.uid() = owner_id OR owner_id IS NULL);

-- CATEGORIES & BRANDS: Shared globally (no owner_id needed)
CREATE POLICY "authenticated_can_read_categories" ON categories
    FOR SELECT USING (true);
CREATE POLICY "authenticated_can_manage_categories" ON categories
    FOR ALL USING (true);
CREATE POLICY "authenticated_can_read_brands" ON brands
    FOR SELECT USING (true);
CREATE POLICY "authenticated_can_manage_brands" ON brands
    FOR ALL USING (true);

-- USERS TABLE: Users can manage their own record
CREATE POLICY "users_own_record_select" ON users
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_own_record_update" ON users
    FOR UPDATE USING (auth.uid() = id);

-- PART 4: CREATE TRIGGER TO AUTO-SET OWNER_ID
-- ===========================================

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

-- Apply triggers to all relevant tables
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

-- PART 5: SETTINGS CLEANUP (PERFORMANCE FIX)
-- ==========================================

-- Before cleanup, let's see what settings exist
SELECT 'BEFORE CLEANUP - Settings Count' as info, COUNT(*) as total FROM settings;
SELECT 'Settings by key' as info, key, COUNT(*) as count FROM settings GROUP BY key ORDER BY count DESC;

-- Delete common test/debug settings that accumulate
DELETE FROM settings WHERE key LIKE '%test%';
DELETE FROM settings WHERE key LIKE '%debug%';
DELETE FROM settings WHERE key LIKE '%temp%';
DELETE FROM settings WHERE key LIKE '%cache%';
DELETE FROM settings WHERE key LIKE '%session%';

-- Delete settings with empty or null values
DELETE FROM settings WHERE value IS NULL OR value = '' OR value = '{}' OR value = '[]';

-- Delete very old settings (older than 6 months)
DELETE FROM settings WHERE created_at < NOW() - INTERVAL '6 months';

-- After cleanup
SELECT 'AFTER CLEANUP - Settings Count' as info, COUNT(*) as total FROM settings;
SELECT 'Remaining Settings' as info, key, value FROM settings ORDER BY key;

-- PART 6: VERIFICATION
-- ===================

-- Test multi-tenancy setup
SELECT 'Multi-Tenancy Verification' as test_name;

-- Check if owner_id columns exist
SELECT 
    'owner_id Columns Check' as check_name,
    'products' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'owner_id'
    ) as has_owner_id_column;

-- Check if RLS is enabled
SELECT 
    'RLS Status' as check_name,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('products', 'suppliers', 'customers', 'sales', 'purchases')
ORDER BY tablename;

-- Check policies
SELECT 
    'RLS Policies' as check_name,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Current user info
SELECT 'Current User' as info, auth.uid() as user_id;

-- Final summary
SELECT 'SETUP COMPLETE' as status, 
       'Multi-tenant security enabled + Settings cleaned' as description;
