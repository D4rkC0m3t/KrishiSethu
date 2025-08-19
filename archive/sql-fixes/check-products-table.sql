-- Check products table specifically since brands and categories are working

-- 1. Check if products table exists and is accessible
SELECT 
    COUNT(*) as total_products,
    'Products table check' as status
FROM public.products;

-- 2. Check RLS status on products table
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    'RLS Status' as check_type
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'products';

-- 3. Check current RLS policies on products table
SELECT 
    policyname,
    cmd,
    qual,
    with_check,
    'Current Policies' as check_type
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'products';

-- 4. Check if current user can access products (test the RLS policy)
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_role,
    'Current Auth Info' as check_type;

-- 5. Check if user exists in profiles table
SELECT 
    id,
    email,
    role,
    is_active,
    'User Profile Check' as check_type
FROM public.profiles 
WHERE id = auth.uid();

-- 6. Test the is_user_active function
SELECT 
    public.is_user_active() as is_active_result,
    'RLS Function Test' as check_type;

-- 7. Try to select a few products to see what happens
SELECT 
    id,
    name,
    quantity,
    brand_id,
    category_id,
    'Sample Products' as check_type
FROM public.products 
LIMIT 3;