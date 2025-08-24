-- Multi-Tenant Row Level Security (RLS) Policies - CLEAN VERSION
-- COMPLETE DATA ISOLATION between organizations
-- Run this AFTER the multi-tenant schema

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get current user's organization ID
CREATE OR REPLACE FUNCTION get_user_organization()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT organization_id 
    FROM profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current user's role within their organization
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is organization owner or admin
CREATE OR REPLACE FUNCTION is_org_owner_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() IN ('owner', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is organization manager or above
CREATE OR REPLACE FUNCTION is_org_manager_or_above()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() IN ('owner', 'admin', 'manager');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ORGANIZATIONS TABLE POLICIES
-- ============================================================================

-- Users can only see their own organization
CREATE POLICY "Users can view own organization" ON organizations
  FOR SELECT USING (
    id = get_user_organization()
  );

-- Only owners can update their organization
CREATE POLICY "Owners can update organization" ON organizations
  FOR UPDATE USING (
    id = get_user_organization() AND get_user_role() = 'owner'
  );

-- Allow organization creation (for new signups)
CREATE POLICY "Allow organization creation" ON organizations
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- PROFILES TABLE POLICIES (User Management)
-- ============================================================================

-- Users can see other users in their organization
CREATE POLICY "Users can view org members" ON profiles
  FOR SELECT USING (
    organization_id = get_user_organization()
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (
    id = auth.uid() AND organization_id = get_user_organization()
  );

-- Allow profile creation (handled by trigger)
CREATE POLICY "Allow profile creation" ON profiles
  FOR INSERT WITH CHECK (true);

-- Only owners can delete profiles
CREATE POLICY "Owners can delete profiles" ON profiles
  FOR DELETE USING (
    organization_id = get_user_organization()
    AND get_user_role() = 'owner'
    AND id != auth.uid()
  );

-- ============================================================================
-- ORGANIZATION INVITATIONS POLICIES
-- ============================================================================

-- Only admins+ can view invitations for their org
CREATE POLICY "Admins can view invitations" ON organization_invitations
  FOR SELECT USING (
    organization_id = get_user_organization()
    AND is_org_owner_or_admin()
  );

-- Only admins+ can send invitations
CREATE POLICY "Admins can create invitations" ON organization_invitations
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization()
    AND is_org_owner_or_admin()
  );

-- Only admins+ can manage invitations
CREATE POLICY "Admins can manage invitations" ON organization_invitations
  FOR ALL USING (
    organization_id = get_user_organization()
    AND is_org_owner_or_admin()
  );

-- ============================================================================
-- INVENTORY DATA POLICIES (TENANT-SCOPED)
-- ============================================================================

-- CATEGORIES
CREATE POLICY "Org members can view categories" ON categories
  FOR SELECT USING (organization_id = get_user_organization());

CREATE POLICY "Staff can create categories" ON categories
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization()
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Staff can update categories" ON categories
  FOR UPDATE USING (
    organization_id = get_user_organization()
    AND (created_by = auth.uid() OR is_org_manager_or_above())
  );

CREATE POLICY "Managers can delete categories" ON categories
  FOR DELETE USING (
    organization_id = get_user_organization()
    AND is_org_manager_or_above()
  );

-- SUPPLIERS  
CREATE POLICY "Org members can view suppliers" ON suppliers
  FOR SELECT USING (organization_id = get_user_organization());

CREATE POLICY "Staff can create suppliers" ON suppliers
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization()
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Staff can update suppliers" ON suppliers
  FOR UPDATE USING (
    organization_id = get_user_organization()
    AND (created_by = auth.uid() OR is_org_manager_or_above())
  );

CREATE POLICY "Managers can delete suppliers" ON suppliers
  FOR DELETE USING (
    organization_id = get_user_organization()
    AND is_org_manager_or_above()
  );

-- CUSTOMERS
CREATE POLICY "Org members can view customers" ON customers
  FOR SELECT USING (organization_id = get_user_organization());

CREATE POLICY "Staff can create customers" ON customers
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization()
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Staff can update customers" ON customers
  FOR UPDATE USING (
    organization_id = get_user_organization()
    AND (created_by = auth.uid() OR is_org_manager_or_above())
  );

CREATE POLICY "Managers can delete customers" ON customers
  FOR DELETE USING (
    organization_id = get_user_organization()
    AND is_org_manager_or_above()
  );

-- PRODUCTS
CREATE POLICY "Org members can view products" ON products
  FOR SELECT USING (organization_id = get_user_organization());

CREATE POLICY "Staff can create products" ON products
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization()
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Staff can update products" ON products
  FOR UPDATE USING (
    organization_id = get_user_organization()
    AND (created_by = auth.uid() OR is_org_manager_or_above())
  );

CREATE POLICY "Managers can delete products" ON products
  FOR DELETE USING (
    organization_id = get_user_organization()
    AND is_org_manager_or_above()
  );

-- STOCK MOVEMENTS
CREATE POLICY "Org members can view stock movements" ON stock_movements
  FOR SELECT USING (organization_id = get_user_organization());

CREATE POLICY "Staff can create stock movements" ON stock_movements
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization()
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Managers can delete stock movements" ON stock_movements
  FOR DELETE USING (
    organization_id = get_user_organization()
    AND is_org_manager_or_above()
  );

-- SALES ORDERS
CREATE POLICY "Org members can view sales orders" ON sales_orders
  FOR SELECT USING (organization_id = get_user_organization());

CREATE POLICY "Staff can create sales orders" ON sales_orders
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization()
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Staff can update sales orders" ON sales_orders
  FOR UPDATE USING (
    organization_id = get_user_organization()
    AND (created_by = auth.uid() OR is_org_manager_or_above())
  );

CREATE POLICY "Managers can delete sales orders" ON sales_orders
  FOR DELETE USING (
    organization_id = get_user_organization()
    AND is_org_manager_or_above()
  );

-- SALES ORDER ITEMS
CREATE POLICY "Org members can view sales order items" ON sales_order_items
  FOR SELECT USING (organization_id = get_user_organization());

CREATE POLICY "Staff can create sales order items" ON sales_order_items
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization()
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Staff can update sales order items" ON sales_order_items
  FOR UPDATE USING (organization_id = get_user_organization());

CREATE POLICY "Staff can delete sales order items" ON sales_order_items
  FOR DELETE USING (organization_id = get_user_organization());

-- PURCHASE ORDERS
CREATE POLICY "Org members can view purchase orders" ON purchase_orders
  FOR SELECT USING (organization_id = get_user_organization());

CREATE POLICY "Managers can create purchase orders" ON purchase_orders
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization()
    AND is_org_manager_or_above()
  );

CREATE POLICY "Managers can update purchase orders" ON purchase_orders
  FOR UPDATE USING (
    organization_id = get_user_organization()
    AND is_org_manager_or_above()
  );

CREATE POLICY "Managers can delete purchase orders" ON purchase_orders
  FOR DELETE USING (
    organization_id = get_user_organization()
    AND is_org_manager_or_above()
  );

-- PURCHASE ORDER ITEMS
CREATE POLICY "Org members can view purchase order items" ON purchase_order_items
  FOR SELECT USING (organization_id = get_user_organization());

CREATE POLICY "Managers can manage purchase order items" ON purchase_order_items
  FOR ALL USING (
    organization_id = get_user_organization()
    AND is_org_manager_or_above()
  );

-- ============================================================================
-- USER REGISTRATION TRIGGER
-- ============================================================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user_registration()
RETURNS TRIGGER AS $$
DECLARE
  org_id UUID;
  org_name TEXT;
  org_slug TEXT;
BEGIN
  -- Extract organization info from user metadata
  org_name := COALESCE(NEW.raw_user_meta_data->>'organization_name', 'My Company');
  org_slug := COALESCE(NEW.raw_user_meta_data->>'organization_slug', 
                       lower(replace(org_name, ' ', '-')) || '-' || substring(NEW.id::text from 1 for 8));

  -- Create new organization for first-time users
  INSERT INTO organizations (name, slug, description)
  VALUES (org_name, org_slug, 'Organization created during registration')
  RETURNING id INTO org_id;
  
  -- Create user profile as owner
  INSERT INTO profiles (id, organization_id, email, full_name, role)
  VALUES (
    NEW.id,
    org_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'owner'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_registration();

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🔐 Multi-tenant RLS policies configured successfully!';
    RAISE NOTICE '🏢 Complete data isolation between organizations';
    RAISE NOTICE '👥 Role-based permissions: owner > admin > manager > staff';
    RAISE NOTICE '🛡️ Users can only see data from their own organization';
    RAISE NOTICE '';
    RAISE NOTICE '✨ Your multi-tenant inventory system is ready!';
    RAISE NOTICE '🚀 Organizations are completely isolated from each other';
END
$$;
