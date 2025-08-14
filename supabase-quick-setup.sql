-- Krishisethu Inventory Management - Quick Setup (No Errors)
-- Copy and paste this entire script into Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create brands table
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address JSONB,
    gst_number TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address JSONB,
    credit_limit DECIMAL(12,2) DEFAULT 0,
    outstanding_amount DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    type TEXT DEFAULT 'Chemical',
    category_id UUID REFERENCES categories(id),
    brand_id UUID REFERENCES brands(id),
    supplier_id UUID REFERENCES suppliers(id),
    description TEXT,
    composition JSONB,
    quantity DECIMAL(10,2) DEFAULT 0,
    unit TEXT DEFAULT 'kg',
    min_stock_level DECIMAL(10,2) DEFAULT 0,
    purchase_price DECIMAL(10,2) DEFAULT 0,
    sale_price DECIMAL(10,2) DEFAULT 0,
    batch_no TEXT,
    expiry_date DATE,
    hsn_code TEXT DEFAULT '31051000',
    gst_rate DECIMAL(5,2) DEFAULT 5.00,
    barcode TEXT,
    location TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales table
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sale_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    customer_name TEXT NOT NULL,
    subtotal DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    payment_method TEXT DEFAULT 'cash',
    amount_paid DECIMAL(12,2) DEFAULT 0,
    status TEXT DEFAULT 'completed',
    notes TEXT,
    sale_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sale_items table
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchases table
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    purchase_number TEXT UNIQUE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id),
    supplier_name TEXT NOT NULL,
    subtotal DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    payment_status TEXT DEFAULT 'pending',
    amount_paid DECIMAL(12,2) DEFAULT 0,
    purchase_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchase_items table
CREATE TABLE IF NOT EXISTS public.purchase_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stock_movements table
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id),
    movement_type TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    reference_type TEXT,
    reference_id UUID,
    notes TEXT,
    movement_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create settings table
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table (for user profiles)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'staff',
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample categories
INSERT INTO categories (name, description, sort_order) VALUES
('NPK Fertilizers', 'Nitrogen, Phosphorus, Potassium fertilizers', 1),
('Nitrogen Fertilizers', 'High nitrogen content fertilizers', 2),
('Phosphorus Fertilizers', 'Phosphorus-rich fertilizers for root development', 3),
('Organic Fertilizers', 'Natural and organic fertilizers', 4),
('Micronutrients', 'Essential micronutrients for plant growth', 5)
ON CONFLICT (name) DO NOTHING;

-- Insert sample brands
INSERT INTO brands (name, description) VALUES
('Tata Chemicals', 'Leading chemical fertilizer manufacturer'),
('IFFCO', 'Indian Farmers Fertiliser Cooperative Limited'),
('Coromandel', 'Premium fertilizer and crop protection solutions'),
('Green Gold', 'Organic and bio-fertilizer specialist'),
('FarmGrow', 'Agricultural input solutions')
ON CONFLICT (name) DO NOTHING;

-- Insert sample suppliers
INSERT INTO suppliers (name, contact_person, phone, email, address, gst_number) VALUES
(
    'Tata Chemicals Ltd',
    'Rajesh Kumar',
    '+91-9876543210',
    'rajesh@tatachemicals.com',
    '{"street": "123 Industrial Area", "city": "Mumbai", "state": "Maharashtra", "pincode": "400001"}',
    '27AAAAA0000A1Z5'
),
(
    'IFFCO Distribution',
    'Suresh Sharma', 
    '+91-9876543211',
    'suresh@iffco.com',
    '{"street": "456 Agricultural Complex", "city": "Delhi", "state": "Delhi", "pincode": "110001"}',
    '07BBBBB1111B2Z6'
)
ON CONFLICT (name) DO NOTHING;

-- Insert sample customers
INSERT INTO customers (name, phone, email, address, credit_limit) VALUES
(
    'Ramesh Kumar',
    '+91-9876543220',
    'ramesh@farmer.com',
    '{"street": "Village Rampur", "city": "Rampur", "state": "Uttar Pradesh", "pincode": "244901"}',
    50000.00
),
(
    'Sunita Devi',
    '+91-9876543221',
    'sunita@farmer.com',
    '{"street": "Village Krishnapur", "city": "Krishnapur", "state": "Bihar", "pincode": "800001"}',
    25000.00
)
ON CONFLICT (name) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, code, type, category_id, brand_id, supplier_id, description, composition, quantity, purchase_price, sale_price, batch_no, expiry_date) VALUES
(
    'NPK 20-20-20',
    'NPK-202020-001',
    'Chemical',
    (SELECT id FROM categories WHERE name = 'NPK Fertilizers' LIMIT 1),
    (SELECT id FROM brands WHERE name = 'Tata Chemicals' LIMIT 1),
    (SELECT id FROM suppliers WHERE name = 'Tata Chemicals Ltd' LIMIT 1),
    'Balanced NPK fertilizer for all crops',
    '{"nitrogen": 20, "phosphorus": 20, "potassium": 20}',
    100,
    850.00,
    950.00,
    'TC2024001',
    '2025-12-31'
),
(
    'Urea',
    'UREA-001',
    'Chemical',
    (SELECT id FROM categories WHERE name = 'Nitrogen Fertilizers' LIMIT 1),
    (SELECT id FROM brands WHERE name = 'IFFCO' LIMIT 1),
    (SELECT id FROM suppliers WHERE name = 'IFFCO Distribution' LIMIT 1),
    'High quality urea for nitrogen supply',
    '{"nitrogen": 46, "phosphorus": 0, "potassium": 0}',
    200,
    280.00,
    320.00,
    'IF2024002',
    '2026-06-30'
),
(
    'Organic Compost',
    'COMPOST-001',
    'Organic',
    (SELECT id FROM categories WHERE name = 'Organic Fertilizers' LIMIT 1),
    (SELECT id FROM brands WHERE name = 'Green Gold' LIMIT 1),
    (SELECT id FROM suppliers WHERE name = 'Tata Chemicals Ltd' LIMIT 1),
    'Premium organic compost for soil enrichment',
    '{"nitrogen": 1.5, "phosphorus": 1.0, "potassium": 1.5}',
    60,
    150.00,
    200.00,
    'GG2024005',
    '2025-08-15'
)
ON CONFLICT (code) DO NOTHING;

-- Insert system settings
INSERT INTO settings (key, value, description) VALUES
(
    'company_info',
    '{
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
    }',
    'Company information and contact details'
),
(
    'inventory_settings',
    '{
        "low_stock_threshold": 10,
        "barcode_enabled": true,
        "track_batches": true,
        "track_expiry": true
    }',
    'Inventory management settings'
)
ON CONFLICT (key) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);

-- Enable Row Level Security (but don't create policies yet)
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
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Disable RLS temporarily for testing (you can enable it later)
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
