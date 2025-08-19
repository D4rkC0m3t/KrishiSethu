-- ============================================================================
-- DATABASE MIGRATION SCRIPT - FIX KRITICAL ISSUES
-- Generated: 2025-01-18T16:49:48Z
-- Purpose: Fix all database and mapping issues preventing frontend operation
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. CREATE MISSING USER_PROFILES TABLE
-- ============================================================================

-- Create user_profiles table that AuthContext expects
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'trial' CHECK (role IN ('admin', 'trial', 'paid', 'manager', 'staff', 'viewer')),
    account_type TEXT DEFAULT 'trial' CHECK (account_type IN ('admin', 'trial', 'paid', 'manager', 'staff', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    is_paid BOOLEAN DEFAULT false,
    trial_start_date TIMESTAMPTZ DEFAULT NOW(),
    trial_end_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON public.user_profiles(is_active);

-- ============================================================================
-- 2. ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================================================

-- Add max_stock_level to products if it doesn't exist (frontend mapping expects this)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS max_stock_level DECIMAL(10,2) DEFAULT 0;

-- Add logo_url to brands table if missing (field mapping expects this)
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add pan_number to suppliers if missing
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS pan_number TEXT;

-- Add pan_number to customers if missing  
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS pan_number TEXT;

-- ============================================================================
-- 3. CREATE AUTOMATIC USER PROFILE CREATION TRIGGER
-- ============================================================================

-- Function to automatically create user profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name, role, account_type, is_active, is_paid)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'trial'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'trial'),
    true,
    false
  );
  RETURN NEW;
END;
$$;

-- Create trigger to call the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 4. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- ============================================================================

-- Enable RLS on all main tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. CREATE BASIC RLS POLICIES FOR AUTHENTICATED USERS
-- ============================================================================

-- Categories - Allow all authenticated users to read/write
DROP POLICY IF EXISTS "Allow authenticated access categories" ON public.categories;
CREATE POLICY "Allow authenticated access categories" ON public.categories
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Brands - Allow all authenticated users to read/write
DROP POLICY IF EXISTS "Allow authenticated access brands" ON public.brands;
CREATE POLICY "Allow authenticated access brands" ON public.brands
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Suppliers - Allow all authenticated users to read/write
DROP POLICY IF EXISTS "Allow authenticated access suppliers" ON public.suppliers;
CREATE POLICY "Allow authenticated access suppliers" ON public.suppliers
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Customers - Allow all authenticated users to read/write
DROP POLICY IF EXISTS "Allow authenticated access customers" ON public.customers;
CREATE POLICY "Allow authenticated access customers" ON public.customers
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Products - Allow all authenticated users to read/write
DROP POLICY IF EXISTS "Allow authenticated access products" ON public.products;
CREATE POLICY "Allow authenticated access products" ON public.products
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Sales - Allow all authenticated users to read/write
DROP POLICY IF EXISTS "Allow authenticated access sales" ON public.sales;
CREATE POLICY "Allow authenticated access sales" ON public.sales
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Sale Items - Allow all authenticated users to read/write
DROP POLICY IF EXISTS "Allow authenticated access sale_items" ON public.sale_items;
CREATE POLICY "Allow authenticated access sale_items" ON public.sale_items
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Purchases - Allow all authenticated users to read/write
DROP POLICY IF EXISTS "Allow authenticated access purchases" ON public.purchases;
CREATE POLICY "Allow authenticated access purchases" ON public.purchases
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Purchase Items - Allow all authenticated users to read/write
DROP POLICY IF EXISTS "Allow authenticated access purchase_items" ON public.purchase_items;
CREATE POLICY "Allow authenticated access purchase_items" ON public.purchase_items
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Stock Movements - Allow all authenticated users to read/write
DROP POLICY IF EXISTS "Allow authenticated access stock_movements" ON public.stock_movements;
CREATE POLICY "Allow authenticated access stock_movements" ON public.stock_movements
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Settings - Allow all authenticated users to read/write
DROP POLICY IF EXISTS "Allow authenticated access settings" ON public.settings;
CREATE POLICY "Allow authenticated access settings" ON public.settings
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Users table - Users can only see their own record
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- User Profiles - Users can see their own profile, admins can see all
DROP POLICY IF EXISTS "Users can view own user_profile" ON public.user_profiles;
CREATE POLICY "Users can view own user_profile" ON public.user_profiles
    FOR SELECT TO authenticated USING (
        auth.uid() = id OR 
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
    );

DROP POLICY IF EXISTS "Users can update own user_profile" ON public.user_profiles;
CREATE POLICY "Users can update own user_profile" ON public.user_profiles
    FOR UPDATE TO authenticated USING (
        auth.uid() = id OR 
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
    ) WITH CHECK (
        auth.uid() = id OR 
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
    );

DROP POLICY IF EXISTS "Admins can insert user_profiles" ON public.user_profiles;
CREATE POLICY "Admins can insert user_profiles" ON public.user_profiles
    FOR INSERT TO authenticated WITH CHECK (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'admin'
    );

-- ============================================================================
-- 6. CREATE DEFAULT ADMIN USER (Run separately after auth user is created)
-- ============================================================================

-- Note: This INSERT will fail if no auth user exists. 
-- The admin user must be created through Supabase Auth first, then this record can be inserted.
-- Use: supabase.auth.signUp({ email: 'admin@krishisethu.com', password: 'admin123' })

-- INSERT INTO public.user_profiles (id, email, name, role, account_type, is_active, is_paid)
-- VALUES (
--     'auth-user-id-here', -- Replace with actual auth.users id
--     'admin@krishisethu.com',
--     'Administrator',
--     'admin',
--     'admin', 
--     true,
--     true
-- );

-- ============================================================================
-- 7. UPDATE SCHEMA TIMESTAMPS (Automatic Updates)
-- ============================================================================

-- Function to update timestamps automatically
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add automatic timestamp updates to all tables with updated_at column
DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_brands_updated_at ON public.brands;
CREATE TRIGGER update_brands_updated_at
    BEFORE UPDATE ON public.brands
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_suppliers_updated_at ON public.suppliers;
CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON public.suppliers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 8. INSERT SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert basic categories if table is empty
INSERT INTO public.categories (name, description, sort_order, is_active)
SELECT * FROM (VALUES
    ('NPK Fertilizers', 'Nitrogen, Phosphorus, Potassium fertilizers', 1, true),
    ('Organic Fertilizers', 'Natural and organic fertilizers', 2, true),
    ('Bio Fertilizers', 'Biological fertilizers with microorganisms', 3, true),
    ('Seeds', 'Agricultural seeds and grains', 4, true),
    ('Pesticides', 'Pest control chemicals', 5, true),
    ('Tools & Equipment', 'Agricultural tools and equipment', 6, true)
) AS t(name, description, sort_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.categories);

-- Insert basic brands if table is empty
INSERT INTO public.brands (name, description, is_active)
SELECT * FROM (VALUES
    ('Tata Chemicals', 'Leading chemical manufacturer', true),
    ('IFFCO', 'Indian Farmers Fertiliser Cooperative', true),
    ('Coromandel', 'Agricultural solutions company', true),
    ('Godrej Agrovet', 'Diversified agribusiness company', true),
    ('Zuari Agro', 'Crop nutrition and protection', true)
) AS t(name, description, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.brands);

-- ============================================================================
-- 9. VALIDATE SCHEMA AND CREATE SUMMARY
-- ============================================================================

-- Verify all critical tables exist and are accessible
DO $$
DECLARE
    table_name text;
    table_count integer;
    missing_tables text[] := '{}';
    existing_tables text[] := '{}';
BEGIN
    RAISE NOTICE 'DATABASE MIGRATION VALIDATION SUMMARY';
    RAISE NOTICE '=====================================';
    
    -- Check critical tables
    FOR table_name IN (SELECT unnest(ARRAY['categories', 'brands', 'suppliers', 'customers', 'products', 'sales', 'purchases', 'users', 'user_profiles', 'stock_movements', 'settings'])) LOOP
        SELECT count(*) INTO table_count 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = table_name;
        
        IF table_count > 0 THEN
            existing_tables := array_append(existing_tables, table_name);
            RAISE NOTICE '✅ Table % exists', table_name;
        ELSE
            missing_tables := array_append(missing_tables, table_name);
            RAISE NOTICE '❌ Table % missing', table_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'SUMMARY:';
    RAISE NOTICE '- Existing tables: %', array_length(existing_tables, 1);
    RAISE NOTICE '- Missing tables: %', COALESCE(array_length(missing_tables, 1), 0);
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE NOTICE '⚠️  Missing tables: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE '✅ All critical tables exist';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Create admin user via Supabase Auth';
    RAISE NOTICE '2. Test frontend authentication';
    RAISE NOTICE '3. Verify CRUD operations work';
    RAISE NOTICE '4. Check field mapping functions correctly';
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary of changes made:
-- 1. ✅ Created user_profiles table with proper schema
-- 2. ✅ Added missing columns (max_stock_level, logo_url, pan_number)
-- 3. ✅ Created automatic user profile creation trigger  
-- 4. ✅ Enabled RLS on all tables
-- 5. ✅ Created basic RLS policies for authenticated access
-- 6. ✅ Added automatic timestamp update triggers
-- 7. ✅ Inserted sample categories and brands
-- 8. ✅ Validated schema integrity

-- Status: Database schema should now be compatible with frontend expectations
-- Next: Test frontend connectivity and field mapping
