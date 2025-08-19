-- ============================================================================
-- 🔧 FIX DATABASE SCHEMA ERROR - COMPLETE SOLUTION
-- ============================================================================
-- This script fixes the "Database error querying schema" issue
-- Run this entire script in your Supabase SQL Editor
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. CREATE PROFILES TABLE (Main fix for login error)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    company_name TEXT,
    
    -- Trial Management
    trial_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    trial_end TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    trial_extended_count INTEGER DEFAULT 0,
    
    -- Account Status
    is_active BOOLEAN DEFAULT TRUE,
    is_paid BOOLEAN DEFAULT FALSE,
    account_type TEXT DEFAULT 'trial' CHECK (account_type IN ('trial', 'paid', 'admin')),
    
    -- Notifications
    notification_sent BOOLEAN DEFAULT FALSE,
    last_notification_date TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    
    -- Admin notes
    admin_notes TEXT,
    disabled_reason TEXT
);

-- ============================================================================
-- 2. CREATE SUBSCRIPTION SYSTEM TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration_days INTEGER NOT NULL,
    features JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.subscription_plans(id),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    is_read BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.admin_actions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES public.profiles(id),
    target_user_id UUID REFERENCES public.profiles(id),
    action_type TEXT NOT NULL,
    action_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. CREATE CORE INVENTORY TABLES (if missing)
-- ============================================================================

-- Create enums if they don't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'manager', 'staff', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE product_type AS ENUM ('Chemical', 'Organic', 'Bio', 'NPK', 'Seeds', 'Pesticide', 'Tools');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role user_role DEFAULT 'staff',
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brands table
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    website TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address JSONB,
    gst_number TEXT,
    pan_number TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address JSONB,
    gst_number TEXT,
    credit_limit DECIMAL(10,2) DEFAULT 0,
    current_balance DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. CREATE TRIGGERS FOR AUTOMATIC PROFILE CREATION
-- ============================================================================

-- Function to create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, trial_start, trial_end)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        NEW.email,
        NOW(),
        NOW() + INTERVAL '30 days'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 5. INSERT DEFAULT DATA
-- ============================================================================

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, price, duration_days, features) 
VALUES 
    ('Trial', '30-day free trial', 0.00, 30, '{"max_products": 100, "max_users": 2, "support": "email"}'),
    ('Basic', 'Basic monthly plan', 999.00, 30, '{"max_products": 1000, "max_users": 5, "support": "email"}'),
    ('Pro', 'Professional monthly plan', 1999.00, 30, '{"max_products": 10000, "max_users": 20, "support": "phone"}')
ON CONFLICT DO NOTHING;

-- Insert default categories
INSERT INTO public.categories (name, description, sort_order) 
VALUES 
    ('Fertilizers', 'Chemical and organic fertilizers', 1),
    ('Seeds', 'Various crop seeds', 2),
    ('Pesticides', 'Pest control products', 3),
    ('Tools', 'Farming tools and equipment', 4)
ON CONFLICT (name) DO NOTHING;

-- Insert default brands
INSERT INTO public.brands (name, description) 
VALUES 
    ('IFFCO', 'Indian Farmers Fertiliser Cooperative Limited', true),
    ('Coromandel', 'Coromandel International Limited', true),
    ('UPL', 'United Phosphorus Limited', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 6. SET UP ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policy: Allow profile creation during signup
CREATE POLICY "Allow profile creation" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================================
-- 7. GRANT NECESSARY PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- 8. VERIFICATION QUERIES
-- ============================================================================

-- Check if profiles table exists and is accessible
SELECT 'profiles table created successfully' as status, count(*) as record_count 
FROM public.profiles;

-- Check if subscription plans were inserted
SELECT 'subscription plans created' as status, count(*) as plan_count 
FROM public.subscription_plans;

-- Check if categories were inserted
SELECT 'categories created' as status, count(*) as category_count 
FROM public.categories;

-- Show all created tables
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'subscription_plans', 'user_subscriptions', 'notification_logs', 'admin_actions', 'users', 'categories', 'brands', 'suppliers', 'customers')
ORDER BY table_name;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT '🎉 DATABASE SCHEMA FIX COMPLETE! 🎉' as message,
       'You can now try logging in again. The "Database error querying schema" should be resolved.' as next_step;
