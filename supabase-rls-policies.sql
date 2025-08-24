-- KrishiSethu Row Level Security (RLS) Policies
-- Run this AFTER running the schema script
-- This ensures data security by restricting access based on user roles and ownership

-- Helper function to get current user role
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

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is manager or admin
CREATE OR REPLACE FUNCTION is_manager_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() IN ('admin', 'manager');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES TABLE POLICIES
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (is_admin());

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (is_admin());

-- Insert policy for new user registration (handled by trigger)
CREATE POLICY "Enable insert for authenticated users" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- CATEGORIES TABLE POLICIES
-- All authenticated users can read categories
CREATE POLICY "All users can view categories" ON categories
  FOR SELECT USING (auth.role() = 'authenticated');

-- Managers and admins can manage categories
CREATE POLICY "Managers can manage categories" ON categories
  FOR ALL USING (is_manager_or_admin());

-- SUPPLIERS TABLE POLICIES
-- All authenticated users can read suppliers
CREATE POLICY "All users can view suppliers" ON suppliers
  FOR SELECT USING (auth.role() = 'authenticated');

-- Managers and admins can manage suppliers
CREATE POLICY "Managers can manage suppliers" ON suppliers
  FOR ALL USING (is_manager_or_admin());

-- CUSTOMERS TABLE POLICIES
-- All authenticated users can read customers
CREATE POLICY "All users can view customers" ON customers
  FOR SELECT USING (auth.role() = 'authenticated');

-- All authenticated users can create customers
CREATE POLICY "All users can create customers" ON customers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Users can update customers they created, managers can update all
CREATE POLICY "Users can update own customers" ON customers
  FOR UPDATE USING (
    created_by = auth.uid() OR is_manager_or_admin()
  );

-- Only admins can delete customers
CREATE POLICY "Admins can delete customers" ON customers
  FOR DELETE USING (is_admin());

-- PRODUCTS TABLE POLICIES
-- All authenticated users can read products
CREATE POLICY "All users can view products" ON products
  FOR SELECT USING (auth.role() = 'authenticated');

-- All authenticated users can create products
CREATE POLICY "All users can create products" ON products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Users can update products they created, managers can update all
CREATE POLICY "Users can update own products" ON products
  FOR UPDATE USING (
    created_by = auth.uid() OR is_manager_or_admin()
  );

-- Only managers and admins can delete products
CREATE POLICY "Managers can delete products" ON products
  FOR DELETE USING (is_manager_or_admin());

-- STOCK MOVEMENTS TABLE POLICIES
-- All authenticated users can read stock movements
CREATE POLICY "All users can view stock movements" ON stock_movements
  FOR SELECT USING (auth.role() = 'authenticated');

-- All authenticated users can create stock movements
CREATE POLICY "All users can create stock movements" ON stock_movements
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only managers and admins can delete stock movements
CREATE POLICY "Managers can delete stock movements" ON stock_movements
  FOR DELETE USING (is_manager_or_admin());

-- SALES ORDERS TABLE POLICIES
-- All authenticated users can read sales orders
CREATE POLICY "All users can view sales orders" ON sales_orders
  FOR SELECT USING (auth.role() = 'authenticated');

-- All authenticated users can create sales orders
CREATE POLICY "All users can create sales orders" ON sales_orders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Users can update orders they created, managers can update all
CREATE POLICY "Users can update own sales orders" ON sales_orders
  FOR UPDATE USING (
    created_by = auth.uid() OR is_manager_or_admin()
  );

-- Only managers and admins can delete sales orders
CREATE POLICY "Managers can delete sales orders" ON sales_orders
  FOR DELETE USING (is_manager_or_admin());

-- SALES ORDER ITEMS TABLE POLICIES
-- All authenticated users can read sales order items
CREATE POLICY "All users can view sales order items" ON sales_order_items
  FOR SELECT USING (auth.role() = 'authenticated');

-- All authenticated users can create sales order items
CREATE POLICY "All users can create sales order items" ON sales_order_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Users can update items for orders they created, managers can update all
CREATE POLICY "Users can update own sales order items" ON sales_order_items
  FOR UPDATE USING (
    (SELECT created_by FROM sales_orders WHERE id = order_id) = auth.uid() OR is_manager_or_admin()
  );

-- Users can delete items for orders they created, managers can delete all
CREATE POLICY "Users can delete own sales order items" ON sales_order_items
  FOR DELETE USING (
    (SELECT created_by FROM sales_orders WHERE id = order_id) = auth.uid() OR is_manager_or_admin()
  );

-- PURCHASE ORDERS TABLE POLICIES
-- All authenticated users can read purchase orders
CREATE POLICY "All users can view purchase orders" ON purchase_orders
  FOR SELECT USING (auth.role() = 'authenticated');

-- Managers and admins can manage purchase orders
CREATE POLICY "Managers can manage purchase orders" ON purchase_orders
  FOR ALL USING (is_manager_or_admin());

-- PURCHASE ORDER ITEMS TABLE POLICIES
-- All authenticated users can read purchase order items
CREATE POLICY "All users can view purchase order items" ON purchase_order_items
  FOR SELECT USING (auth.role() = 'authenticated');

-- Managers and admins can manage purchase order items
CREATE POLICY "Managers can manage purchase order items" ON purchase_order_items
  FOR ALL USING (is_manager_or_admin());

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🔒 RLS policies configured successfully!';
    RAISE NOTICE '👤 User roles: admin (full access), manager (most access), staff (limited access)';
    RAISE NOTICE '🛡️ Data is now secure with row-level security';
END
$$;
