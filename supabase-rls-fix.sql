-- RLS Policy Fixes for Multi-Tenant Testing
-- Run this to fix the "Failed to fetch" errors

-- Allow authenticated users to read organizations (needed for initial setup)
DROP POLICY IF EXISTS "Allow authenticated users to read organizations" ON organizations;
CREATE POLICY "Allow authenticated users to read organizations" ON organizations
  FOR SELECT TO authenticated USING (true);

-- Allow service role to read all organizations
DROP POLICY IF EXISTS "Service role can read organizations" ON organizations;
CREATE POLICY "Service role can read organizations" ON organizations
  FOR ALL TO service_role USING (true);

-- Allow authenticated users to read profiles
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON profiles;
CREATE POLICY "Allow authenticated users to read profiles" ON profiles
  FOR SELECT TO authenticated USING (true);

-- Allow service role to manage profiles
DROP POLICY IF EXISTS "Service role can manage profiles" ON profiles;
CREATE POLICY "Service role can manage profiles" ON profiles
  FOR ALL TO service_role USING (true);

-- Allow authenticated users to read categories (for testing)
DROP POLICY IF EXISTS "Allow authenticated users to read categories" ON categories;
CREATE POLICY "Allow authenticated users to read categories" ON categories
  FOR SELECT TO authenticated USING (true);

-- Allow service role to manage categories
DROP POLICY IF EXISTS "Service role can manage categories" ON categories;
CREATE POLICY "Service role can manage categories" ON categories
  FOR ALL TO service_role USING (true);

-- Allow authenticated users to read suppliers
DROP POLICY IF EXISTS "Allow authenticated users to read suppliers" ON suppliers;
CREATE POLICY "Allow authenticated users to read suppliers" ON suppliers
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to read customers
DROP POLICY IF EXISTS "Allow authenticated users to read customers" ON customers;
CREATE POLICY "Allow authenticated users to read customers" ON customers
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to read products
DROP POLICY IF EXISTS "Allow authenticated users to read products" ON products;
CREATE POLICY "Allow authenticated users to read products" ON products
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to read stock movements
DROP POLICY IF EXISTS "Allow authenticated users to read stock movements" ON stock_movements;
CREATE POLICY "Allow authenticated users to read stock movements" ON stock_movements
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to read sales orders
DROP POLICY IF EXISTS "Allow authenticated users to read sales orders" ON sales_orders;
CREATE POLICY "Allow authenticated users to read sales orders" ON sales_orders
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to read sales order items
DROP POLICY IF EXISTS "Allow authenticated users to read sales order items" ON sales_order_items;
CREATE POLICY "Allow authenticated users to read sales order items" ON sales_order_items
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to read purchase orders
DROP POLICY IF EXISTS "Allow authenticated users to read purchase orders" ON purchase_orders;
CREATE POLICY "Allow authenticated users to read purchase orders" ON purchase_orders
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to read purchase order items
DROP POLICY IF EXISTS "Allow authenticated users to read purchase order items" ON purchase_order_items;
CREATE POLICY "Allow authenticated users to read purchase order items" ON purchase_order_items
  FOR SELECT TO authenticated USING (true);

-- Allow public read access for testing purposes (TEMPORARY - remove in production)
DROP POLICY IF EXISTS "Allow public read for testing" ON organizations;
CREATE POLICY "Allow public read for testing" ON organizations
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public read profiles for testing" ON profiles;
CREATE POLICY "Allow public read profiles for testing" ON profiles
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public read categories for testing" ON categories;
CREATE POLICY "Allow public read categories for testing" ON categories
  FOR SELECT TO public USING (true);

-- Also allow anon role access for testing
DROP POLICY IF EXISTS "Allow anon access for testing orgs" ON organizations;
CREATE POLICY "Allow anon access for testing orgs" ON organizations
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon access for testing profiles" ON profiles;
CREATE POLICY "Allow anon access for testing profiles" ON profiles
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon access for testing categories" ON categories;
CREATE POLICY "Allow anon access for testing categories" ON categories
  FOR SELECT TO anon USING (true);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🔧 RLS policies fixed for testing!';
    RAISE NOTICE '📋 Anonymous users can now read basic tables';
    RAISE NOTICE '✅ This should fix the "Failed to fetch" errors';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ Note: Remove public/anon policies in production!';
END
$$;
