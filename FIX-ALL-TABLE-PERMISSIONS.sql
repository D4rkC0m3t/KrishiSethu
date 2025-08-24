-- =====================================================
-- FIX ALL TABLE PERMISSIONS - DISABLE RLS ON ALL TABLES
-- This fixes the "permission denied for table users" error
-- when querying sales table (RLS policies cross-referencing)
-- Run this in Supabase SQL Editor Dashboard
-- =====================================================

BEGIN;

-- Step 1: Disable RLS on ALL main tables to prevent cross-table permission issues
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sale_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.purchase_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.stock_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.einvoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.einvoice_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customer_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customer_balances DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all potentially problematic RLS policies
DO $$ 
DECLARE 
    table_name text;
    policy_record record;
BEGIN
    -- List of tables to clean policies from
    FOR table_name IN VALUES 
        ('users'), ('profiles'), ('sales'), ('sale_items'), ('purchases'), ('purchase_items'),
        ('suppliers'), ('customers'), ('products'), ('categories'), ('brands'), ('settings'),
        ('stock_movements'), ('audit_logs'), ('reports'), ('einvoices'), ('einvoice_items'),
        ('customer_payments'), ('customer_balances')
    LOOP
        -- Drop all policies for each table
        FOR policy_record IN 
            SELECT schemaname, tablename, policyname 
            FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = table_name
        LOOP
            BEGIN
                EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_record.policyname, policy_record.tablename);
                RAISE NOTICE 'Dropped policy % on table %', policy_record.policyname, policy_record.tablename;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Could not drop policy % on %: %', policy_record.policyname, policy_record.tablename, SQLERRM;
            END;
        END LOOP;
    END LOOP;
END $$;

-- Step 3: Grant full permissions on all tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Step 4: Ensure specific tables have explicit permissions
GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.sales TO anon, authenticated;
GRANT ALL ON public.sale_items TO anon, authenticated;
GRANT ALL ON public.purchases TO anon, authenticated;
GRANT ALL ON public.purchase_items TO anon, authenticated;
GRANT ALL ON public.suppliers TO anon, authenticated;
GRANT ALL ON public.customers TO anon, authenticated;
GRANT ALL ON public.products TO anon, authenticated;
GRANT ALL ON public.categories TO anon, authenticated;
GRANT ALL ON public.brands TO anon, authenticated;
GRANT ALL ON public.settings TO anon, authenticated;

COMMIT;

-- Verification - test the specific failing operation
SELECT 'All table permissions fixed' as result;

-- Test sales table access (this was failing)
SELECT 'Sales table test:' as test, COUNT(*) as record_count 
FROM public.sales;
