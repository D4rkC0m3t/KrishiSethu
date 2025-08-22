-- Clean Admin Setup - Avoiding Immutable Function Issues
-- This creates admin functionality without problematic functional indexes

-- ===============================================
-- STEP 1: DROP ANY PROBLEMATIC INDEXES FIRST
-- ===============================================

-- Drop any problematic indexes from the admin script
DO $$
DECLARE
    idx_record record;
BEGIN
    FOR idx_record IN 
        SELECT indexname
        FROM pg_indexes 
        WHERE schemaname = 'public' 
            AND (indexdef ILIKE '%date_trunc%'
                 OR indexdef ILIKE '%extract%'
                 OR indexdef ILIKE '%(%')
    LOOP
        BEGIN
            EXECUTE format('DROP INDEX IF EXISTS %I', idx_record.indexname);
            RAISE NOTICE 'Dropped potentially problematic index: %', idx_record.indexname;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop index %. Error: %', idx_record.indexname, SQLERRM;
        END;
    END LOOP;
END $$;

-- ===============================================
-- STEP 2: CREATE ADMIN ROLES TABLE
-- ===============================================

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
DROP POLICY IF EXISTS "Super admins can manage admin roles" ON admin_roles;
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
-- STEP 3: ADMIN UTILITY FUNCTIONS
-- ===============================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_roles 
        WHERE user_id = auth.uid() 
        AND is_active = true
    );
END;
$$;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_roles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin' 
        AND is_active = true
    );
END;
$$;

CREATE OR REPLACE FUNCTION get_admin_role()
RETURNS TEXT 
LANGUAGE plpgsql 
SECURITY DEFINER
STABLE
AS $$
DECLARE
    admin_role TEXT;
BEGIN
    SELECT role INTO admin_role
    FROM admin_roles 
    WHERE user_id = auth.uid() 
    AND is_active = true;
    
    RETURN admin_role;
END;
$$;

-- ===============================================
-- STEP 4: CORE ADMIN FUNCTIONS (WITHOUT PROBLEMATIC REFERENCES)
-- ===============================================

-- Get all organizations function
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
) 
LANGUAGE plpgsql 
SECURITY DEFINER
STABLE
AS $$
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
        owner_profile.email as owner_email,
        owner_profile.name as owner_name,
        o.subscription_plan,
        o.subscription_status,
        o.trial_end_date,
        o.created_at,
        o.is_active,
        COALESCE(user_stats.total_users, 0)::INTEGER as total_users,
        COALESCE(product_stats.total_products, 0)::INTEGER as total_products,
        COALESCE(sales_stats.total_sales, 0)::INTEGER as total_sales,
        sales_stats.last_activity
    FROM organizations o
    LEFT JOIN (
        SELECT 
            up.organization_id,
            u.email,
            up.name
        FROM user_profiles up
        JOIN auth.users u ON up.id = u.id
        WHERE up.role = 'admin'
    ) owner_profile ON owner_profile.organization_id = o.id
    LEFT JOIN (
        SELECT 
            organization_id, 
            COUNT(*) as total_users
        FROM user_profiles 
        GROUP BY organization_id
    ) user_stats ON user_stats.organization_id = o.id
    LEFT JOIN (
        SELECT 
            organization_id, 
            COUNT(*) as total_products
        FROM products 
        GROUP BY organization_id
    ) product_stats ON product_stats.organization_id = o.id
    LEFT JOIN (
        SELECT 
            organization_id, 
            COUNT(*) as total_sales,
            MAX(created_at) as last_activity
        FROM sales 
        GROUP BY organization_id
    ) sales_stats ON sales_stats.organization_id = o.id
    WHERE 
        (search_term IS NULL OR 
         o.name ILIKE '%' || search_term || '%' OR 
         owner_profile.email ILIKE '%' || search_term || '%')
    AND (status_filter IS NULL OR o.subscription_status::TEXT = status_filter)
    ORDER BY o.created_at DESC
    LIMIT page_size
    OFFSET page_offset;
END;
$$;

-- Get platform analytics function
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
) 
LANGUAGE plpgsql 
SECURITY DEFINER
STABLE
AS $$
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
        (SELECT COUNT(*)::INTEGER FROM organizations WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as organizations_this_month,
        (SELECT COUNT(*)::INTEGER FROM user_profiles) as total_users,
        (SELECT COUNT(*)::INTEGER FROM user_profiles WHERE last_login >= NOW() - INTERVAL '30 days') as active_users,
        (SELECT COUNT(*)::INTEGER FROM products) as total_products,
        (SELECT COUNT(*)::INTEGER FROM sales) as total_sales,
        (SELECT COALESCE(SUM(total_amount), 0) FROM sales) as total_revenue,
        (SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as revenue_this_month,
        (SELECT COUNT(*)::INTEGER FROM organizations 
         WHERE subscription_status = 'trial' 
         AND trial_end_date <= NOW() + INTERVAL '7 days') as expiring_trials_count;
END;
$$;

-- Get expiring trials function
CREATE OR REPLACE FUNCTION admin_get_expiring_trials(days_ahead INTEGER DEFAULT 7)
RETURNS TABLE (
    id UUID,
    name TEXT,
    owner_email TEXT,
    owner_name TEXT,
    trial_end_date TIMESTAMP WITH TIME ZONE,
    days_remaining INTEGER
) 
LANGUAGE plpgsql 
SECURITY DEFINER
STABLE
AS $$
BEGIN
    -- Check admin privileges
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;
    
    RETURN QUERY
    SELECT 
        o.id,
        o.name,
        owner_profile.email as owner_email,
        owner_profile.name as owner_name,
        o.trial_end_date,
        CASE 
            WHEN o.trial_end_date > NOW() THEN 
                EXTRACT(DAY FROM (o.trial_end_date - NOW()))::INTEGER
            ELSE 0
        END as days_remaining
    FROM organizations o
    LEFT JOIN (
        SELECT 
            up.organization_id,
            u.email,
            up.name
        FROM user_profiles up
        JOIN auth.users u ON up.id = u.id
        WHERE up.role = 'admin'
    ) owner_profile ON owner_profile.organization_id = o.id
    WHERE 
        o.subscription_status = 'trial'
        AND o.trial_end_date <= NOW() + (days_ahead || ' days')::INTERVAL
        AND o.trial_end_date >= NOW()
        AND o.is_active = true
    ORDER BY o.trial_end_date ASC;
END;
$$;

-- Create initial super admin function
CREATE OR REPLACE FUNCTION create_initial_super_admin(admin_email TEXT)
RETURNS TEXT 
LANGUAGE plpgsql 
SECURITY DEFINER
STABLE
AS $$
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
$$;

-- ===============================================
-- STEP 5: CREATE SAFE COLUMN-BASED INDEXES ONLY
-- ===============================================

-- Simple column-based indexes (no functional indexes)
CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id ON admin_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_roles_active ON admin_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_roles_role ON admin_roles(role);

-- Organization indexes
CREATE INDEX IF NOT EXISTS idx_organizations_subscription ON organizations(subscription_status);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(is_active);
CREATE INDEX IF NOT EXISTS idx_organizations_trial_end ON organizations(trial_end_date);

-- ===============================================
-- STEP 6: CREATE SUPER ADMIN AND VERIFY
-- ===============================================

-- Try to create the super admin
SELECT create_initial_super_admin('arjunin2020@gmail.com') AS result;

-- Show the result
SELECT 
    'Admin setup complete!' AS status,
    COUNT(*) || ' admin functions created' AS functions_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM admin_roles WHERE role = 'super_admin' AND is_active = true)
        THEN '✅ Super admin created successfully!'
        ELSE '⚠️ Super admin creation needs verification'
    END AS admin_status
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
    AND proname LIKE '%admin%';

-- Show current admin users
SELECT 
    u.email,
    ar.role,
    ar.is_active,
    ar.created_at
FROM admin_roles ar
JOIN auth.users u ON ar.user_id = u.id
ORDER BY ar.created_at DESC;
