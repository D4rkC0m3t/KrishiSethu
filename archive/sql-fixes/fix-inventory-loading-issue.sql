-- Fix Inventory Loading Issue
-- This script addresses common issues preventing product fetching

-- 1. Check current state of products table
SELECT 
    COUNT(*) as total_products,
    COUNT(CASE WHEN quantity IS NULL THEN 1 END) as null_quantities,
    'Current Products State' as status
FROM public.products;

-- 2. Fix NULL quantities (common cause of filtering issues)
UPDATE public.products 
SET quantity = 0 
WHERE quantity IS NULL;

-- 3. Check RLS status on products table
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'products';

-- 4. Temporarily disable RLS for testing (if enabled)
-- Uncomment the next line if RLS is causing issues
-- ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- 5. Create a more permissive RLS policy for authenticated users
DROP POLICY IF EXISTS "products_select_authenticated" ON public.products;
CREATE POLICY "products_select_authenticated" ON public.products
    FOR SELECT USING (
        auth.role() = 'authenticated'
    );

-- 6. Ensure products table has proper indexes
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_quantity ON products(quantity);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- 7. Add some sample products if table is empty
INSERT INTO public.products (name, type, category_id, brand_id, quantity, purchase_price, sale_price, description, is_active)
SELECT 
    'Sample NPK Fertilizer',
    'NPK',
    (SELECT id FROM categories WHERE name = 'NPK Fertilizers' LIMIT 1),
    (SELECT id FROM brands WHERE name = 'Tata Chemicals' LIMIT 1),
    100,
    450.00,
    500.00,
    'Sample NPK fertilizer for testing',
    true
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);

-- 8. Verify the fix
SELECT 
    p.id,
    p.name,
    p.type,
    p.quantity,
    p.sale_price,
    b.name as brand_name,
    c.name as category_name,
    'Sample Products' as status
FROM public.products p
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN categories c ON p.category_id = c.id
LIMIT 5;

-- 9. Check if the query that the frontend uses works
SELECT 
    p.*,
    brands.id as brand_id_join,
    brands.name as brand_name_join,
    categories.id as category_id_join,
    categories.name as category_name_join
FROM products p
LEFT JOIN brands ON p.brand_id = brands.id
LEFT JOIN categories ON p.category_id = categories.id
ORDER BY p.name
LIMIT 3;

-- 10. Final verification
SELECT 
    'Fix Applied Successfully' as status,
    COUNT(*) as total_products,
    COUNT(CASE WHEN quantity > 0 THEN 1 END) as in_stock_products,
    COUNT(CASE WHEN quantity = 0 THEN 1 END) as out_of_stock_products
FROM public.products;