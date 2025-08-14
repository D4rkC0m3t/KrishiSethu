-- Krishisethu Inventory Management - Simple Supabase Setup
-- Run this script in Supabase SQL Editor to create all tables and data

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'manager', 'staff');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('cash', 'card', 'upi', 'credit', 'bank_transfer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('paid', 'pending', 'partial', 'overdue');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('completed', 'pending', 'cancelled', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE product_type AS ENUM ('Chemical', 'Organic', 'Bio-fertilizer', 'Liquid', 'Granular');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
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
CREATE TABLE IF NOT EXISTS public.categories (
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
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address JSONB,
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
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address JSONB,
    gst_number TEXT,
    credit_limit DECIMAL(12,2) DEFAULT 0,
    outstanding_amount DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    type product_type DEFAULT 'Chemical',
    category_id UUID REFERENCES categories(id),
    brand_id UUID REFERENCES brands(id),
    supplier_id UUID REFERENCES suppliers(id),
    description TEXT,
    composition JSONB,
    quantity DECIMAL(10,2) DEFAULT 0,
    unit TEXT DEFAULT 'kg',
    min_stock_level DECIMAL(10,2) DEFAULT 0,
    max_stock_level DECIMAL(10,2) DEFAULT 0,
    reorder_point DECIMAL(10,2) DEFAULT 0,
    purchase_price DECIMAL(10,2) DEFAULT 0,
    sale_price DECIMAL(10,2) DEFAULT 0,
    mrp DECIMAL(10,2) DEFAULT 0,
    batch_no TEXT,
    expiry_date DATE,
    manufacturing_date DATE,
    hsn_code TEXT DEFAULT '31051000',
    gst_rate DECIMAL(5,2) DEFAULT 5.00,
    barcode TEXT,
    location TEXT,
    tags TEXT[],
    image_urls TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Sales table
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sale_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    customer_name TEXT NOT NULL,
    subtotal DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    payment_method payment_method DEFAULT 'cash',
    amount_paid DECIMAL(12,2) DEFAULT 0,
    change_due DECIMAL(12,2) DEFAULT 0,
    payment_status payment_status DEFAULT 'paid',
    status transaction_status DEFAULT 'completed',
    notes TEXT,
    created_by UUID REFERENCES users(id),
    sale_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Sale items table
CREATE TABLE IF NOT EXISTS public.sale_items (
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
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    purchase_number TEXT UNIQUE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id),
    supplier_name TEXT NOT NULL,
    subtotal DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    payment_status payment_status DEFAULT 'pending',
    amount_paid DECIMAL(12,2) DEFAULT 0,
    balance_amount DECIMAL(12,2) DEFAULT 0,
    invoice_number TEXT,
    invoice_date DATE,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    purchase_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Purchase items table
CREATE TABLE IF NOT EXISTS public.purchase_items (
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

-- 11. Stock movements table
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id),
    movement_type TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    reference_type TEXT,
    reference_id UUID,
    batch_no TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    movement_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Settings table
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES users(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);

-- Insert sample data
-- Insert categories (avoid duplicates)
INSERT INTO categories (name, description, sort_order)
SELECT 'NPK Fertilizers', 'Nitrogen, Phosphorus, Potassium fertilizers', 1
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'NPK Fertilizers');

INSERT INTO categories (name, description, sort_order)
SELECT 'Nitrogen Fertilizers', 'High nitrogen content fertilizers', 2
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Nitrogen Fertilizers');

INSERT INTO categories (name, description, sort_order)
SELECT 'Phosphorus Fertilizers', 'Phosphorus-rich fertilizers for root development', 3
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Phosphorus Fertilizers');

INSERT INTO categories (name, description, sort_order)
SELECT 'Organic Fertilizers', 'Natural and organic fertilizers', 5
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Organic Fertilizers');

INSERT INTO categories (name, description, sort_order)
SELECT 'Micronutrients', 'Essential micronutrients for plant growth', 6
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Micronutrients');

-- Insert brands (avoid duplicates)
INSERT INTO brands (name, description)
SELECT 'Tata Chemicals', 'Leading chemical fertilizer manufacturer'
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE name = 'Tata Chemicals');

INSERT INTO brands (name, description)
SELECT 'IFFCO', 'Indian Farmers Fertiliser Cooperative Limited'
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE name = 'IFFCO');

INSERT INTO brands (name, description)
SELECT 'Coromandel', 'Premium fertilizer and crop protection solutions'
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE name = 'Coromandel');

INSERT INTO brands (name, description)
SELECT 'Green Gold', 'Organic and bio-fertilizer specialist'
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE name = 'Green Gold');

-- Insert suppliers (avoid duplicates)
INSERT INTO suppliers (name, contact_person, phone, email, address, gst_number)
SELECT 'Tata Chemicals Ltd', 'Rajesh Kumar', '+91-9876543210', 'rajesh@tatachemicals.com',
       '{"street": "123 Industrial Area", "city": "Mumbai", "state": "Maharashtra", "pincode": "400001"}', '27AAAAA0000A1Z5'
WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'Tata Chemicals Ltd');

INSERT INTO suppliers (name, contact_person, phone, email, address, gst_number)
SELECT 'IFFCO Distribution', 'Suresh Sharma', '+91-9876543211', 'suresh@iffco.com',
       '{"street": "456 Agricultural Complex", "city": "Delhi", "state": "Delhi", "pincode": "110001"}', '07BBBBB1111B2Z6'
WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'IFFCO Distribution');

-- Insert sample products (avoid duplicates)
INSERT INTO products (name, code, type, category_id, brand_id, supplier_id, description, composition, quantity, purchase_price, sale_price, batch_no, expiry_date)
SELECT 'NPK 20-20-20', 'NPK-202020-001', 'Chemical',
       (SELECT id FROM categories WHERE name = 'NPK Fertilizers' LIMIT 1),
       (SELECT id FROM brands WHERE name = 'Tata Chemicals' LIMIT 1),
       (SELECT id FROM suppliers WHERE name = 'Tata Chemicals Ltd' LIMIT 1),
       'Balanced NPK fertilizer for all crops',
       '{"nitrogen": 20, "phosphorus": 20, "potassium": 20}',
       100, 850.00, 950.00, 'TC2024001', '2025-12-31'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE code = 'NPK-202020-001');

INSERT INTO products (name, code, type, category_id, brand_id, supplier_id, description, composition, quantity, purchase_price, sale_price, batch_no, expiry_date)
SELECT 'Urea', 'UREA-001', 'Chemical',
       (SELECT id FROM categories WHERE name = 'Nitrogen Fertilizers' LIMIT 1),
       (SELECT id FROM brands WHERE name = 'IFFCO' LIMIT 1),
       (SELECT id FROM suppliers WHERE name = 'IFFCO Distribution' LIMIT 1),
       'High quality urea for nitrogen supply',
       '{"nitrogen": 46, "phosphorus": 0, "potassium": 0}',
       200, 280.00, 320.00, 'IF2024002', '2026-06-30'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE code = 'UREA-001');

INSERT INTO products (name, code, type, category_id, brand_id, supplier_id, description, composition, quantity, purchase_price, sale_price, batch_no, expiry_date)
SELECT 'Organic Compost', 'COMPOST-001', 'Organic',
       (SELECT id FROM categories WHERE name = 'Organic Fertilizers' LIMIT 1),
       (SELECT id FROM brands WHERE name = 'Green Gold' LIMIT 1),
       (SELECT id FROM suppliers WHERE name = 'Tata Chemicals Ltd' LIMIT 1),
       'Premium organic compost for soil enrichment',
       '{"nitrogen": 1.5, "phosphorus": 1.0, "potassium": 1.5}',
       60, 150.00, 200.00, 'GG2024005', '2025-08-15'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE code = 'COMPOST-001');

-- Enable Row Level Security
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

-- Create basic RLS policies (allow all for authenticated users)
-- Drop existing policies first (ignore errors if they don't exist)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow all for authenticated users" ON categories;
    DROP POLICY IF EXISTS "Allow all for authenticated users" ON brands;
    DROP POLICY IF EXISTS "Allow all for authenticated users" ON suppliers;
    DROP POLICY IF EXISTS "Allow all for authenticated users" ON customers;
    DROP POLICY IF EXISTS "Allow all for authenticated users" ON products;
    DROP POLICY IF EXISTS "Allow all for authenticated users" ON sales;
    DROP POLICY IF EXISTS "Allow all for authenticated users" ON sale_items;
    DROP POLICY IF EXISTS "Allow all for authenticated users" ON purchases;
    DROP POLICY IF EXISTS "Allow all for authenticated users" ON purchase_items;
    DROP POLICY IF EXISTS "Allow all for authenticated users" ON stock_movements;
    DROP POLICY IF EXISTS "Allow all for authenticated users" ON settings;
    DROP POLICY IF EXISTS "Allow all for authenticated users" ON users;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Disable RLS for testing (no authentication required)
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Add some sample customers for testing
INSERT INTO customers (name, phone, email, address, credit_limit)
SELECT 'Ramesh Kumar', '+91-9876543220', 'ramesh@farmer.com', '{"street": "Village Rampur", "city": "Rampur", "state": "Uttar Pradesh", "pincode": "244901"}', 50000.00
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'Ramesh Kumar');

INSERT INTO customers (name, phone, email, address, credit_limit)
SELECT 'Sunita Devi', '+91-9876543221', 'sunita@farmer.com', '{"street": "Village Krishnapur", "city": "Krishnapur", "state": "Bihar", "pincode": "800001"}', 25000.00
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE name = 'Sunita Devi');

-- Add system settings
INSERT INTO settings (key, value, description)
SELECT 'company_info', '{
    "name": "Krishisethu Fertilizers",
    "address": {
        "street": "123 Agricultural Complex",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001"
    },
    "phone": "+91-9876543210",
    "email": "info@krishisethu.com",
    "gst_number": "27AAAAA0000A1Z5"
}', 'Company information and contact details'
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'company_info');

INSERT INTO settings (key, value, description)
SELECT 'inventory_settings', '{
    "low_stock_threshold": 10,
    "barcode_enabled": true,
    "track_batches": true,
    "track_expiry": true
}', 'Inventory management settings'
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'inventory_settings');

-- Create storage buckets (if they don't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'product-images', 'product-images', true, 10485760, ARRAY['image/*']
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'product-images');

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'documents', 'documents', false, 20971520, ARRAY['application/pdf', 'image/*']
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'documents');

-- Temporarily disable RLS on storage for testing
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;
