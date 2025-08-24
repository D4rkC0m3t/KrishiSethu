-- KrishiSethu Multi-Tenant Inventory Management Schema
-- COMPLETE DATA ISOLATION between organizations
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE MULTI-TENANT TABLES
-- ============================================================================

-- Organizations table (TENANT ROOT)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- for routing: app.domain.com/org-slug
  description TEXT,
  logo_url TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  address JSONB, -- {street, city, state, country, postal_code}
  settings JSONB DEFAULT '{}'::jsonb,
  -- Subscription management
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'starter', 'business', 'enterprise')),
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'cancelled')),
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days'),
  -- Limits based on subscription
  max_users INTEGER DEFAULT 3,
  max_products INTEGER DEFAULT 50,
  max_storage_mb INTEGER DEFAULT 100,
  -- Organization status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- User profiles with organization membership
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  -- Role within the organization
  role TEXT DEFAULT 'staff' CHECK (role IN ('owner', 'admin', 'manager', 'staff')),
  permissions JSONB DEFAULT '{}'::jsonb, -- custom permissions per user
  -- User status
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(email, organization_id)
);

-- Organization invitations (for user onboarding)
CREATE TABLE IF NOT EXISTS organization_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff')),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID REFERENCES profiles(id) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days') NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(email, organization_id)
);

-- ============================================================================
-- INVENTORY MANAGEMENT TABLES (ALL TENANT-SCOPED)
-- ============================================================================

-- Categories (per organization)
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  parent_id UUID REFERENCES categories(id), -- for hierarchical categories
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(organization_id, name)
);

-- Suppliers (per organization)
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  code TEXT, -- supplier code like SUP001
  email TEXT,
  phone TEXT,
  address JSONB,
  contact_person TEXT,
  tax_number TEXT,
  payment_terms TEXT DEFAULT '30 days',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(organization_id, code)
);

-- Customers (per organization)
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  code TEXT, -- customer code like CUS001
  email TEXT,
  phone TEXT,
  address JSONB,
  tax_number TEXT,
  credit_limit DECIMAL(15,2) DEFAULT 0,
  payment_terms TEXT DEFAULT '30 days',
  customer_type TEXT DEFAULT 'regular' CHECK (customer_type IN ('regular', 'wholesale', 'retail')),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(organization_id, code)
);

-- Products (per organization)
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT NOT NULL, -- Stock Keeping Unit
  barcode TEXT,
  category_id UUID REFERENCES categories(id),
  supplier_id UUID REFERENCES suppliers(id),
  -- Pricing
  cost_price DECIMAL(15,4) DEFAULT 0,
  selling_price DECIMAL(15,4) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0, -- percentage
  -- Inventory
  stock_quantity DECIMAL(15,4) DEFAULT 0,
  reserved_quantity DECIMAL(15,4) DEFAULT 0, -- for pending orders
  min_stock_level DECIMAL(15,4) DEFAULT 0,
  max_stock_level DECIMAL(15,4) DEFAULT 0,
  reorder_point DECIMAL(15,4) DEFAULT 0,
  reorder_quantity DECIMAL(15,4) DEFAULT 0,
  -- Physical attributes
  unit_of_measure TEXT DEFAULT 'pieces',
  weight DECIMAL(10,4),
  dimensions JSONB, -- {length, width, height, unit}
  -- Additional info
  batch_tracking BOOLEAN DEFAULT false,
  expiry_tracking BOOLEAN DEFAULT false,
  serial_tracking BOOLEAN DEFAULT false,
  location TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(organization_id, sku)
);

-- Stock movements (detailed inventory tracking)
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'transfer')),
  quantity DECIMAL(15,4) NOT NULL,
  unit_cost DECIMAL(15,4),
  total_cost DECIMAL(15,2),
  -- Reference to source transaction
  reference_type TEXT CHECK (reference_type IN ('purchase', 'sale', 'adjustment', 'return', 'transfer', 'production')),
  reference_id UUID,
  reference_number TEXT,
  -- Batch/Serial tracking
  batch_number TEXT,
  serial_number TEXT,
  expiry_date DATE,
  -- Additional info
  location_from TEXT,
  location_to TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Sales orders
CREATE TABLE IF NOT EXISTS sales_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  order_number TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned')),
  order_date DATE DEFAULT CURRENT_DATE NOT NULL,
  due_date DATE,
  shipped_date DATE,
  delivered_date DATE,
  -- Financial
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  shipping_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) DEFAULT 0,
  -- Payment
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue')),
  payment_method TEXT,
  payment_terms TEXT,
  -- Additional
  shipping_address JSONB,
  billing_address JSONB,
  notes TEXT,
  internal_notes TEXT,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(organization_id, order_number)
);

-- Sales order items
CREATE TABLE IF NOT EXISTS sales_order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES sales_orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  quantity DECIMAL(15,4) NOT NULL,
  unit_price DECIMAL(15,4) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  line_total DECIMAL(15,2) GENERATED ALWAYS AS (
    quantity * unit_price * (1 - discount_percent/100) * (1 + tax_rate/100)
  ) STORED,
  -- Batch/Serial tracking
  batch_number TEXT,
  serial_numbers TEXT[], -- for multiple serial numbers
  expiry_date DATE,
  notes TEXT
);

-- Purchase orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  order_number TEXT NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'confirmed', 'partial', 'received', 'cancelled')),
  order_date DATE DEFAULT CURRENT_DATE NOT NULL,
  expected_date DATE,
  received_date DATE,
  -- Financial
  subtotal DECIMAL(15,2) DEFAULT 0,
  tax_amount DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  shipping_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) DEFAULT 0,
  -- Payment
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid')),
  payment_method TEXT,
  payment_terms TEXT,
  -- Additional
  shipping_address JSONB,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(organization_id, order_number)
);

-- Purchase order items
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  quantity DECIMAL(15,4) NOT NULL,
  received_quantity DECIMAL(15,4) DEFAULT 0,
  unit_cost DECIMAL(15,4) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  line_total DECIMAL(15,2) GENERATED ALWAYS AS (
    quantity * unit_cost * (1 - discount_percent/100) * (1 + tax_rate/100)
  ) STORED,
  -- Batch/Serial tracking
  batch_number TEXT,
  expiry_date DATE,
  notes TEXT
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Organization indexes
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription ON organizations(subscription_status, subscription_plan);

-- Profile indexes
CREATE INDEX IF NOT EXISTS idx_profiles_org ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Multi-tenant data indexes (all include organization_id for tenant isolation)
CREATE INDEX IF NOT EXISTS idx_categories_org ON categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_org ON suppliers(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_org ON customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_org ON products(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_org_category ON products(organization_id, category_id);
CREATE INDEX IF NOT EXISTS idx_products_org_sku ON products(organization_id, sku);
CREATE INDEX IF NOT EXISTS idx_stock_movements_org ON stock_movements(organization_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_org_product ON stock_movements(organization_id, product_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_org ON sales_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_org_customer ON sales_orders(organization_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_org ON sales_order_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_org ON purchase_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_org_supplier ON purchase_orders(organization_id, supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_org ON purchase_order_items(organization_id);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updated_at
CREATE TRIGGER trigger_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trigger_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trigger_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trigger_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trigger_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trigger_sales_orders_updated_at BEFORE UPDATE ON sales_orders FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trigger_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Generate unique codes for suppliers/customers within organization
CREATE OR REPLACE FUNCTION generate_entity_code(org_id UUID, entity_type TEXT, prefix TEXT)
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  code TEXT;
BEGIN
  IF entity_type = 'supplier' THEN
    SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM '[0-9]+$') AS INTEGER)), 0) + 1 
    INTO next_num FROM suppliers WHERE organization_id = org_id AND code LIKE prefix || '%';
  ELSIF entity_type = 'customer' THEN
    SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM '[0-9]+$') AS INTEGER)), 0) + 1 
    INTO next_num FROM customers WHERE organization_id = org_id AND code LIKE prefix || '%';
  END IF;
  
  code := prefix || LPAD(next_num::TEXT, 3, '0');
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Generate order numbers within organization
CREATE OR REPLACE FUNCTION generate_order_number(org_id UUID, order_type TEXT)
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  prefix TEXT;
  order_num TEXT;
BEGIN
  -- Set prefix based on order type
  IF order_type = 'sale' THEN
    prefix := 'SO';
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '[0-9]+$') AS INTEGER)), 999) + 1 
    INTO next_num FROM sales_orders WHERE organization_id = org_id;
  ELSIF order_type = 'purchase' THEN
    prefix := 'PO';
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '[0-9]+$') AS INTEGER)), 999) + 1 
    INTO next_num FROM purchase_orders WHERE organization_id = org_id;
  END IF;
  
  order_num := prefix || LPAD(next_num::TEXT, 5, '0');
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Stock movement tracking for sales
CREATE OR REPLACE FUNCTION handle_sales_stock_movement()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Reduce stock
    UPDATE products 
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE id = NEW.product_id AND organization_id = NEW.organization_id;
    
    -- Log movement
    INSERT INTO stock_movements (
      organization_id, product_id, movement_type, quantity, 
      reference_type, reference_id, created_by
    ) VALUES (
      NEW.organization_id, NEW.product_id, 'out', NEW.quantity,
      'sale', NEW.order_id, 
      (SELECT created_by FROM sales_orders WHERE id = NEW.order_id)
    );
  
  ELSIF TG_OP = 'DELETE' THEN
    -- Restore stock
    UPDATE products 
    SET stock_quantity = stock_quantity + OLD.quantity
    WHERE id = OLD.product_id AND organization_id = OLD.organization_id;
    
    -- Log movement
    INSERT INTO stock_movements (
      organization_id, product_id, movement_type, quantity,
      reference_type, reference_id, notes
    ) VALUES (
      OLD.organization_id, OLD.product_id, 'in', OLD.quantity,
      'return', OLD.order_id, 'Sale cancelled'
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sales_stock_movement
  AFTER INSERT OR DELETE ON sales_order_items
  FOR EACH ROW EXECUTE FUNCTION handle_sales_stock_movement();

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Create a demo organization
INSERT INTO organizations (name, slug, description, subscription_plan) VALUES
('Demo Company', 'demo-company', 'Demo organization for testing', 'business')
ON CONFLICT DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🏢 Multi-tenant schema created successfully!';
    RAISE NOTICE '🔒 Complete data isolation between organizations';
    RAISE NOTICE '📊 Ready for multiple businesses on one platform';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Next: Run the RLS policies script';
END
$$;
