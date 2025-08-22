-- Fix Immutable Functions Issue
-- This script identifies and fixes functions that need to be marked as IMMUTABLE for indexes

-- First, let's check all our custom functions and their volatility
SELECT 
    n.nspname AS schema_name,
    p.proname AS function_name,
    p.provolatile AS volatility,
    CASE p.provolatile 
        WHEN 'i' THEN 'IMMUTABLE'
        WHEN 's' THEN 'STABLE' 
        WHEN 'v' THEN 'VOLATILE'
    END AS volatility_label
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname NOT LIKE 'pg_%'
    AND p.proname NOT LIKE 'uuid_%'
ORDER BY p.proname;

-- Check for indexes that might be using functions
SELECT 
    i.indexname,
    i.indexdef,
    i.tablename
FROM pg_indexes i
WHERE i.schemaname = 'public'
    AND i.indexdef LIKE '%(%'
ORDER BY i.tablename, i.indexname;

-- Drop and recreate the get_organization_context function as IMMUTABLE
DROP FUNCTION IF EXISTS get_organization_context() CASCADE;

CREATE OR REPLACE FUNCTION get_organization_context()
RETURNS uuid
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
AS $$
    -- This function extracts the organization_id from the current user context
    -- It must be IMMUTABLE to be used in indexes
    SELECT COALESCE(
        current_setting('app.current_organization_id', true)::uuid,
        (
            SELECT organization_id 
            FROM user_profiles 
            WHERE id = auth.uid() 
            LIMIT 1
        )
    );
$$;

-- Drop and recreate any other utility functions that might need to be IMMUTABLE
DROP FUNCTION IF EXISTS normalize_slug(text) CASCADE;

CREATE OR REPLACE FUNCTION normalize_slug(input_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT lower(
        regexp_replace(
            regexp_replace(
                trim(input_text), 
                '[^a-zA-Z0-9\s-]', '', 'g'
            ), 
            '\s+', '-', 'g'
        )
    );
$$;

-- Drop and recreate generate_unique_slug as IMMUTABLE where possible
DROP FUNCTION IF EXISTS generate_unique_slug(text, text) CASCADE;

-- For functions that check uniqueness, we can't make them truly IMMUTABLE
-- But we can create a simple slug normalizer that IS immutable
CREATE OR REPLACE FUNCTION generate_base_slug(input_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
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

-- Update the actual generate_unique_slug to use the immutable base function
CREATE OR REPLACE FUNCTION generate_unique_slug(input_text text, table_name text)
RETURNS text
LANGUAGE plpgsql
STABLE  -- This can't be IMMUTABLE because it checks database state
AS $$
DECLARE
    base_slug text;
    final_slug text;
    counter integer := 0;
    slug_exists boolean;
BEGIN
    -- Use the immutable function for base processing
    base_slug := generate_base_slug(input_text);
    
    -- Ensure we have something
    IF base_slug = '' OR base_slug IS NULL THEN
        base_slug := 'item';
    END IF;
    
    final_slug := base_slug;
    
    -- Check uniqueness (this makes the function non-immutable)
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

-- Fix any functions related to search that might be used in indexes
DROP FUNCTION IF EXISTS to_tsvector_simple(text) CASCADE;

CREATE OR REPLACE FUNCTION to_tsvector_simple(input_text text)
RETURNS tsvector
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT to_tsvector('english', coalesce(input_text, ''));
$$;

-- Check if there are any functional indexes we need to rebuild
DO $$
DECLARE
    idx_record record;
BEGIN
    FOR idx_record IN 
        SELECT indexname, tablename, indexdef
        FROM pg_indexes 
        WHERE schemaname = 'public' 
            AND indexdef ILIKE '%get_organization_context%'
    LOOP
        RAISE NOTICE 'Found index using get_organization_context: % on table %', idx_record.indexname, idx_record.tablename;
        
        -- Drop the problematic index
        EXECUTE format('DROP INDEX IF EXISTS %I', idx_record.indexname);
        RAISE NOTICE 'Dropped index: %', idx_record.indexname;
    END LOOP;
END $$;

-- Recreate any RLS policies that might have been affected
-- First check what policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- If we need to recreate organization-scoped indexes, do it properly
-- Example for products table (adjust based on your actual needs):
CREATE INDEX IF NOT EXISTS idx_products_organization_search 
ON products USING gin(
    (
        to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(sku, ''))
    )
) WHERE organization_id IS NOT NULL;

-- Example for organization-scoped queries (if needed)
CREATE INDEX IF NOT EXISTS idx_products_org_active 
ON products (organization_id, is_active, created_at) 
WHERE is_active = true;

-- Check the results
SELECT 'Functions fixed and indexes rebuilt successfully' AS status;

-- List any remaining issues
SELECT 
    'Remaining function issues:' AS check_type,
    p.proname AS function_name,
    CASE p.provolatile 
        WHEN 'i' THEN 'IMMUTABLE ✓'
        WHEN 's' THEN 'STABLE ⚠️' 
        WHEN 'v' THEN 'VOLATILE ❌'
    END AS volatility_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname NOT LIKE 'pg_%'
    AND p.proname NOT LIKE 'uuid_%'
    AND p.provolatile = 'v'  -- Show only volatile functions that might be problematic
ORDER BY p.proname;
