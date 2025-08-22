-- ============================================================================
-- FRESH DATABASE SETUP FOR KRISHISETHU TRIAL USER MANAGEMENT SYSTEM
-- Generated: 2025-01-22
-- Purpose: Complete database setup from scratch with all required tables
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. CLEAN UP (Reset if needed)
-- ============================================================================

-- Drop existing tables if they exist (careful - this deletes data!)
-- Uncomment only if you want to start completely fresh
-- DROP TABLE IF EXISTS public.notification_logs CASCADE;
-- DROP TABLE IF EXISTS public.user_subscriptions CASCADE;
-- DROP TABLE IF EXISTS public.subscription_plans CASCADE;
-- DROP TABLE IF EXISTS public.customers CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;
-- DROP TABLE IF EXISTS public.admin_actions CASCADE;

-- ============================================================================
-- 2. CREATE MAIN PROFILES TABLE (Primary user table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    -- Core Identity
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    full_name TEXT, -- Alias for name
    phone TEXT,
    company_name TEXT,
    
    -- Account Management
    role TEXT DEFAULT 'trial' CHECK (role IN ('admin', 'trial', 'paid', 'premium')),
    account_type TEXT DEFAULT 'trial' CHECK (account_type IN ('admin', 'trial', 'paid', 'premium')),
    is_active BOOLEAN DEFAULT TRUE,
    is_paid BOOLEAN DEFAULT FALSE,
    
    -- Trial Management
    trial_start_date TIMESTAMPTZ DEFAULT NOW(),
    trial_end_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    trial_extended_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_sign_in_at TIMESTAMPTZ,
    
    -- Admin fields
    admin_notes TEXT,
    disabled_reason TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON public.profiles(account_type);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_end ON public.profiles(trial_end_date);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- ============================================================================
-- 3. CREATE SUBSCRIPTION SYSTEM TABLES
-- ============================================================================

-- Subscription Plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    duration_days INTEGER NOT NULL DEFAULT 30,
    features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Subscriptions
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.subscription_plans(id),
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_is_active ON public.user_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_end_date ON public.user_subscriptions(end_date);

-- ============================================================================
-- 4. CREATE CUSTOMERS TABLE (For business management)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address JSONB,
    gst_number TEXT,
    credit_limit DECIMAL(10,2) DEFAULT 0,
    current_balance DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for customers
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON public.customers(is_active);

-- ============================================================================
-- 5. CREATE NOTIFICATION SYSTEM
-- ============================================================================

-- Notification Logs
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('trial_warning', 'trial_expired', 'account_disabled', 'payment_reminder')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    is_read BOOLEAN DEFAULT FALSE
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON public.notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON public.notification_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_is_read ON public.notification_logs(is_read);

-- ============================================================================
-- 6. CREATE ADMIN ACTION TRACKING
-- ============================================================================

-- Admin Actions Log
CREATE TABLE IF NOT EXISTS public.admin_actions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('activate', 'deactivate', 'extend_trial', 'make_premium', 'reset_trial', 'delete_account')),
    action_details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for admin actions
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON public.admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target_user_id ON public.admin_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON public.admin_actions(created_at DESC);

-- ============================================================================
-- 7. CREATE AUTOMATIC USER PROFILE CREATION TRIGGER
-- ============================================================================

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id, 
        email, 
        name, 
        full_name,
        role,
        account_type,
        is_active,
        is_paid,
        trial_start_date,
        trial_end_date
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))),
        COALESCE(NEW.raw_user_meta_data->>'name', COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))),
        'trial',
        'trial',
        TRUE,
        FALSE,
        NOW(),
        NOW() + INTERVAL '30 days'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 8. INSERT DEFAULT SUBSCRIPTION PLANS
-- ============================================================================

INSERT INTO public.subscription_plans (name, description, price, duration_days, features, is_active) 
VALUES 
    ('Free Trial', '30-day free trial with full access', 0, 30, '["Full Access", "30 Days", "Email Support"]', TRUE),
    ('Monthly Plan', 'Monthly subscription with full features', 999.00, 30, '["Full Access", "Priority Support", "Advanced Features"]', TRUE),
    ('Yearly Plan', 'Annual subscription with discount', 9999.00, 365, '["Full Access", "Priority Support", "Advanced Features", "Yearly Discount"]', TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 9. INSERT SAMPLE TRIAL USERS FOR TESTING
-- ============================================================================

-- Insert sample trial users (these will show up in your admin dashboard)
INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    full_name, 
    phone, 
    company_name, 
    role, 
    account_type, 
    is_active, 
    is_paid, 
    trial_start_date, 
    trial_end_date
) VALUES 
    (
        uuid_generate_v4(),
        'parsuram@udhaysuriyantraders.com',
        'Parsuram',
        'Parsuram Sharma',
        '+91-9876543210',
        'UDHAY SURIYAN TRADERS',
        'trial',
        'trial',
        TRUE,
        FALSE,
        NOW() - INTERVAL '5 days',
        NOW() + INTERVAL '25 days'
    ),
    (
        uuid_generate_v4(),
        'ramesh@greenfarm.com',
        'Ramesh Kumar',
        'Ramesh Kumar Patel',
        '+91-8765432109',
        'Green Farm Enterprises',
        'trial',
        'trial',
        TRUE,
        FALSE,
        NOW() - INTERVAL '10 days',
        NOW() + INTERVAL '20 days'
    ),
    (
        uuid_generate_v4(),
        'priya@agrotech.com',
        'Priya Singh',
        'Priya Singh',
        '+91-7654321098',
        'AgroTech Solutions',
        'trial',
        'trial',
        TRUE,
        FALSE,
        NOW() - INTERVAL '2 days',
        NOW() + INTERVAL '28 days'
    ),
    (
        uuid_generate_v4(),
        'vikram@farmfresh.com',
        'Vikram Gupta',
        'Vikram Gupta',
        '+91-6543210987',
        'Farm Fresh Produce',
        'paid',
        'paid',
        TRUE,
        TRUE,
        NOW() - INTERVAL '60 days',
        NOW() + INTERVAL '300 days'
    ),
    (
        uuid_generate_v4(),
        'expired@trial.com',
        'Expired User',
        'Expired Trial User',
        '+91-5432109876',
        'Test Company',
        'trial',
        'trial',
        FALSE,
        FALSE,
        NOW() - INTERVAL '35 days',
        NOW() - INTERVAL '5 days'
    )
ON CONFLICT (email) DO NOTHING;

-- Insert some sample customers
INSERT INTO public.customers (name, phone, email, is_active) VALUES 
    ('ABC Distributors', '+91-9999888877', 'abc@distributors.com', TRUE),
    ('XYZ Retailers', '+91-8888777766', 'xyz@retailers.com', TRUE),
    ('PQR Wholesale', '+91-7777666655', 'pqr@wholesale.com', TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 10. CREATE ADMIN USER (Change email to your admin email)
-- ============================================================================

-- Insert an admin user (change the email to your actual admin email)
INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    full_name, 
    role, 
    account_type, 
    is_active, 
    is_paid, 
    trial_start_date, 
    trial_end_date
) VALUES 
    (
        uuid_generate_v4(),
        'admin@krishisethu.com',  -- CHANGE THIS TO YOUR ADMIN EMAIL
        'System Admin',
        'System Administrator',
        'admin',
        'admin',
        TRUE,
        TRUE,
        NOW(),
        NOW() + INTERVAL '1 year'
    )
ON CONFLICT (email) DO UPDATE SET 
    role = 'admin',
    account_type = 'admin',
    is_paid = TRUE;

-- ============================================================================
-- 11. SETUP ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions" ON public.user_subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for customers (admin only)
CREATE POLICY "Admins can manage customers" ON public.customers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for notification_logs
CREATE POLICY "Users can view own notifications" ON public.notification_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all notifications" ON public.notification_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for admin_actions (admin only)
CREATE POLICY "Admins can view admin actions" ON public.admin_actions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- 12. CREATE UPDATED_AT TRIGGER FUNCTION
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================

-- Print success message
DO $$
BEGIN
    RAISE NOTICE '🎉 DATABASE SETUP COMPLETE!';
    RAISE NOTICE '✅ All tables created successfully';
    RAISE NOTICE '✅ Sample data inserted';
    RAISE NOTICE '✅ RLS policies configured';
    RAISE NOTICE '✅ Triggers and functions created';
    RAISE NOTICE '';
    RAISE NOTICE '📋 What you have now:';
    RAISE NOTICE '   - profiles table with sample trial users';
    RAISE NOTICE '   - customers table with sample data';
    RAISE NOTICE '   - subscription_plans with default plans';
    RAISE NOTICE '   - Complete admin system with RLS';
    RAISE NOTICE '   - Automatic user creation on signup';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Next steps:';
    RAISE NOTICE '   1. Update your admin email in the admin user record';
    RAISE NOTICE '   2. Test the AdminMasterDashboard component';
    RAISE NOTICE '   3. Verify trial users display correctly';
    RAISE NOTICE '';
    RAISE NOTICE '📧 Admin email to change: admin@krishisethu.com';
END $$;