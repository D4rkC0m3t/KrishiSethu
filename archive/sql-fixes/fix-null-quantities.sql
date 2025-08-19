-- Fix the inventory loading issue by setting default quantities for products with NULL values

-- 1. Check how many products have NULL quantities
SELECT 
    COUNT(*) as total_products,
    COUNT(CASE WHEN quantity IS NULL THEN 1 END) as null_quantity_products,
    COUNT(CASE WHEN quantity IS NOT NULL THEN 1 END) as valid_quantity_products,
    'Quantity Status Check' as status
FROM public.products;

-- 2. Update all NULL quantities to 0 (out of stock)
UPDATE public.products 
SET quantity = 0 
WHERE quantity IS NULL;

-- 3. Verify the update
SELECT 
    COUNT(*) as total_products,
    COUNT(CASE WHEN quantity IS NULL THEN 1 END) as remaining_null_quantities,
    MIN(quantity) as min_quantity,
    MAX(quantity) as max_quantity,
    'After Update Check' as status
FROM public.products;

-- 4. Show sample products after the fix
SELECT 
    id,
    name,
    quantity,
    brand_id,
    category_id,
    'Fixed Products Sample' as status
FROM public.products 
LIMIT 5;

-- 5. Optional: Set some sample quantities for testing
-- Uncomment these lines if you want to add some test stock levels
/*
UPDATE public.products 
SET quantity = CASE 
    WHEN name ILIKE '%rhizobium%' THEN 50
    WHEN name ILIKE '%npk%' THEN 100
    WHEN name ILIKE '%testing%' THEN 25
    ELSE 10
END
WHERE quantity = 0;
*/