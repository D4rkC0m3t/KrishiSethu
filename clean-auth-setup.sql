-- =====================================================
-- KRISHISETHU CLEAN AUTHENTICATION SETUP
-- =====================================================
-- This script creates a clean, simple user management system
-- Author: AI Assistant
-- Date: 2025-01-22

-- Drop existing problematic tables and start fresh
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Create a single, clean users table
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    company VARCHAR(100),
    
    -- Account status
    is_active BOOLEAN DEFAULT true,
    is_paid BOOLEAN DEFAULT false,
    account_type VARCHAR(20) DEFAULT 'trial', -- 'trial', 'paid', 'admin'
    
    -- Trial management
    trial_start_date TIMESTAMPTZ DEFAULT NOW(),
    trial_end_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- Add indexes for performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_account_type ON public.users(account_type);
CREATE INDEX idx_users_trial_end ON public.users(trial_end_date);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- 1. Users can read their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- 2. Users can update their own data
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- 3. Allow inserts for authenticated users (during registration)
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Admin access policy
CREATE POLICY "Admins can access all users" ON public.users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND account_type = 'admin'
        )
    );

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, phone, company)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'company'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile automatically
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS handle_updated_at ON public.users;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create an admin user function (for initial setup)
CREATE OR REPLACE FUNCTION public.create_admin_user(
    user_email VARCHAR,
    user_name VARCHAR
)
RETURNS VOID AS $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Find the user by email in auth.users
    SELECT id INTO user_uuid FROM auth.users WHERE email = user_email;
    
    IF user_uuid IS NOT NULL THEN
        -- Update user to admin
        INSERT INTO public.users (id, email, full_name, account_type, is_paid, is_active)
        VALUES (user_uuid, user_email, user_name, 'admin', true, true)
        ON CONFLICT (id) 
        DO UPDATE SET 
            account_type = 'admin',
            is_paid = true,
            is_active = true,
            updated_at = NOW();
            
        RAISE NOTICE 'Admin user created/updated for: %', user_email;
    ELSE
        RAISE EXCEPTION 'User with email % not found in auth.users', user_email;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Test data insertion function (for development)
CREATE OR REPLACE FUNCTION public.create_test_users()
RETURNS VOID AS $$
BEGIN
    -- This bypasses RLS for testing
    SET LOCAL row_security = OFF;
    
    -- Insert test users
    INSERT INTO public.users (
        id, email, full_name, phone, company, 
        account_type, is_active, is_paid,
        trial_start_date, trial_end_date
    ) VALUES 
    (
        gen_random_uuid(),
        'active-trial@test.com',
        'Active Trial User',
        '+91-9876543210',
        'Test Company 1',
        'trial',
        true,
        false,
        NOW(),
        NOW() + INTERVAL '20 days'
    ),
    (
        gen_random_uuid(),
        'expired-trial@test.com',
        'Expired Trial User',
        '+91-9876543211',
        'Test Company 2',
        'trial',
        true,
        false,
        NOW() - INTERVAL '35 days',
        NOW() - INTERVAL '5 days'
    ),
    (
        gen_random_uuid(),
        'paid-user@test.com',
        'Paid User',
        '+91-9876543212',
        'Premium Company',
        'paid',
        true,
        true,
        NOW() - INTERVAL '60 days',
        NOW() - INTERVAL '30 days'
    );
    
    RAISE NOTICE 'Test users created successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Summary report
DO $$
BEGIN
    RAISE NOTICE '=== KRISHISETHU CLEAN AUTH SETUP COMPLETE ===';
    RAISE NOTICE 'Created table: public.users';
    RAISE NOTICE 'Enabled RLS with appropriate policies';
    RAISE NOTICE 'Created triggers for auto-profile creation';
    RAISE NOTICE 'Ready for clean authentication flow';
    RAISE NOTICE '===============================================';
END $$;
