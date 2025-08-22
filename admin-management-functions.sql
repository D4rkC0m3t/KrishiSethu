-- ===============================================
-- ADMIN MANAGEMENT FUNCTIONS
-- Multi-Tenant SaaS Platform Administration
-- ===============================================

-- This script creates all backend functions needed for admin management
-- of the multi-tenant inventory management SaaS platform

-- ===============================================
-- STEP 1: CREATE ADMIN ROLES TABLE
-- ===============================================

-- Create admin roles table for super admin management
CREATE TABLE IF NOT EXISTS public.admin_roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'admin', -- 'super_admin', 'admin', 'support'
    permissions JSONB DEFAULT '[]', -- Array of permission strings
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(user_id) -- One admin role per user
);

-- Enable RLS on admin_roles
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- Admin roles policies - only super admins can manage admin roles
CREATE POLICY "Super admins can manage admin roles" ON admin_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_roles ar 
            WHERE ar.user_id = auth.uid() 
            AND ar.role = 'super_admin' 
            AND ar.is_active = true
        )
    );

-- ===============================================
-- STEP 2: ADMIN UTILITY FUNCTIONS
-- ===============================================

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_roles 
        WHERE user_id = auth.uid() 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_roles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin' 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin role for current user
CREATE OR REPLACE FUNCTION get_admin_role()
RETURNS TEXT AS $$
DECLARE
    admin_role TEXT;
BEGIN
    SELECT role INTO admin_role
    FROM admin_roles 
    WHERE user_id = auth.uid() 
    AND is_active = true;
    
    RETURN admin_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- STEP 3: ORGANIZATION MANAGEMENT FUNCTIONS
-- ===============================================

-- Function to get all organizations with stats (admin only)
CREATE OR REPLACE FUNCTION admin_get_all_organizations(
    page_size INTEGER DEFAULT 50,
    page_offset INTEGER DEFAULT 0,
    search_term TEXT DEFAULT NULL,
    status_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    owner_email TEXT,
    owner_name TEXT,
    subscription_plan subscription_plan,
    subscription_status subscription_status,
    trial_end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN,
    total_users INTEGER,
    total_products INTEGER,
    total_sales INTEGER,
    last_activity TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Check admin privileges
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;
    
    RETURN QUERY
    SELECT 
        o.id,
        o.name,
        o.slug,
        p.email as owner_email,
        p.name as owner_name,
        o.subscription_plan,
        o.subscription_status,
        o.trial_end_date,
        o.created_at,
        o.is_active,
        (SELECT COUNT(*)::INTEGER FROM profiles pr WHERE pr.organization_id = o.id) as total_users,
        (SELECT COUNT(*)::INTEGER FROM products prod WHERE prod.organization_id = o.id) as total_products,
        (SELECT COUNT(*)::INTEGER FROM sales s WHERE s.organization_id = o.id) as total_sales,
        (SELECT MAX(s2.created_at) FROM sales s2 WHERE s2.organization_id = o.id) as last_activity
    FROM organizations o
    JOIN profiles p ON p.organization_id = o.id AND p.role = 'admin'
    WHERE 
        (search_term IS NULL OR 
         o.name ILIKE '%' || search_term || '%' OR 
         p.email ILIKE '%' || search_term || '%')
    AND (status_filter IS NULL OR o.subscription_status::TEXT = status_filter)
    ORDER BY o.created_at DESC
    LIMIT page_size
    OFFSET page_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get organization details (admin only)
CREATE OR REPLACE FUNCTION admin_get_organization_details(org_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    description TEXT,
    business_type TEXT,
    owner_email TEXT,
    owner_name TEXT,
    owner_phone TEXT,
    subscription_plan subscription_plan,
    subscription_status subscription_status,
    trial_start_date TIMESTAMP WITH TIME ZONE,
    trial_end_date TIMESTAMP WITH TIME ZONE,
    subscription_start_date TIMESTAMP WITH TIME ZONE,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN,
    settings JSONB,
    address JSONB,
    total_users INTEGER,
    total_products INTEGER,
    total_sales INTEGER,
    total_revenue DECIMAL(12,2),
    last_login TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Check admin privileges
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;
    
    RETURN QUERY
    SELECT 
        o.id,
        o.name,
        o.slug,
        o.description,
        o.business_type,
        p.email as owner_email,
        p.name as owner_name,
        p.phone as owner_phone,
        o.subscription_plan,
        o.subscription_status,
        o.trial_start_date,
        o.trial_end_date,
        o.subscription_start_date,
        o.subscription_end_date,
        o.created_at,
        o.updated_at,
        o.is_active,
        o.settings,
        o.address,
        (SELECT COUNT(*)::INTEGER FROM profiles pr WHERE pr.organization_id = o.id) as total_users,
        (SELECT COUNT(*)::INTEGER FROM products prod WHERE prod.organization_id = o.id) as total_products,
        (SELECT COUNT(*)::INTEGER FROM sales s WHERE s.organization_id = o.id) as total_sales,
        (SELECT COALESCE(SUM(s2.total_amount), 0) FROM sales s2 WHERE s2.organization_id = o.id) as total_revenue,
        p.last_login
    FROM organizations o
    JOIN profiles p ON p.organization_id = o.id AND p.role = 'admin'
    WHERE o.id = org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- STEP 4: SUBSCRIPTION MANAGEMENT FUNCTIONS
-- ===============================================

-- Function to extend trial period (admin only)
CREATE OR REPLACE FUNCTION admin_extend_trial(
    org_id UUID,
    days_to_extend INTEGER,
    reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_trial_end TIMESTAMP WITH TIME ZONE;
    new_trial_end TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Check admin privileges
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;
    
    -- Get current trial end date
    SELECT trial_end_date INTO current_trial_end
    FROM organizations
    WHERE id = org_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Organization not found';
    END IF;
    
    -- Calculate new trial end date
    new_trial_end := current_trial_end + (days_to_extend || ' days')::INTERVAL;
    
    -- Update the organization
    UPDATE organizations
    SET 
        trial_end_date = new_trial_end,
        updated_at = NOW()
    WHERE id = org_id;
    
    -- Log the action in audit_logs
    INSERT INTO audit_logs (
        organization_id,
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        user_id
    ) VALUES (
        org_id,
        'organizations',
        org_id,
        'ADMIN_TRIAL_EXTEND',
        jsonb_build_object('trial_end_date', current_trial_end),
        jsonb_build_object(
            'trial_end_date', new_trial_end,
            'days_extended', days_to_extend,
            'reason', reason,
            'admin_user_id', auth.uid()
        ),
        auth.uid()
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to upgrade organization subscription (admin only)
CREATE OR REPLACE FUNCTION admin_upgrade_subscription(
    org_id UUID,
    new_plan subscription_plan,
    new_status subscription_status DEFAULT 'active',
    subscription_months INTEGER DEFAULT 12
)
RETURNS BOOLEAN AS $$
DECLARE
    old_plan subscription_plan;
    old_status subscription_status;
    new_subscription_end TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Check admin privileges
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;
    
    -- Get current subscription details
    SELECT subscription_plan, subscription_status 
    INTO old_plan, old_status
    FROM organizations
    WHERE id = org_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Organization not found';
    END IF;
    
    -- Calculate new subscription end date
    new_subscription_end := NOW() + (subscription_months || ' months')::INTERVAL;
    
    -- Update the organization
    UPDATE organizations
    SET 
        subscription_plan = new_plan,
        subscription_status = new_status,
        subscription_start_date = NOW(),
        subscription_end_date = new_subscription_end,
        updated_at = NOW()
    WHERE id = org_id;
    
    -- Log the action
    INSERT INTO audit_logs (
        organization_id,
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        user_id
    ) VALUES (
        org_id,
        'organizations',
        org_id,
        'ADMIN_SUBSCRIPTION_UPGRADE',
        jsonb_build_object(
            'old_plan', old_plan,
            'old_status', old_status
        ),
        jsonb_build_object(
            'new_plan', new_plan,
            'new_status', new_status,
            'subscription_months', subscription_months,
            'admin_user_id', auth.uid()
        ),
        auth.uid()
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to suspend/activate organization (admin only)
CREATE OR REPLACE FUNCTION admin_toggle_organization_status(
    org_id UUID,
    new_status BOOLEAN,
    reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    old_status BOOLEAN;
BEGIN
    -- Check admin privileges
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;
    
    -- Get current status
    SELECT is_active INTO old_status
    FROM organizations
    WHERE id = org_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Organization not found';
    END IF;
    
    -- Update the organization
    UPDATE organizations
    SET 
        is_active = new_status,
        updated_at = NOW()
    WHERE id = org_id;
    
    -- Log the action
    INSERT INTO audit_logs (
        organization_id,
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        user_id
    ) VALUES (
        org_id,
        'organizations',
        org_id,
        CASE WHEN new_status THEN 'ADMIN_ORG_ACTIVATE' ELSE 'ADMIN_ORG_SUSPEND' END,
        jsonb_build_object('is_active', old_status),
        jsonb_build_object(
            'is_active', new_status,
            'reason', reason,
            'admin_user_id', auth.uid()
        ),
        auth.uid()
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- STEP 5: ANALYTICS FUNCTIONS
-- ===============================================

-- Function to get platform analytics (admin only)
CREATE OR REPLACE FUNCTION admin_get_platform_analytics()
RETURNS TABLE (
    total_organizations INTEGER,
    active_organizations INTEGER,
    trial_organizations INTEGER,
    paid_organizations INTEGER,
    suspended_organizations INTEGER,
    organizations_this_month INTEGER,
    total_users INTEGER,
    active_users INTEGER,
    total_products INTEGER,
    total_sales INTEGER,
    total_revenue DECIMAL(12,2),
    revenue_this_month DECIMAL(12,2),
    expiring_trials_count INTEGER
) AS $$
BEGIN
    -- Check admin privileges
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;
    
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM organizations) as total_organizations,
        (SELECT COUNT(*)::INTEGER FROM organizations WHERE is_active = true) as active_organizations,
        (SELECT COUNT(*)::INTEGER FROM organizations WHERE subscription_status = 'trial') as trial_organizations,
        (SELECT COUNT(*)::INTEGER FROM organizations WHERE subscription_status = 'active') as paid_organizations,
        (SELECT COUNT(*)::INTEGER FROM organizations WHERE is_active = false) as suspended_organizations,
        (SELECT COUNT(*)::INTEGER FROM organizations WHERE created_at >= DATE_TRUNC('month', NOW())) as organizations_this_month,
        (SELECT COUNT(*)::INTEGER FROM profiles) as total_users,
        (SELECT COUNT(*)::INTEGER FROM profiles WHERE last_login >= NOW() - INTERVAL '30 days') as active_users,
        (SELECT COUNT(*)::INTEGER FROM products) as total_products,
        (SELECT COUNT(*)::INTEGER FROM sales) as total_sales,
        (SELECT COALESCE(SUM(total_amount), 0) FROM sales) as total_revenue,
        (SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE created_at >= DATE_TRUNC('month', NOW())) as revenue_this_month,
        (SELECT COUNT(*)::INTEGER FROM organizations 
         WHERE subscription_status = 'trial' 
         AND trial_end_date <= NOW() + INTERVAL '7 days') as expiring_trials_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get organizations with expiring trials (admin only)
CREATE OR REPLACE FUNCTION admin_get_expiring_trials(days_ahead INTEGER DEFAULT 7)
RETURNS TABLE (
    id UUID,
    name TEXT,
    owner_email TEXT,
    owner_name TEXT,
    trial_end_date TIMESTAMP WITH TIME ZONE,
    days_remaining INTEGER
) AS $$
BEGIN
    -- Check admin privileges
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;
    
    RETURN QUERY
    SELECT 
        o.id,
        o.name,
        p.email as owner_email,
        p.name as owner_name,
        o.trial_end_date,
        EXTRACT(DAY FROM (o.trial_end_date - NOW()))::INTEGER as days_remaining
    FROM organizations o
    JOIN profiles p ON p.organization_id = o.id AND p.role = 'admin'
    WHERE 
        o.subscription_status = 'trial'
        AND o.trial_end_date <= NOW() + (days_ahead || ' days')::INTERVAL
        AND o.trial_end_date >= NOW()
        AND o.is_active = true
    ORDER BY o.trial_end_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- STEP 6: CREATE INDEXES FOR ADMIN FUNCTIONS
-- ===============================================

-- Admin roles indexes
CREATE INDEX IF NOT EXISTS idx_admin_roles_user ON admin_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_roles_active ON admin_roles(is_active);

-- Organization analytics indexes
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_status ON organizations(subscription_status);
CREATE INDEX IF NOT EXISTS idx_organizations_trial_end ON organizations(trial_end_date);
CREATE INDEX IF NOT EXISTS idx_organizations_created_month ON organizations(DATE_TRUNC('month', created_at));
CREATE INDEX IF NOT EXISTS idx_profiles_last_login ON profiles(last_login);
CREATE INDEX IF NOT EXISTS idx_sales_created_month ON sales(DATE_TRUNC('month', created_at));

-- ===============================================
-- STEP 7: CREATE INITIAL SUPER ADMIN
-- ===============================================

-- Function to create initial super admin (run once)
CREATE OR REPLACE FUNCTION create_initial_super_admin(admin_email TEXT)
RETURNS TEXT AS $$
DECLARE
    admin_user_id UUID;
    result_message TEXT;
BEGIN
    -- Find user by email in auth.users
    SELECT id INTO admin_user_id
    FROM auth.users
    WHERE email = admin_email;
    
    IF NOT FOUND THEN
        RETURN 'Error: User with email ' || admin_email || ' not found. Please register this email first.';
    END IF;
    
    -- Check if already an admin
    IF EXISTS (SELECT 1 FROM admin_roles WHERE user_id = admin_user_id) THEN
        RETURN 'User is already an admin.';
    END IF;
    
    -- Create super admin role
    INSERT INTO admin_roles (user_id, role, permissions, created_at)
    VALUES (
        admin_user_id,
        'super_admin',
        '["manage_organizations", "manage_subscriptions", "manage_admins", "view_analytics", "manage_platform"]'::JSONB,
        NOW()
    );
    
    result_message := 'Successfully created super admin for: ' || admin_email;
    RETURN result_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- SUCCESS MESSAGE
-- ===============================================

DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE '✅ ADMIN MANAGEMENT FUNCTIONS CREATED!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Created functions for:';
    RAISE NOTICE '🔐 Admin authentication and roles';
    RAISE NOTICE '🏢 Organization management';
    RAISE NOTICE '💳 Subscription and trial management';
    RAISE NOTICE '📊 Platform analytics and reporting';
    RAISE NOTICE '🛡️ Security and audit logging';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Create super admin: SELECT create_initial_super_admin(''your-email@example.com'');';
    RAISE NOTICE '2. Build admin dashboard UI';
    RAISE NOTICE '3. Test admin functions';
    RAISE NOTICE '==============================================';
END $$;
