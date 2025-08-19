-- =====================================================
-- KRISHISETHU INVENTORY MANAGEMENT - DATABASE MIGRATION
-- =====================================================
-- This script addresses the frontend-database mismatch issues
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. CREATE NOTIFICATIONS TABLE
-- =====================================================
-- Frontend expects 'notifications' table but DB has 'notification_logs'
-- Creating the expected table structure

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  level text CHECK (level IN ('info','warning','error')) DEFAULT 'info',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- Enable RLS (Row Level Security)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 2. CREATE CAMELCASE VIEWS
-- =====================================================
-- These views eliminate the need for field mapping in the frontend
-- Frontend can use camelCase directly while DB stays snake_case

-- Products CamelCase View
CREATE OR REPLACE VIEW public.products_cc AS
SELECT
  id, name, code, type,
  category_id   as "categoryId",
  brand_id      as "brandId",
  supplier_id   as "supplierId",
  description, composition, quantity, unit,
  min_stock_level as "minStockLevel",
  reorder_point   as "reorderPoint",
  purchase_price  as "purchasePrice",
  sale_price      as "salePrice",
  mrp, batch_no as "batchNo",
  expiry_date as "expiryDate",
  manufacturing_date as "manufacturingDate",
  hsn_code as "hsnCode",
  gst_rate as "gstRate",
  barcode, location, image_urls as "imageUrls",
  is_active as "isActive",
  created_at as "createdAt",
  updated_at as "updatedAt"
FROM public.products;

-- Sales CamelCase View
CREATE OR REPLACE VIEW public.sales_cc AS
SELECT
  id,
  sale_number     as "saleNumber",
  customer_id     as "customerId",
  customer_name   as "customerName",
  subtotal,
  discount,
  total_amount    as "totalAmount",
  tax_amount      as "taxAmount",
  payment_method  as "paymentMethod",
  amount_paid     as "amountPaid",
  payment_status  as "paymentStatus",
  status,
  sale_date       as "saleDate",
  created_by      as "createdBy",
  created_at      as "createdAt",
  updated_at      as "updatedAt"
FROM public.sales;

-- Categories CamelCase View
CREATE OR REPLACE VIEW public.categories_cc AS
SELECT
  id, name, description, color,
  is_active as "isActive",
  sort_order as "sortOrder",
  created_at as "createdAt",
  updated_at as "updatedAt"
FROM public.categories;

-- Suppliers CamelCase View
CREATE OR REPLACE VIEW public.suppliers_cc AS
SELECT
  id, name,
  contact_person as "contactPerson",
  phone, email, address,
  gst_number as "gstNumber",
  pan_number as "panNumber",
  payment_terms as "paymentTerms",
  credit_limit as "creditLimit",
  outstanding_amount as "outstandingAmount",
  is_active as "isActive",
  created_at as "createdAt",
  updated_at as "updatedAt"
FROM public.suppliers;

-- Customers CamelCase View
CREATE OR REPLACE VIEW public.customers_cc AS
SELECT
  id, name,
  contact_person as "contactPerson",
  phone, email, address,
  gst_number as "gstNumber",
  pan_number as "panNumber",
  credit_limit as "creditLimit",
  outstanding_amount as "outstandingAmount",
  total_purchases as "totalPurchases",
  is_active as "isActive",
  created_at as "createdAt",
  updated_at as "updatedAt"
FROM public.customers;

-- Purchases CamelCase View
CREATE OR REPLACE VIEW public.purchases_cc AS
SELECT
  id,
  supplier_id as "supplierId",
  supplier_name as "supplierName",
  purchase_number as "purchaseNumber",
  subtotal,
  discount,
  total_amount as "totalAmount",
  tax_amount as "taxAmount",
  payment_status as "paymentStatus",
  amount_paid as "amountPaid",
  status,
  invoice_number as "invoiceNumber",
  invoice_date as "invoiceDate",
  purchase_date as "purchaseDate",
  created_by as "createdBy",
  created_at as "createdAt",
  updated_at as "updatedAt"
FROM public.purchases;

-- Brands CamelCase View
CREATE OR REPLACE VIEW public.brands_cc AS
SELECT
  id, name, description,
  logo_url as "logoUrl",
  is_active as "isActive",
  created_at as "createdAt",
  updated_at as "updatedAt"
FROM public.brands;

-- Stock Movements CamelCase View
CREATE OR REPLACE VIEW public.stock_movements_cc AS
SELECT
  id,
  product_id as "productId",
  movement_type as "movementType",
  quantity,
  reference_type as "referenceType",
  reference_id as "referenceId",
  notes,
  created_by as "createdBy",
  created_at as "createdAt"
FROM public.stock_movements;

-- Sale Items CamelCase View
CREATE OR REPLACE VIEW public.sale_items_cc AS
SELECT
  id,
  sale_id as "saleId",
  product_id as "productId",
  product_name as "productName",
  quantity,
  unit_price as "unitPrice",
  total_price as "totalPrice",
  gst_rate as "gstRate",
  batch_no as "batchNo",
  created_at as "createdAt"
FROM public.sale_items;

-- Purchase Items CamelCase View
CREATE OR REPLACE VIEW public.purchase_items_cc AS
SELECT
  id,
  purchase_id as "purchaseId",
  product_id as "productId",
  product_name as "productName",
  quantity,
  unit_price as "unitPrice",
  total_price as "totalPrice",
  gst_rate as "gstRate",
  batch_no as "batchNo",
  expiry_date as "expiryDate",
  created_at as "createdAt"
FROM public.purchase_items;

-- Notifications CamelCase View
CREATE OR REPLACE VIEW public.notifications_cc AS
SELECT
  id,
  user_id as "userId",
  title,
  body,
  level,
  is_read as "isRead",
  created_at as "createdAt"
FROM public.notifications;

-- =====================================================
-- 3. CREATE USERS VIEW FOR COMPATIBILITY
-- =====================================================
-- Frontend may reference 'users' but we want to use 'profiles'
-- This view provides compatibility without data duplication

CREATE OR REPLACE VIEW public.users_view AS
SELECT 
  id, 
  email, 
  full_name as name, 
  role, 
  is_active, 
  created_at, 
  updated_at
FROM public.profiles;

-- =====================================================
-- 4. GRANT PERMISSIONS ON VIEWS
-- =====================================================
-- Ensure authenticated users can access the camelCase views

GRANT SELECT ON public.products_cc TO authenticated;
GRANT SELECT ON public.sales_cc TO authenticated;
GRANT SELECT ON public.categories_cc TO authenticated;
GRANT SELECT ON public.suppliers_cc TO authenticated;
GRANT SELECT ON public.customers_cc TO authenticated;
GRANT SELECT ON public.purchases_cc TO authenticated;
GRANT SELECT ON public.brands_cc TO authenticated;
GRANT SELECT ON public.stock_movements_cc TO authenticated;
GRANT SELECT ON public.sale_items_cc TO authenticated;
GRANT SELECT ON public.purchase_items_cc TO authenticated;
GRANT SELECT ON public.notifications_cc TO authenticated;
GRANT SELECT ON public.users_view TO authenticated;

-- =====================================================
-- 5. CREATE HELPER FUNCTION FOR TABLE COUNTS
-- =====================================================
-- This function helps with database diagnostics

CREATE OR REPLACE FUNCTION public.get_table_counts()
RETURNS TABLE(table_name text, row_count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'products'::text, 
    (SELECT count(*) FROM public.products)::bigint
  UNION ALL
  SELECT 
    'categories'::text, 
    (SELECT count(*) FROM public.categories)::bigint
  UNION ALL
  SELECT 
    'suppliers'::text, 
    (SELECT count(*) FROM public.suppliers)::bigint
  UNION ALL
  SELECT 
    'customers'::text, 
    (SELECT count(*) FROM public.customers)::bigint
  UNION ALL
  SELECT 
    'sales'::text, 
    (SELECT count(*) FROM public.sales)::bigint
  UNION ALL
  SELECT 
    'purchases'::text, 
    (SELECT count(*) FROM public.purchases)::bigint
  UNION ALL
  SELECT 
    'brands'::text, 
    (SELECT count(*) FROM public.brands)::bigint
  UNION ALL
  SELECT 
    'stock_movements'::text, 
    (SELECT count(*) FROM public.stock_movements)::bigint
  UNION ALL
  SELECT 
    'profiles'::text, 
    (SELECT count(*) FROM public.profiles)::bigint
  UNION ALL
  SELECT 
    'notifications'::text, 
    (SELECT count(*) FROM public.notifications)::bigint;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_table_counts() TO authenticated;

-- =====================================================
-- 6. CREATE SAMPLE NOTIFICATIONS (OPTIONAL)
-- =====================================================
-- Add some sample notifications to test the system
-- Uncomment if you want sample data

/*
INSERT INTO public.notifications (user_id, title, body, level) VALUES
  (
    (SELECT id FROM public.profiles LIMIT 1),
    'Welcome to Krishisethu!',
    'Your inventory management system is now ready to use.',
    'info'
  ),
  (
    (SELECT id FROM public.profiles LIMIT 1),
    'Database Migration Complete',
    'All camelCase views have been created successfully.',
    'info'
  );
*/

-- =====================================================
-- 7. VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the migration worked

-- Check if all views exist
SELECT schemaname, viewname 
FROM pg_views 
WHERE schemaname = 'public' 
  AND viewname LIKE '%_cc'
ORDER BY viewname;

-- Check table counts
SELECT * FROM public.get_table_counts();

-- Check notifications table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'notifications'
ORDER BY ordinal_position;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Summary of changes:
-- ✅ Created notifications table with proper structure
-- ✅ Created camelCase views for all major tables
-- ✅ Created users_view for compatibility
-- ✅ Set up proper permissions and RLS policies
-- ✅ Added helper functions for diagnostics
-- 
-- Your frontend should now work seamlessly with:
-- - Notifications functionality
-- - CamelCase field names (via views)
-- - Proper user management (via profiles)
-- - Enhanced diagnostics and health checks
-- =====================================================