-- =====================================================
-- Identify Test Data
-- This helps identify what might be test/demo data
-- =====================================================

-- Check current user and data ownership
SELECT 
    'Current User' as info_type,
    auth.uid() as current_user_id;

-- Check products assigned to current user
SELECT 
    'Your Products' as section,
    id,
    name,
    code,
    created_at,
    owner_id
FROM products 
WHERE owner_id = auth.uid()
ORDER BY created_at;

-- Check if there are products with different owner_ids (should be none if RLS is working)
SELECT 
    'Other Users Products' as section,
    COUNT(*) as count,
    array_agg(DISTINCT owner_id) as other_owners
FROM products 
WHERE owner_id != auth.uid() OR owner_id IS NULL;

-- Check customers
SELECT 
    'Your Customers' as section,
    id,
    name,
    phone,
    created_at
FROM customers 
WHERE owner_id = auth.uid()
ORDER BY created_at;

-- Check suppliers  
SELECT 
    'Your Suppliers' as section,
    id,
    name,
    phone,
    created_at
FROM suppliers 
WHERE owner_id = auth.uid()
ORDER BY created_at;

-- Check for common test data patterns
SELECT 
    'Possible Test Products' as section,
    id,
    name,
    code,
    created_at
FROM products 
WHERE owner_id = auth.uid()
AND (
    name ILIKE '%test%' 
    OR name ILIKE '%demo%' 
    OR name ILIKE '%sample%'
    OR code ILIKE '%test%'
    OR code ILIKE '%demo%'
)
ORDER BY created_at;
