-- Setup Products Table for Inventory Management
-- This script ensures the products table is properly configured

-- 1. Create products table if it doesn't exist
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    brand TEXT,
    sku TEXT UNIQUE,
    barcode TEXT,
    
    -- Pricing
    unit_price DECIMAL(10,2) DEFAULT 0,
    sale_price DECIMAL(10,2) DEFAULT 0,
    purchase_price DECIMAL(10,2) DEFAULT 0,
    
    -- Inventory
    quantity INTEGER DEFAULT 0,
    unit TEXT DEFAULT 'piece',
    reorder_level INTEGER DEFAULT 10,
    reorder_quantity INTEGER DEFAULT 50,
    
    -- Additional Info
    supplier TEXT,
    expiry_date DATE,
    batch_no TEXT,
    location TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- User tracking
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- 2. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_products_updated_at();

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_quantity ON products(quantity);
CREATE INDEX IF NOT EXISTS idx_products_expiry_date ON products(expiry_date);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for products table
-- Policy: Users can read all products
DROP POLICY IF EXISTS "Users can read products" ON products;
CREATE POLICY "Users can read products" ON products
    FOR SELECT USING (true);

-- Policy: Authenticated users can insert products
DROP POLICY IF EXISTS "Authenticated users can insert products" ON products;
CREATE POLICY "Authenticated users can insert products" ON products
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: Users can update products
DROP POLICY IF EXISTS "Authenticated users can update products" ON products;
CREATE POLICY "Authenticated users can update products" ON products
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy: Admins can delete products
DROP POLICY IF EXISTS "Admins can delete products" ON products;
CREATE POLICY "Admins can delete products" ON products
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 6. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE products TO authenticated;

-- 7. Insert sample products for testing (only if table is empty)
INSERT INTO products (
    name, description, category, brand, sku, 
    unit_price, sale_price, purchase_price,
    quantity, unit, reorder_level,
    supplier, status
) 
SELECT * FROM (VALUES
    ('NPK 20-20-20', 'Balanced NPK fertilizer for all crops', 'Compound', 'AgriCorp', 'NPK-202020-001', 
     450.00, 500.00, 400.00, 
     100, 'kg', 20,
     'AgriCorp Industries', 'active'),
    
    ('Urea 46%', 'High nitrogen content urea fertilizer', 'Nitrogen', 'FertMax', 'UREA-46-001',
     350.00, 400.00, 320.00,
     150, 'kg', 25,
     'FertMax Ltd', 'active'),
     
    ('DAP 18-46-0', 'Di-ammonium phosphate fertilizer', 'Phosphorus', 'CropGrow', 'DAP-18460-001',
     520.00, 580.00, 480.00,
     80, 'kg', 15,
     'CropGrow Solutions', 'active'),
     
    ('Potash MOP', 'Muriate of Potash for potassium nutrition', 'Potassium', 'NutriCrop', 'MOP-001',
     380.00, 420.00, 350.00,
     60, 'kg', 20,
     'NutriCrop Industries', 'active'),
     
    ('Organic Compost', 'Premium organic compost fertilizer', 'Compost', 'EcoFarm', 'COMP-ORG-001',
     150.00, 180.00, 120.00,
     200, 'kg', 30,
     'EcoFarm Organics', 'active')
) AS sample_data(name, description, category, brand, sku, unit_price, sale_price, purchase_price, quantity, unit, reorder_level, supplier, status)
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);

-- 8. Verify the setup
SELECT 'Products table setup completed successfully' AS status;

-- 9. Show current products table structure and data
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 10. Show sample data
SELECT 
    COUNT(*) as total_products,
    COUNT(*) FILTER (WHERE status = 'active') as active_products,
    COUNT(*) FILTER (WHERE quantity <= reorder_level) as low_stock_products
FROM products;
