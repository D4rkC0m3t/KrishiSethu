-- QUICK FIX: Temporarily disable RLS on products table to test inventory loading
-- This will help us confirm if RLS is the issue

-- 1. Disable RLS on products table temporarily
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- 2. Also disable RLS on related tables that might be causing join issues
ALTER TABLE public.brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;

-- 3. Test query to see if products are now accessible
SELECT 
    COUNT(*) as total_products,
    'Products should now be accessible' as status
FROM public.products;

-- 4. Test the exact query used by the app
SELECT 
    p.*,
    b.name as brand_name,
    c.name as category_name
FROM public.products p
LEFT JOIN public.brands b ON p.brand_id = b.id
LEFT JOIN public.categories c ON p.category_id = c.id
LIMIT 5;

-- NOTE: This is a temporary fix for testing
-- After confirming inventory loads, you should re-enable RLS and fix the policies properly