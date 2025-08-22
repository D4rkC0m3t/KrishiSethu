-- Fix Immutable Functions Issue - Alternative Approach
-- The problem is that functions using auth.uid() or current_setting() cannot be IMMUTABLE
-- We need to restructure our approach to avoid functional indexes with non-immutable functions

-- First, identify all current functional indexes
SELECT 
    i.indexname,
    i.indexdef,
    i.tablename
FROM pg_indexes i
WHERE i.schemaname = 'public'
    AND (i.indexdef ILIKE '%get_organization_context%' 
         OR i.indexdef ILIKE '%auth.uid%'
         OR i.indexdef ILIKE '%current_setting%')
ORDER BY i.tablename, i.indexname;

-- Drop problematic functional indexes that use non-immutable functions
DO $$
DECLARE
    idx_record record;
BEGIN
    FOR idx_record IN 
        SELECT indexname
        FROM pg_indexes 
        WHERE schemaname = 'public' 
            AND (indexdef ILIKE '%get_organization_context%' 
                 OR indexdef ILIKE '%auth.uid%'
                 OR indexdef ILIKE '%current_setting%')
    LOOP
        EXECUTE format('DROP INDEX IF EXISTS %I', idx_record.indexname);
        RAISE NOTICE 'Dropped problematic index: %', idx_record.indexname;
    END LOOP;
END $$;

-- Instead of functional indexes with get_organization_context(), 
-- we'll use regular column-based indexes since we have organization_id columns

-- Recreate indexes using actual columns instead of functions
-- These are much more efficient anyway

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_org_active 
ON products (organization_id, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_products_org_search 
ON products USING gin(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(sku, '')))
WHERE organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_sku_org 
ON products (organization_id, sku) 
WHERE sku IS NOT NULL;

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_org_active 
ON categories (organization_id, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_categories_parent_org 
ON categories (organization_id, parent_id) 
WHERE parent_id IS NOT NULL;

-- Sales indexes
CREATE INDEX IF NOT EXISTS idx_sales_org_date 
ON sales (organization_id, sale_date DESC);

CREATE INDEX IF NOT EXISTS idx_sales_org_status 
ON sales (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_sales_customer_org 
ON sales (organization_id, customer_id) 
WHERE customer_id IS NOT NULL;

-- Sale items indexes
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_org 
ON sale_items (sale_id);

CREATE INDEX IF NOT EXISTS idx_sale_items_product 
ON sale_items (product_id);

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_org_active 
ON customers (organization_id, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_customers_org_search 
ON customers USING gin(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(email, '') || ' ' || coalesce(phone, '')))
WHERE organization_id IS NOT NULL;

-- Suppliers indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_org_active 
ON suppliers (organization_id, is_active) 
WHERE is_active = true;

-- Purchase orders indexes
CREATE INDEX IF NOT EXISTS idx_purchase_orders_org_date 
ON purchase_orders (organization_id, order_date DESC);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_org 
ON purchase_orders (organization_id, supplier_id);

-- Inventory movements indexes
CREATE INDEX IF NOT EXISTS idx_inventory_movements_org_date 
ON inventory_movements (organization_id, movement_date DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_org 
ON inventory_movements (organization_id, product_id);

-- User profiles indexes (these don't need organization_id since they're user-specific)
CREATE INDEX IF NOT EXISTS idx_user_profiles_org 
ON user_profiles (organization_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_role 
ON user_profiles (role);

-- Organizations indexes for admin functions
CREATE INDEX IF NOT EXISTS idx_organizations_slug 
ON organizations (slug);

CREATE INDEX IF NOT EXISTS idx_organizations_owner 
ON organizations (owner_id);

CREATE INDEX IF NOT EXISTS idx_organizations_subscription 
ON organizations (subscription_status, subscription_plan);

CREATE INDEX IF NOT EXISTS idx_organizations_trial_end 
ON organizations (trial_end_date) 
WHERE trial_end_date IS NOT NULL;

-- Now fix any functions that need to be IMMUTABLE for other purposes
-- Keep utility functions immutable
CREATE OR REPLACE FUNCTION normalize_slug(input_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
    SELECT lower(
        regexp_replace(
            regexp_replace(
                trim(coalesce(input_text, '')), 
                '[^a-zA-Z0-9\s-]', '', 'g'
            ), 
            '\s+', '-', 'g'
        )
    );
$$;

CREATE OR REPLACE FUNCTION generate_base_slug(input_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
    SELECT lower(
        regexp_replace(
            regexp_replace(
                regexp_replace(
                    trim(coalesce(input_text, '')), 
                    '[^a-zA-Z0-9\s-]', '', 'g'
                ), 
                '\s+', '-', 'g'
            ),
            '-+', '-', 'g'
        )
    );
$$;

-- The get_organization_context function should be STABLE (not IMMUTABLE)
-- because it depends on session state
CREATE OR REPLACE FUNCTION get_organization_context()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT COALESCE(
        nullif(current_setting('app.current_organization_id', true), '')::uuid,
        (
            SELECT organization_id 
            FROM user_profiles 
            WHERE id = auth.uid() 
            LIMIT 1
        )
    );
$$;

-- Update generate_unique_slug to be STABLE
CREATE OR REPLACE FUNCTION generate_unique_slug(input_text text, table_name text)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    base_slug text;
    final_slug text;
    counter integer := 0;
    slug_exists boolean;
BEGIN
    base_slug := generate_base_slug(input_text);
    
    IF base_slug = '' OR base_slug IS NULL THEN
        base_slug := 'item';
    END IF;
    
    final_slug := base_slug;
    
    LOOP
        EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I WHERE slug = $1)', table_name) 
        USING final_slug INTO slug_exists;
        
        EXIT WHEN NOT slug_exists;
        
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$;

-- Verify our functions are properly classified
SELECT 
    proname AS function_name,
    CASE provolatile 
        WHEN 'i' THEN 'IMMUTABLE ✓'
        WHEN 's' THEN 'STABLE ✓' 
        WHEN 'v' THEN 'VOLATILE ⚠️'
    END AS volatility_status,
    proparallel AS parallel_safety
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
    AND proname IN ('get_organization_context', 'normalize_slug', 'generate_base_slug', 'generate_unique_slug')
ORDER BY proname;

-- Check that all indexes are now working
SELECT 
    schemaname,
    tablename,
    indexname,
    CASE 
        WHEN indexdef ILIKE '%(%' THEN 'Functional Index'
        ELSE 'Column Index'
    END as index_type
FROM pg_indexes 
WHERE schemaname = 'public'
    AND tablename IN ('products', 'categories', 'sales', 'sale_items', 'customers', 'suppliers', 'purchase_orders', 'inventory_movements', 'user_profiles', 'organizations')
ORDER BY tablename, indexname;

SELECT 'All indexes recreated successfully with proper column-based approach' AS status;
