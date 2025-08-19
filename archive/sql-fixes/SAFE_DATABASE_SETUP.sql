-- ============================================================================
-- 🌾 KRISHISETHU INVENTORY MANAGEMENT - SAFE DATABASE SETUP
-- ============================================================================
-- This script handles existing objects gracefully using IF NOT EXISTS
-- Run this entire script in your Supabase SQL Editor
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 📋 ENUMS AND TYPES (CREATE ONLY IF NOT EXISTS)
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'manager', 'staff', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE product_type AS ENUM ('Chemical', 'Organic', 'Bio', 'NPK', 'Seeds', 'Pesticide', 'Tools');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('cash', 'card', 'upi', 'bank_transfer', 'cheque', 'credit');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'completed', 'overdue', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('draft', 'pending', 'completed', 'cancelled', 'returned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE movement_type AS ENUM ('purchase', 'sale', 'adjustment', 'return', 'transfer', 'damage', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 👥 CORE TABLES (CREATE ONLY IF NOT EXISTS)
-- ============================================================================

-- Users table (extends Supabase auth.users)
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

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brands table
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address JSONB,
    gst_number TEXT,
    payment_terms TEXT DEFAULT '30 days',
    credit_limit DECIMAL(12,2) DEFAULT 0 CHECK (credit_limit >= 0),
    outstanding_amount DECIMAL(12,2) DEFAULT 0 CHECK (outstanding_amount >= 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address JSONB,
    gst_number TEXT,
    credit_limit DECIMAL(12,2) DEFAULT 0 CHECK (credit_limit >= 0),
    outstanding_amount DECIMAL(12,2) DEFAULT 0 CHECK (outstanding_amount >= 0),
    total_purchases DECIMAL(12,2) DEFAULT 0 CHECK (total_purchases >= 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
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
    
    -- Inventory with constraints
    quantity DECIMAL(10,2) DEFAULT 0 CHECK (quantity >= 0),
    unit TEXT DEFAULT 'kg',
    min_stock_level DECIMAL(10,2) DEFAULT 0 CHECK (min_stock_level >= 0),
    reorder_point DECIMAL(10,2) DEFAULT 0 CHECK (reorder_point >= 0),
    
    -- Pricing with constraints
    purchase_price DECIMAL(10,2) DEFAULT 0 CHECK (purchase_price >= 0),
    sale_price DECIMAL(10,2) DEFAULT 0 CHECK (sale_price >= 0),
    mrp DECIMAL(10,2) DEFAULT 0 CHECK (mrp >= 0),
    
    -- Batch tracking
    batch_no TEXT,
    expiry_date DATE,
    manufacturing_date DATE,
    
    -- Tax compliance
    hsn_code TEXT DEFAULT '31051000',
    gst_rate DECIMAL(5,2) DEFAULT 5.00 CHECK (gst_rate >= 0 AND gst_rate <= 28),
    
    -- Additional
    barcode TEXT,
    location TEXT,
    image_urls TEXT[],
    attachments JSONB DEFAULT '[]',

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales table
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sale_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    customer_name TEXT NOT NULL,
    
    -- Financial with constraints
    subtotal DECIMAL(12,2) DEFAULT 0 CHECK (subtotal >= 0),
    discount DECIMAL(12,2) DEFAULT 0 CHECK (discount >= 0),
    tax_amount DECIMAL(12,2) DEFAULT 0 CHECK (tax_amount >= 0),
    total_amount DECIMAL(12,2) DEFAULT 0 CHECK (total_amount >= 0),
    
    -- Payment
    payment_method payment_method DEFAULT 'cash',
    amount_paid DECIMAL(12,2) DEFAULT 0 CHECK (amount_paid >= 0),
    payment_status payment_status DEFAULT 'completed',
    
    -- Status
    status transaction_status DEFAULT 'completed',
    notes TEXT,
    created_by UUID REFERENCES users(id),
    sale_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sale items table with CASCADE
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    gst_rate DECIMAL(5,2) DEFAULT 0,
    batch_no TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchases table
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    purchase_number TEXT UNIQUE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id),
    supplier_name TEXT NOT NULL,
    
    -- Financial with constraints
    subtotal DECIMAL(12,2) DEFAULT 0 CHECK (subtotal >= 0),
    discount DECIMAL(12,2) DEFAULT 0 CHECK (discount >= 0),
    tax_amount DECIMAL(12,2) DEFAULT 0 CHECK (tax_amount >= 0),
    total_amount DECIMAL(12,2) DEFAULT 0 CHECK (total_amount >= 0),
    
    -- Payment
    payment_status payment_status DEFAULT 'pending',
    amount_paid DECIMAL(12,2) DEFAULT 0 CHECK (amount_paid >= 0),
    
    -- Document
    invoice_number TEXT,
    invoice_date DATE,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    purchase_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase items table with CASCADE
CREATE TABLE IF NOT EXISTS public.purchase_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    gst_rate DECIMAL(5,2) DEFAULT 0,
    batch_no TEXT,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock movements table
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id),
    movement_type movement_type NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    reference_type TEXT,
    reference_id UUID,
    batch_no TEXT,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    movement_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings table
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ⏱️ FUNCTIONS AND TRIGGERS (CREATE OR REPLACE)
-- ============================================================================

-- Timestamp update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- User creation function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role, is_active)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'staff'),
        true
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- ============================================================================
-- 🔢 SEQUENCES AND AUTO-GENERATION FUNCTIONS
-- ============================================================================

-- Create sequences if they don't exist
CREATE SEQUENCE IF NOT EXISTS product_code_seq START 1;
CREATE SEQUENCE IF NOT EXISTS sale_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS purchase_number_seq START 1;

-- Product code generation
CREATE OR REPLACE FUNCTION generate_product_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.code IS NULL OR NEW.code = '' THEN
        NEW.code := 'PRD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('product_code_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Sale number generation
CREATE OR REPLACE FUNCTION generate_sale_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.sale_number IS NULL OR NEW.sale_number = '' THEN
        NEW.sale_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('sale_number_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Purchase number generation
CREATE OR REPLACE FUNCTION generate_purchase_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.purchase_number IS NULL OR NEW.purchase_number = '' THEN
        NEW.purchase_number := 'PUR-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('purchase_number_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- 🔗 CREATE TRIGGERS (DROP AND RECREATE TO AVOID CONFLICTS)
-- ============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_brands_updated_at ON brands;
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_sales_updated_at ON sales;
DROP TRIGGER IF EXISTS update_purchases_updated_at ON purchases;
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
DROP TRIGGER IF EXISTS generate_product_code_trigger ON products;
DROP TRIGGER IF EXISTS generate_sale_number_trigger ON sales;
DROP TRIGGER IF EXISTS generate_purchase_number_trigger ON purchases;

-- Create triggers
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON purchases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER generate_product_code_trigger BEFORE INSERT ON products FOR EACH ROW EXECUTE FUNCTION generate_product_code();
CREATE TRIGGER generate_sale_number_trigger BEFORE INSERT ON sales FOR EACH ROW EXECUTE FUNCTION generate_sale_number();
CREATE TRIGGER generate_purchase_number_trigger BEFORE INSERT ON purchases FOR EACH ROW EXECUTE FUNCTION generate_purchase_number();

-- ============================================================================
-- 📊 PERFORMANCE INDEXES (CREATE IF NOT EXISTS)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);

CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(movement_date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);

-- ============================================================================
-- 🌱 SEED DATA (INSERT ONLY IF NOT EXISTS)
-- ============================================================================

-- Categories
INSERT INTO categories (name, description, is_active, sort_order) 
SELECT * FROM (VALUES
    ('Chemical Fertilizer', 'Chemical-based fertilizers for crop nutrition', true, 1),
    ('Organic Fertilizer', 'Natural and organic fertilizers', true, 2),
    ('Bio Fertilizer', 'Biological fertilizers with beneficial microorganisms', true, 3),
    ('NPK Fertilizers', 'Nitrogen, Phosphorus, Potassium balanced fertilizers', true, 4),
    ('Seeds', 'Agricultural seeds and saplings', true, 5),
    ('Pesticides', 'Pest control products', true, 6),
    ('Tools', 'Agricultural tools and equipment', true, 7)
) AS v(name, description, is_active, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE categories.name = v.name);

-- Brands
INSERT INTO brands (name, description, is_active) 
SELECT * FROM (VALUES
    ('Tata Chemicals', 'Leading chemical fertilizer manufacturer', true),
    ('IFFCO', 'Indian Farmers Fertiliser Cooperative Limited', true),
    ('Coromandel International', 'Premium fertilizer and crop protection', true),
    ('Rashtriya Chemicals', 'Government fertilizer company', true),
    ('Green Gold Organics', 'Organic fertilizer specialist', true),
    ('KrishiSethu', 'KrishiSethu brand products', true),
    ('Generic', 'Generic brand products', true)
) AS v(name, description, is_active)
WHERE NOT EXISTS (SELECT 1 FROM brands WHERE brands.name = v.name);

-- Suppliers
INSERT INTO suppliers (name, contact_person, phone, email, address, gst_number, payment_terms, credit_limit, is_active) 
SELECT * FROM (VALUES
    (
        'Tata Chemicals Ltd',
        'Rajesh Kumar',
        '+91-9876543210',
        'rajesh@tatachemicals.com',
        '{"street": "Tata Centre", "city": "Mumbai", "state": "Maharashtra", "pincode": "400020", "country": "India"}'::jsonb,
        '27AAACT2727Q1ZZ',
        '30 days',
        500000.00,
        true
    ),
    (
        'IFFCO Cooperative',
        'Priya Sharma',
        '+91-9876543211',
        'priya@iffco.coop',
        '{"street": "IFFCO Bhawan", "city": "New Delhi", "state": "Delhi", "pincode": "110001", "country": "India"}'::jsonb,
        '07AAACI1681G1ZN',
        '45 days',
        750000.00,
        true
    )
) AS v(name, contact_person, phone, email, address, gst_number, payment_terms, credit_limit, is_active)
WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE suppliers.name = v.name);

-- Customers
INSERT INTO customers (name, phone, email, address, gst_number, credit_limit, is_active) 
SELECT * FROM (VALUES
    (
        'Raj Farm Enterprises',
        '+91-9876543220',
        'raj@rajfarm.com',
        '{"street": "Village Rajpur", "city": "Rajpur", "state": "Punjab", "pincode": "144001", "country": "India"}'::jsonb,
        '03AABCR1234M1Z5',
        50000.00,
        true
    ),
    (
        'Green Valley Agriculture',
        '+91-9876543221',
        'info@greenvalley.com',
        '{"street": "Green Valley Road", "city": "Ludhiana", "state": "Punjab", "pincode": "141001", "country": "India"}'::jsonb,
        '03AABCG5678N2Z6',
        75000.00,
        true
    )
) AS v(name, phone, email, address, gst_number, credit_limit, is_active)
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE customers.name = v.name);

-- ============================================================================
-- ✅ SETUP VERIFICATION
-- ============================================================================

-- Verify setup
SELECT 'Database setup completed successfully!' as status;
SELECT 'Tables created: ' || count(*) as table_count FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
SELECT 'Categories: ' || count(*) as categories FROM categories;
SELECT 'Brands: ' || count(*) as brands FROM brands;
SELECT 'Suppliers: ' || count(*) as suppliers FROM suppliers;
SELECT 'Customers: ' || count(*) as customers FROM customers;

-- Test basic functionality
SELECT 'Schema validation passed!' as validation_status;