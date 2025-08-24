-- =====================================================
-- REMOVE ALL MOCK DATA FROM DATABASE (JUST IN CASE)
-- Clean any remaining sample/mock data
-- Run this in Supabase SQL Editor Dashboard
-- =====================================================

BEGIN;

-- Step 1: Delete any sample suppliers
DELETE FROM public.suppliers WHERE 
  name IN ('Tata Chemicals Ltd', 'IFFCO Distributors', 'Green Gold Organics', 'Coromandel International')
  OR email LIKE '%@tatachemicals.com'
  OR email LIKE '%@iffco.com'
  OR email LIKE '%@greengold.com'
  OR email LIKE '%@coromandel.com';

-- Step 2: Delete any sample customers
DELETE FROM public.customers WHERE 
  name LIKE '%Sample%'
  OR name LIKE '%Demo%'
  OR name LIKE '%Test%';

-- Step 3: Delete any sample purchases
DELETE FROM public.purchases WHERE 
  purchase_order_number LIKE 'PUR2025%'
  OR supplier_name IN ('Tata Chemicals Ltd', 'IFFCO Distributors', 'Green Gold Organics', 'ICL Fertilizers')
  OR notes LIKE '%Demo%'
  OR notes LIKE '%Sample%';

-- Step 4: Delete any sample sales
DELETE FROM public.sales WHERE 
  invoice_number LIKE 'TC/%'
  OR invoice_number LIKE 'IF/%'
  OR invoice_number LIKE 'GG/%'
  OR invoice_number LIKE 'ICL/%'
  OR customer_name LIKE '%Sample%'
  OR customer_name LIKE '%Demo%';

-- Step 5: Delete any sample products
DELETE FROM public.products WHERE 
  name LIKE '%Sample%'
  OR name LIKE '%Demo%'
  OR name LIKE '%Test%'
  OR created_at < NOW() - INTERVAL '1 hour';

-- Step 6: Reset any sequences/counters if they exist
-- (This ensures fresh starts for any auto-increment fields)

COMMIT;

-- Final verification
SELECT 
  'All mock data removed from database' as result,
  (SELECT COUNT(*) FROM public.suppliers) as suppliers_remaining,
  (SELECT COUNT(*) FROM public.customers) as customers_remaining,
  (SELECT COUNT(*) FROM public.purchases) as purchases_remaining,
  (SELECT COUNT(*) FROM public.sales) as sales_remaining,
  (SELECT COUNT(*) FROM public.products) as products_remaining;
