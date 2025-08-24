-- =====================================================
-- KRISHISETHU COMPLETE DATABASE SCHEMA
-- Based on code analysis from Inventory.jsx and supabaseDb.js
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE AUTHENTICATION AND USERS
-- =====================================================

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) NOT NULL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- MASTER DATA TABLES
-- =====================================================

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brands table
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  contact_person TEXT,
  gst_number TEXT,
  pan_number TEXT,
  payment_terms TEXT,
  credit_limit DECIMAL(10,2) DEFAULT 0,
  outstanding_amount DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  contact_person TEXT,
  gst_number TEXT,
  pan_number TEXT,
  customer_type TEXT DEFAULT 'retail' CHECK (customer_type IN ('retail', 'wholesale')),
  credit_limit DECIMAL(10,2) DEFAULT 0,
  outstanding_amount DECIMAL(10,2) DEFAULT 0,
  total_purchases DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PRODUCTS TABLE (Core inventory)
-- =====================================================

-- Product type enum based on supabaseDb.js
CREATE TYPE product_type_enum AS ENUM ('Chemical', 'Organic', 'Bio', 'NPK', 'Seeds', 'Pesticide', 'Tools');

-- Products table - main inventory table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Basic product info
  name TEXT NOT NULL,
  description TEXT,
  type product_type_enum DEFAULT 'Chemical',
  category TEXT NOT NULL,
  brand TEXT,
  
  -- Product codes and identification
  sku TEXT UNIQUE NOT NULL,
  barcode TEXT,
  hsn_code TEXT,
  
  -- Inventory quantities
  quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'kg',
  min_stock_level INTEGER DEFAULT 10,
  max_stock_level INTEGER DEFAULT 1000,
  reorder_point INTEGER DEFAULT 10,
  
  -- Pricing
  purchase_price DECIMAL(10,2) DEFAULT 0,
  sale_price DECIMAL(10,2) DEFAULT 0,
  unit_price DECIMAL(10,2) DEFAULT 0, -- Alias for purchase_price
  
  -- Batch and expiry tracking
  batch_no TEXT,
  manufacturing_date DATE,
  expiry_date DATE,
  
  -- Supplier info
  supplier TEXT,
  supplier_id UUID REFERENCES public.suppliers(id),
  
  -- Category and brand references (keeping TEXT for backwards compatibility)
  category_id UUID REFERENCES public.categories(id),
  brand_id UUID REFERENCES public.brands(id),
  
  -- Tax information
  gst_rate DECIMAL(5,2) DEFAULT 18.00,
  
  -- Additional data
  image_urls JSONB DEFAULT '[]',
  attachments JSONB DEFAULT '{}',
  
  -- Status and timestamps
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SALES SYSTEM
-- =====================================================

-- Sales table
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_number TEXT NOT NULL UNIQUE,
  
  -- Customer information
  customer_id UUID REFERENCES public.customers(id),
  customer_name TEXT NOT NULL,
  
  -- Financial totals
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Payment information
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'upi', 'cheque', 'credit')),
  amount_paid DECIMAL(10,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'overdue')),
  
  -- Sale details
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'completed' CHECK (status IN ('draft', 'completed', 'cancelled', 'refunded')),
  notes TEXT,
  
  -- Audit fields
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sale items table
CREATE TABLE IF NOT EXISTS public.sale_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
  
  -- Product information
  product_id UUID REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  
  -- Quantity and pricing
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  
  -- Tax information
  gst_rate DECIMAL(5,2) DEFAULT 18.00,
  
  -- Batch tracking
  batch_no TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PURCHASE SYSTEM
-- =====================================================

-- Purchases table
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_number TEXT NOT NULL UNIQUE,
  
  -- Supplier information
  supplier_id UUID REFERENCES public.suppliers(id),
  supplier_name TEXT NOT NULL,
  
  -- Financial details
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial')),
  
  -- Purchase details
  invoice_number TEXT,
  invoice_date DATE,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Audit fields
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase items table
CREATE TABLE IF NOT EXISTS public.purchase_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE,
  
  -- Product information
  product_id UUID REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  
  -- Quantity and pricing
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  
  -- Tax information
  gst_rate DECIMAL(5,2) DEFAULT 18.00,
  
  -- Batch and expiry
  batch_no TEXT,
  expiry_date DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STOCK MOVEMENT TRACKING
-- =====================================================

-- Stock movements table
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Product reference
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Movement details
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'transfer', 'damaged', 'expired')),
  quantity INTEGER NOT NULL,
  
  -- Reference information
  reference_type TEXT, -- 'sale', 'purchase', 'adjustment', etc.
  reference_id UUID,   -- ID of the related sale, purchase, etc.
  
  -- Additional details
  batch_no TEXT,
  notes TEXT,
  movement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Audit fields
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- E-INVOICE SYSTEM (Optional)
-- =====================================================

-- E-invoices table
CREATE TABLE IF NOT EXISTS public.einvoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Invoice identification
  invoice_number TEXT NOT NULL UNIQUE,
  invoice_date DATE NOT NULL,
  
  -- Buyer information
  customer_id UUID REFERENCES public.customers(id),
  buyer_name TEXT NOT NULL,
  buyer_gstin TEXT,
  buyer_address TEXT,
  
  -- Financial totals
  subtotal DECIMAL(10,2) DEFAULT 0,
  total_tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Payment details
  payment_method TEXT DEFAULT 'cash',
  amount_paid DECIMAL(10,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'pending',
  
  -- E-invoice specific fields
  irn TEXT, -- Invoice Reference Number
  ack_number TEXT, -- Acknowledgment Number
  ack_date TIMESTAMP WITH TIME ZONE,
  qr_code_data TEXT,
  signed_invoice JSONB,
  
  -- Status and notes
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'cancelled')),
  notes TEXT,
  
  -- Audit fields
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- E-invoice items table
CREATE TABLE IF NOT EXISTS public.einvoice_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  einvoice_id UUID REFERENCES public.einvoices(id) ON DELETE CASCADE,
  
  -- Item details
  item_serial_number INTEGER NOT NULL,
  product_id UUID REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  hsn_code TEXT,
  
  -- Quantity and pricing
  quantity DECIMAL(10,3) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Tax details
  gst_rate DECIMAL(5,2) DEFAULT 18.00,
  cgst_amount DECIMAL(10,2) DEFAULT 0,
  sgst_amount DECIMAL(10,2) DEFAULT 0,
  igst_amount DECIMAL(10,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SYSTEM CONFIGURATION
-- =====================================================

-- Settings table
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  category TEXT DEFAULT 'general',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES public.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_quantity ON public.products(quantity);
CREATE INDEX IF NOT EXISTS idx_products_expiry_date ON public.products(expiry_date);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON public.products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON public.products(brand_id);

-- Sales indexes
CREATE INDEX IF NOT EXISTS idx_sales_sale_number ON public.sales(sale_number);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON public.sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON public.sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON public.sales(payment_status);

-- Sale items indexes
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON public.sale_items(product_id);

-- Purchase indexes
CREATE INDEX IF NOT EXISTS idx_purchases_purchase_number ON public.purchases(purchase_number);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier_id ON public.purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_purchase_date ON public.purchases(purchase_date);

-- Stock movements indexes
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON public.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_movement_date ON public.stock_movements(movement_date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_movement_type ON public.stock_movements(movement_type);

-- Settings indexes
CREATE INDEX IF NOT EXISTS idx_settings_key ON public.settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_category ON public.settings(category);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =====================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_brands_updated_at ON public.brands;
CREATE TRIGGER update_brands_updated_at
    BEFORE UPDATE ON public.brands
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_suppliers_updated_at ON public.suppliers;
CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON public.suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sales_updated_at ON public.sales;
CREATE TRIGGER update_sales_updated_at
    BEFORE UPDATE ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_purchases_updated_at ON public.purchases;
CREATE TRIGGER update_purchases_updated_at
    BEFORE UPDATE ON public.purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_einvoices_updated_at ON public.einvoices;
CREATE TRIGGER update_einvoices_updated_at
    BEFORE UPDATE ON public.einvoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_settings_updated_at ON public.settings;
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.einvoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.einvoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies for authenticated users
-- Note: For multi-tenancy, you would add owner_id columns and filter by auth.uid()

-- Users table policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- General policies for authenticated users (adjust based on your multi-tenancy needs)
CREATE POLICY "Authenticated users can view categories" ON public.categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view brands" ON public.brands
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage suppliers" ON public.suppliers
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage customers" ON public.customers
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage products" ON public.products
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage sales" ON public.sales
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage sale_items" ON public.sale_items
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage purchases" ON public.purchases
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage purchase_items" ON public.purchase_items
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage stock_movements" ON public.stock_movements
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage einvoices" ON public.einvoices
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage einvoice_items" ON public.einvoice_items
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage settings" ON public.settings
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view audit_logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (true);

-- =====================================================
-- INITIAL DATA (Optional)
-- =====================================================

-- Insert default categories (if not exists)
INSERT INTO public.categories (name, description, sort_order) VALUES 
  ('Compound Fertilizers', 'Multi-nutrient fertilizers with NPK combinations', 1),
  ('Nitrogen Fertilizers', 'High nitrogen content fertilizers', 2),
  ('Phosphorus Fertilizers', 'Phosphorus-rich fertilizers for root development', 3),
  ('Potassium Fertilizers', 'Potassium fertilizers for plant strength', 4),
  ('Organic Fertilizers', 'Natural and organic fertilizer options', 5),
  ('Micronutrients', 'Essential micronutrient fertilizers', 6),
  ('Bio-fertilizers', 'Biological fertilizer solutions', 7),
  ('Seeds', 'Agricultural seeds and planting materials', 8),
  ('Pesticides', 'Plant protection products', 9),
  ('Tools', 'Agricultural tools and equipment', 10)
ON CONFLICT (name) DO NOTHING;

-- Insert default brands (if not exists)
INSERT INTO public.brands (name, description) VALUES 
  ('AgriCorp', 'Premium agricultural products and fertilizers'),
  ('FertMax', 'Maximum yield fertilizer solutions'),
  ('CropGrow', 'Complete crop nutrition systems'),
  ('NutriCrop', 'Essential plant nutrition products'),
  ('EcoFarm', 'Sustainable and organic farming solutions'),
  ('GreenGold', 'Gold standard in agricultural inputs'),
  ('BioNutri', 'Biological nutrition solutions'),
  ('SeedMaster', 'Quality seeds and planting materials')
ON CONFLICT (name) DO NOTHING;

-- Success message
SELECT 'KrishiSethu database schema created successfully! All tables, indexes, and policies are now ready.' as result;
