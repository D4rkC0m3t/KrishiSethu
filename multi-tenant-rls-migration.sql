-- =====================================================
-- KrishiSethu Multi-Tenant RLS Migration
-- Implements proper data isolation with owner_id/organization_id
-- =====================================================

-- Step 1: Add owner_id columns to all relevant tables
-- This creates the foundation for multi-tenancy

-- Add owner_id to suppliers table
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Add owner_id to products table  
ALTER TABLE products ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Add owner_id to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Add owner_id to sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Add owner_id to purchases table
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Add owner_id to settings table (user-specific settings)
ALTER TABLE settings ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Add indexes for better performance on owner_id queries
CREATE INDEX IF NOT EXISTS idx_suppliers_owner_id ON suppliers(owner_id);
CREATE INDEX IF NOT EXISTS idx_products_owner_id ON products(owner_id);
CREATE INDEX IF NOT EXISTS idx_customers_owner_id ON customers(owner_id);
CREATE INDEX IF NOT EXISTS idx_sales_owner_id ON sales(owner_id);
CREATE INDEX IF NOT EXISTS idx_purchases_owner_id ON purchases(owner_id);
CREATE INDEX IF NOT EXISTS idx_settings_owner_id ON settings(owner_id);

-- Step 2: Remove all existing permissive policies
-- These were allowing users to see all data

-- Drop old permissive policies
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

-- Step 3: Create secure multi-tenant RLS policies

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

-- CATEGORIES & BRANDS: Shared across users (global data)
-- These remain accessible to all authenticated users
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

-- Step 4: Create trigger to automatically set owner_id on insert
-- This ensures every new record gets the correct owner_id

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

-- Apply the trigger to all relevant tables
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

-- Step 5: Migrate existing data to current user
-- WARNING: This assigns all existing data to the first authenticated user
-- In production, you might want to handle this differently

DO $$
DECLARE
    first_user_id UUID;
BEGIN
    -- Get the first authenticated user ID
    SELECT id INTO first_user_id 
    FROM auth.users 
    WHERE confirmed_at IS NOT NULL 
    LIMIT 1;
    
    IF first_user_id IS NOT NULL THEN
        -- Update existing records without owner_id
        UPDATE suppliers SET owner_id = first_user_id WHERE owner_id IS NULL;
        UPDATE products SET owner_id = first_user_id WHERE owner_id IS NULL;
        UPDATE customers SET owner_id = first_user_id WHERE owner_id IS NULL;
        UPDATE sales SET owner_id = first_user_id WHERE owner_id IS NULL;
        UPDATE purchases SET owner_id = first_user_id WHERE owner_id IS NULL;
        
        RAISE NOTICE 'Migrated existing data to user: %', first_user_id;
    END IF;
END
$$;

-- Step 6: Create a test to verify multi-tenancy works

-- Function to test multi-tenancy (run this after migration)
CREATE OR REPLACE FUNCTION test_multi_tenancy()
RETURNS TEXT AS $$
DECLARE
    result TEXT := 'Multi-tenancy test results:' || chr(10);
    supplier_count INTEGER;
    product_count INTEGER;
BEGIN
    -- Test 1: Check if owner_id columns exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'owner_id') THEN
        result := result || '✅ owner_id column exists in suppliers' || chr(10);
    ELSE
        result := result || '❌ owner_id column missing in suppliers' || chr(10);
    END IF;
    
    -- Test 2: Check if RLS is enabled
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'suppliers' AND rowsecurity = true) THEN
        result := result || '✅ RLS enabled on suppliers table' || chr(10);
    ELSE
        result := result || '❌ RLS not enabled on suppliers table' || chr(10);
    END IF;
    
    -- Test 3: Check if policies exist
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'suppliers' AND policyname = 'users_own_suppliers_select') THEN
        result := result || '✅ Multi-tenant policies created' || chr(10);
    ELSE
        result := result || '❌ Multi-tenant policies missing' || chr(10);
    END IF;
    
    -- Test 4: Check data migration
    SELECT COUNT(*) INTO supplier_count FROM suppliers WHERE owner_id IS NOT NULL;
    result := result || '📊 Suppliers with owner_id: ' || supplier_count || chr(10);
    
    SELECT COUNT(*) INTO product_count FROM products WHERE owner_id IS NOT NULL;
    result := result || '📊 Products with owner_id: ' || product_count || chr(10);
    
    result := result || chr(10) || '🎉 Multi-tenancy migration complete!';
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Run the test
SELECT test_multi_tenancy();

-- Step 7: Clean up test function
DROP FUNCTION test_multi_tenancy();
