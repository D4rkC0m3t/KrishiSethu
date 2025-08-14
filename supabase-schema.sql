-- Krishisethu Inventory Management - Supabase Database Schema
-- This script creates all necessary tables for the inventory management system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'staff');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'upi', 'credit', 'bank_transfer');
CREATE TYPE payment_status AS ENUM ('paid', 'pending', 'partial', 'overdue');
CREATE TYPE transaction_status AS ENUM ('completed', 'pending', 'cancelled', 'refunded');
CREATE TYPE product_type AS ENUM ('Chemical', 'Organic', 'Bio-fertilizer', 'Liquid', 'Granular');

-- 1. Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role user_role DEFAULT 'staff',
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Categories table
CREATE TABLE public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    parent_category UUID REFERENCES categories(id),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Brands table
CREATE TABLE public.brands (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Suppliers table
CREATE TABLE public.suppliers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address JSONB, -- {street, city, state, pincode, country}
    gst_number TEXT,
    pan_number TEXT,
    payment_terms TEXT DEFAULT '30 days',
    credit_limit DECIMAL(12,2) DEFAULT 0,
    outstanding_amount DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Customers table
CREATE TABLE public.customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address JSONB, -- {street, city, state, pincode, country}
    gst_number TEXT,
    credit_limit DECIMAL(12,2) DEFAULT 0,
    outstanding_amount DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Products table
CREATE TABLE public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE, -- Product code/SKU
    type product_type DEFAULT 'Chemical',
    category_id UUID REFERENCES categories(id),
    brand_id UUID REFERENCES brands(id),
    supplier_id UUID REFERENCES suppliers(id),
    description TEXT,
    composition JSONB, -- {nitrogen: 20, phosphorus: 20, potassium: 20}
    
    -- Inventory details
    quantity DECIMAL(10,2) DEFAULT 0,
    unit TEXT DEFAULT 'kg', -- kg, bags, liters, etc.
    min_stock_level DECIMAL(10,2) DEFAULT 0,
    max_stock_level DECIMAL(10,2) DEFAULT 0,
    reorder_point DECIMAL(10,2) DEFAULT 0,
    
    -- Pricing
    purchase_price DECIMAL(10,2) DEFAULT 0,
    sale_price DECIMAL(10,2) DEFAULT 0,
    mrp DECIMAL(10,2) DEFAULT 0,
    
    -- Batch tracking
    batch_no TEXT,
    expiry_date DATE,
    manufacturing_date DATE,
    
    -- Tax and compliance
    hsn_code TEXT DEFAULT '31051000',
    gst_rate DECIMAL(5,2) DEFAULT 5.00,
    
    -- Additional fields
    barcode TEXT,
    location TEXT, -- Warehouse location
    tags TEXT[], -- Array of tags
    image_urls TEXT[], -- Array of image URLs
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Sales table
CREATE TABLE public.sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sale_number TEXT UNIQUE NOT NULL, -- Auto-generated: INV-2024-0001
    customer_id UUID REFERENCES customers(id),
    customer_name TEXT NOT NULL,
    
    -- Financial details
    subtotal DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    
    -- Payment details
    payment_method payment_method DEFAULT 'cash',
    amount_paid DECIMAL(12,2) DEFAULT 0,
    change_due DECIMAL(12,2) DEFAULT 0,
    payment_status payment_status DEFAULT 'completed',
    
    -- Transaction details
    status transaction_status DEFAULT 'completed',
    notes TEXT,
    created_by UUID REFERENCES users(id),
    sale_date DATE DEFAULT CURRENT_DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Sale items table
CREATE TABLE public.sale_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name TEXT NOT NULL,
    product_code TEXT,
    
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    
    batch_no TEXT,
    hsn_code TEXT,
    gst_rate DECIMAL(5,2) DEFAULT 5.00,
    gst_amount DECIMAL(10,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Purchases table
CREATE TABLE public.purchases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    purchase_number TEXT UNIQUE NOT NULL, -- Auto-generated: PUR-2024-0001
    supplier_id UUID REFERENCES suppliers(id),
    supplier_name TEXT NOT NULL,
    
    -- Financial details
    subtotal DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    
    -- Payment details
    payment_status payment_status DEFAULT 'pending',
    amount_paid DECIMAL(12,2) DEFAULT 0,
    balance_amount DECIMAL(12,2) DEFAULT 0,
    
    -- Document details
    invoice_number TEXT,
    invoice_date DATE,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    purchase_date DATE DEFAULT CURRENT_DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Purchase items table
CREATE TABLE public.purchase_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name TEXT NOT NULL,
    
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    
    batch_no TEXT,
    expiry_date DATE,
    manufacturing_date DATE,
    hsn_code TEXT,
    gst_rate DECIMAL(5,2) DEFAULT 5.00,
    gst_amount DECIMAL(10,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Stock movements table (for inventory tracking)
CREATE TABLE public.stock_movements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id),
    movement_type TEXT NOT NULL, -- 'in', 'out', 'adjustment', 'transfer'
    quantity DECIMAL(10,2) NOT NULL, -- Positive for in, negative for out
    reference_type TEXT, -- 'sale', 'purchase', 'adjustment', 'return'
    reference_id UUID, -- ID of the related transaction
    batch_no TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    movement_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Settings table
CREATE TABLE public.settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Audit logs table
CREATE TABLE public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES users(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_low_stock ON products(quantity, min_stock_level);

CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_created_by ON sales(created_by);

CREATE INDEX idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX idx_purchases_date ON purchases(purchase_date);
CREATE INDEX idx_purchases_status ON purchases(payment_status);

CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(movement_date);
CREATE INDEX idx_stock_movements_type ON stock_movements(movement_type);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON purchases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: Users can read their own data, admins can read all
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update users" ON users FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Categories: All authenticated users can read, admins/managers can modify
CREATE POLICY "Anyone can view categories" ON categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage categories" ON categories FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Brands: All authenticated users can read, admins/managers can modify
CREATE POLICY "Anyone can view brands" ON brands FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage brands" ON brands FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Suppliers: All authenticated users can read, admins/managers can modify
CREATE POLICY "Anyone can view suppliers" ON suppliers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage suppliers" ON suppliers FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Customers: All authenticated users can read, admins/managers can modify
CREATE POLICY "Anyone can view customers" ON customers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage customers" ON customers FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Products: All authenticated users can read, admins/managers can modify
CREATE POLICY "Anyone can view products" ON products FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage products" ON products FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Sales: All authenticated users can read, all can create, admins/managers can modify
CREATE POLICY "Anyone can view sales" ON sales FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Anyone can create sales" ON sales FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins can update sales" ON sales FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Sale items: Follow sales permissions
CREATE POLICY "Anyone can view sale items" ON sale_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Anyone can create sale items" ON sale_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Purchases: All authenticated users can read, admins/managers can modify
CREATE POLICY "Anyone can view purchases" ON purchases FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage purchases" ON purchases FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Purchase items: Follow purchases permissions
CREATE POLICY "Anyone can view purchase items" ON purchase_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage purchase items" ON purchase_items FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager'))
);

-- Stock movements: All authenticated users can read, all can create
CREATE POLICY "Anyone can view stock movements" ON stock_movements FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Anyone can create stock movements" ON stock_movements FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Settings: All can read, admins can modify
CREATE POLICY "Anyone can view settings" ON settings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage settings" ON settings FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Audit logs: Admins only
CREATE POLICY "Admins can view audit logs" ON audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Create storage bucket policies (to be applied in Supabase dashboard)
-- Bucket: product-images
-- Policy: Authenticated users can upload, everyone can view
