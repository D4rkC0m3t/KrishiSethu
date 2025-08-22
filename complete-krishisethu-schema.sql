-- ==============================
-- KrishiSethu Inventory Management System
-- Complete SQL Schema for Supabase/PostgreSQL
-- ==============================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================
-- 1. Profiles (Customers / Users)
-- ==============================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  gst_number TEXT,
  role TEXT DEFAULT 'customer', -- customer / admin / staff / trial
  account_type TEXT DEFAULT 'trial', -- trial / paid / admin
  is_active BOOLEAN DEFAULT true,
  is_paid BOOLEAN DEFAULT false,
  trial_start_date TIMESTAMPTZ DEFAULT NOW(),
  trial_end_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on new signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.email,
    'customer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists, then create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================
-- 2. Suppliers (Vendors)
-- ==============================
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  gst_number TEXT,
  pan_number TEXT,
  payment_terms TEXT DEFAULT 'Cash',
  credit_limit NUMERIC(12,2) DEFAULT 0,
  outstanding_amount NUMERIC(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================
-- 3. Categories
-- ==============================
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name, description, sort_order) VALUES
('Chemical Fertilizer', 'Chemical and synthetic fertilizers', 1),
('Organic Fertilizer', 'Organic and natural fertilizers', 2),
('NPK Fertilizers', 'NPK compound fertilizers', 3),
('Bio Fertilizer', 'Bio and microbial fertilizers', 4),
('Seeds', 'Seeds and planting materials', 5),
('Pesticides', 'Pesticides and crop protection', 6),
('Tools & Equipment', 'Agricultural tools and equipment', 7)
ON CONFLICT (name) DO NOTHING;

-- ==============================
-- 4. Brands
-- ==============================
CREATE TABLE IF NOT EXISTS brands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default brands (generic ones to avoid trademark issues)
INSERT INTO brands (name, description) VALUES
('Generic Brand A', 'Generic fertilizer brand A'),
('Generic Brand B', 'Generic fertilizer brand B'),
('Local Supplier', 'Local supplier brand'),
('Import Brand', 'Imported fertilizer brand'),
('Organic Choice', 'Organic fertilizer brand'),
('Premium Grade', 'Premium quality brand')
ON CONFLICT (name) DO NOTHING;

-- ==============================
-- 5. Products
-- ==============================
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  type TEXT CHECK (type IN ('Chemical', 'Organic', 'Bio', 'NPK', 'Seeds', 'Pesticide', 'Tools')) DEFAULT 'Chemical',
  unit TEXT DEFAULT 'pcs', -- pcs / box / kg / litre / bag
  purchase_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  sale_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 10,
  max_stock_level INTEGER DEFAULT 1000,
  reorder_point INTEGER DEFAULT 20,
  hsn_code TEXT,
  gst_rate NUMERIC(5,2) DEFAULT 18.00,
  batch_no TEXT,
  expiry_date DATE,
  manufacturing_date DATE,
  image_urls JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- ==============================
-- 6. Purchases (Stock In)
-- ==============================
CREATE TABLE IF NOT EXISTS purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_number TEXT UNIQUE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  supplier_name TEXT, -- Denormalized for faster queries
  invoice_number TEXT,
  invoice_date DATE,
  purchase_date DATE DEFAULT CURRENT_DATE,
  total_amount NUMERIC(12,2) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid')),
  amount_paid NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL, -- Denormalized for reports
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  gst_rate NUMERIC(5,2) DEFAULT 18.00,
  batch_no TEXT,
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================
-- 7. Sales (Stock Out)
-- ==============================
CREATE TABLE IF NOT EXISTS sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_number TEXT UNIQUE,
  customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  customer_name TEXT, -- Denormalized for faster queries
  sale_date DATE DEFAULT CURRENT_DATE,
  subtotal NUMERIC(12,2) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) DEFAULT 0,
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'upi', 'bank_transfer', 'cheque', 'credit')),
  amount_paid NUMERIC(12,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid')),
  status TEXT DEFAULT 'completed' CHECK (status IN ('draft', 'completed', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL, -- Denormalized for reports
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  gst_rate NUMERIC(5,2) DEFAULT 18.00,
  batch_no TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==============================
-- 8. Stock Movements (Audit Trail)
-- ==============================
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  movement_type TEXT CHECK (movement_type IN ('IN', 'OUT', 'ADJUSTMENT')) NOT NULL,
  quantity INTEGER NOT NULL,
  reference_type TEXT, -- 'purchase', 'sale', 'adjustment'
  reference_id UUID, -- purchase_id, sale_id, etc.
  batch_no TEXT,
  notes TEXT,
  movement_date DATE DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(movement_date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);

-- ==============================
-- 9. Settings (App Configuration)
-- ==============================
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB,
  description TEXT,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (key, value, description, category) VALUES
('company.name', '"KrishiSethu Fertilizers"', 'Company name', 'company'),
('company.phone', '"+91-9876543210"', 'Company phone number', 'company'),
('company.email', '"info@krishisethu.com"', 'Company email', 'company'),
('company.address', '"123 Agricultural Complex"', 'Company address', 'company'),
('company.city', '"Mumbai"', 'Company city', 'company'),
('company.state', '"Maharashtra"', 'Company state', 'company'),
('company.pincode', '"400001"', 'Company pincode', 'company'),
('company.gst_number', '"27AAAAA0000A1Z5"', 'Company GST number', 'company'),
('tax.default_gst_rate', '18.00', 'Default GST rate percentage', 'tax'),
('inventory.low_stock_threshold', '10', 'Low stock alert threshold', 'inventory')
ON CONFLICT (key) DO NOTHING;

-- ==============================
-- 10. Triggers for Stock Management
-- ==============================

-- Function to update product quantity and log stock movement on purchase
CREATE OR REPLACE FUNCTION log_purchase_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Update product quantity
  UPDATE products 
  SET quantity = quantity + NEW.quantity,
      updated_at = NOW()
  WHERE id = NEW.product_id;
  
  -- Log stock movement
  INSERT INTO stock_movements (product_id, movement_type, quantity, reference_type, reference_id, batch_no)
  VALUES (NEW.product_id, 'IN', NEW.quantity, 'purchase', NEW.purchase_id, NEW.batch_no);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_purchase_item_insert ON purchase_items;
CREATE TRIGGER after_purchase_item_insert
  AFTER INSERT ON purchase_items
  FOR EACH ROW EXECUTE FUNCTION log_purchase_stock();

-- Function to update product quantity and log stock movement on sale
CREATE OR REPLACE FUNCTION log_sale_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Update product quantity (decrease)
  UPDATE products 
  SET quantity = quantity - NEW.quantity,
      updated_at = NOW()
  WHERE id = NEW.product_id;
  
  -- Log stock movement
  INSERT INTO stock_movements (product_id, movement_type, quantity, reference_type, reference_id, batch_no)
  VALUES (NEW.product_id, 'OUT', NEW.quantity, 'sale', NEW.sale_id, NEW.batch_no);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_sale_item_insert ON sale_items;
CREATE TRIGGER after_sale_item_insert
  AFTER INSERT ON sale_items
  FOR EACH ROW EXECUTE FUNCTION log_sale_stock();

-- Function to update purchase totals
CREATE OR REPLACE FUNCTION update_purchase_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE purchases 
  SET total_amount = (
    SELECT COALESCE(SUM(total_price), 0) 
    FROM purchase_items 
    WHERE purchase_id = COALESCE(NEW.purchase_id, OLD.purchase_id)
  ),
  tax_amount = (
    SELECT COALESCE(SUM(total_price * gst_rate / 100), 0) 
    FROM purchase_items 
    WHERE purchase_id = COALESCE(NEW.purchase_id, OLD.purchase_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.purchase_id, OLD.purchase_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_purchase_totals_trigger ON purchase_items;
CREATE TRIGGER update_purchase_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON purchase_items
  FOR EACH ROW EXECUTE FUNCTION update_purchase_totals();

-- Function to update sale totals
CREATE OR REPLACE FUNCTION update_sale_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE sales 
  SET subtotal = (
    SELECT COALESCE(SUM(total_price), 0) 
    FROM sale_items 
    WHERE sale_id = COALESCE(NEW.sale_id, OLD.sale_id)
  ),
  tax_amount = (
    SELECT COALESCE(SUM(total_price * gst_rate / 100), 0) 
    FROM sale_items 
    WHERE sale_id = COALESCE(NEW.sale_id, OLD.sale_id)
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.sale_id, OLD.sale_id);
  
  -- Update total_amount = subtotal + tax_amount
  UPDATE sales 
  SET total_amount = subtotal + tax_amount
  WHERE id = COALESCE(NEW.sale_id, OLD.sale_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_sale_totals_trigger ON sale_items;
CREATE TRIGGER update_sale_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON sale_items
  FOR EACH ROW EXECUTE FUNCTION update_sale_totals();

-- ==============================
-- 11. Create profile for existing users
-- ==============================
DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Get current authenticated users and create profiles for them
    FOR user_record IN SELECT * FROM auth.users WHERE confirmed_at IS NOT NULL
    LOOP
        INSERT INTO public.profiles (id, email, full_name)
        VALUES (
            user_record.id,
            user_record.email,
            COALESCE(
                user_record.raw_user_meta_data->>'full_name', 
                user_record.raw_user_meta_data->>'name', 
                split_part(user_record.email, '@', 1)
            )
        )
        ON CONFLICT (id) DO NOTHING;
    END LOOP;
END
$$;

-- ==============================
-- Complete! Your KrishiSethu database is now ready! 🌱
-- ==============================
