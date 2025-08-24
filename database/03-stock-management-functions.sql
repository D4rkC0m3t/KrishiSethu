-- =============================================
-- STOCK MANAGEMENT PL/SQL FUNCTIONS
-- Execute this in Supabase SQL Editor
-- =============================================

-- 🔧 These functions handle critical inventory operations safely
-- Prevents race conditions and ensures data consistency

-- First, create the stock_movements table if it doesn't exist
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    change_amount INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    operation_type VARCHAR(50) NOT NULL,
    reference_id UUID, -- Can link to sales, purchases, adjustments, etc.
    reference_type VARCHAR(50), -- 'sale', 'purchase', 'adjustment', 'return'
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Audit fields
    organization_id UUID, -- For multi-tenant support
    CONSTRAINT valid_operation_type CHECK (
        operation_type IN ('sale', 'purchase', 'adjustment', 'return', 'transfer', 'damage', 'recount')
    )
);

-- Index for stock movements
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at DESC);

-- =============================================
-- 1. TRANSACTION-SAFE STOCK UPDATE FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION update_product_stock(
    p_product_id UUID,
    p_quantity_change INTEGER,
    p_operation_type VARCHAR(50),
    p_reference_id UUID DEFAULT NULL,
    p_reference_type VARCHAR(50) DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_created_by UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_current_quantity INTEGER;
    v_new_quantity INTEGER;
    v_product_name TEXT;
    v_min_stock_level INTEGER;
    v_result JSONB;
BEGIN
    -- Lock the product row for update to prevent race conditions
    SELECT quantity, name, min_stock_level
    INTO v_current_quantity, v_product_name, v_min_stock_level
    FROM products 
    WHERE id = p_product_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product with ID % not found', p_product_id;
    END IF;
    
    -- Calculate new quantity
    v_new_quantity := v_current_quantity + p_quantity_change;
    
    -- Prevent negative stock (business rule)
    IF v_new_quantity < 0 THEN
        RAISE EXCEPTION 'Insufficient stock. Current: %, Requested: %, Product: %', 
            v_current_quantity, ABS(p_quantity_change), v_product_name;
    END IF;
    
    -- Update product quantity
    UPDATE products 
    SET quantity = v_new_quantity,
        updated_at = NOW()
    WHERE id = p_product_id;
    
    -- Log the stock movement
    INSERT INTO stock_movements (
        product_id, 
        change_amount, 
        previous_quantity, 
        new_quantity,
        operation_type, 
        reference_id, 
        reference_type,
        notes,
        created_by,
        organization_id
    ) VALUES (
        p_product_id, 
        p_quantity_change, 
        v_current_quantity, 
        v_new_quantity,
        p_operation_type, 
        p_reference_id, 
        p_reference_type,
        p_notes,
        p_created_by,
        (SELECT owner_id FROM products WHERE id = p_product_id)
    );
    
    -- Build result JSON
    v_result := jsonb_build_object(
        'success', true,
        'product_id', p_product_id,
        'product_name', v_product_name,
        'previous_quantity', v_current_quantity,
        'new_quantity', v_new_quantity,
        'change_amount', p_quantity_change,
        'operation_type', p_operation_type,
        'low_stock_alert', v_new_quantity <= v_min_stock_level,
        'stock_status', CASE 
            WHEN v_new_quantity = 0 THEN 'out_of_stock'
            WHEN v_new_quantity <= v_min_stock_level THEN 'low_stock'
            ELSE 'adequate'
        END
    );
    
    RETURN v_result;
    
EXCEPTION WHEN OTHERS THEN
    -- Log error and re-raise
    RAISE EXCEPTION 'Stock update failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 2. BATCH STOCK UPDATE FOR SALES
-- =============================================

CREATE OR REPLACE FUNCTION process_sale_stock_updates(
    p_sale_id UUID,
    p_sale_items JSONB -- Array of {product_id, quantity}
) RETURNS JSONB AS $$
DECLARE
    v_item JSONB;
    v_results JSONB[] := '{}';
    v_result JSONB;
    v_total_items INTEGER := 0;
    v_success_count INTEGER := 0;
BEGIN
    -- Process each sale item
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_sale_items)
    LOOP
        v_total_items := v_total_items + 1;
        
        BEGIN
            -- Reduce stock (negative quantity change)
            SELECT update_product_stock(
                (v_item->>'product_id')::UUID,
                -((v_item->>'quantity')::INTEGER),
                'sale',
                p_sale_id,
                'sale',
                'Stock reduced for sale #' || p_sale_id::TEXT,
                auth.uid()
            ) INTO v_result;
            
            v_results := v_results || v_result;
            v_success_count := v_success_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            -- Add error to results but continue processing other items
            v_result := jsonb_build_object(
                'success', false,
                'product_id', v_item->>'product_id',
                'error', SQLERRM
            );
            v_results := v_results || v_result;
        END;
    END LOOP;
    
    -- Return summary
    RETURN jsonb_build_object(
        'success', v_success_count = v_total_items,
        'total_items', v_total_items,
        'success_count', v_success_count,
        'failed_count', v_total_items - v_success_count,
        'results', v_results
    );
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 3. STOCK RECONCILIATION FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION reconcile_stock(
    p_product_id UUID,
    p_physical_count INTEGER,
    p_notes TEXT DEFAULT 'Stock reconciliation'
) RETURNS JSONB AS $$
DECLARE
    v_system_quantity INTEGER;
    v_difference INTEGER;
    v_result JSONB;
BEGIN
    -- Get current system quantity
    SELECT quantity INTO v_system_quantity
    FROM products
    WHERE id = p_product_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product with ID % not found', p_product_id;
    END IF;
    
    -- Calculate difference
    v_difference := p_physical_count - v_system_quantity;
    
    IF v_difference = 0 THEN
        -- No adjustment needed
        RETURN jsonb_build_object(
            'success', true,
            'adjustment_needed', false,
            'system_quantity', v_system_quantity,
            'physical_count', p_physical_count,
            'difference', 0,
            'message', 'Stock levels match - no adjustment needed'
        );
    ELSE
        -- Adjust stock to match physical count
        SELECT update_product_stock(
            p_product_id,
            v_difference,
            'recount',
            NULL,
            'reconciliation',
            p_notes || '. System: ' || v_system_quantity || ', Physical: ' || p_physical_count,
            auth.uid()
        ) INTO v_result;
        
        -- Add reconciliation info to result
        v_result := v_result || jsonb_build_object(
            'adjustment_needed', true,
            'system_quantity', v_system_quantity,
            'physical_count', p_physical_count,
            'difference', v_difference
        );
        
        RETURN v_result;
    END IF;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 4. LOW STOCK ALERT FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION get_low_stock_products(
    p_organization_id UUID DEFAULT NULL
) RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    current_quantity INTEGER,
    min_stock_level INTEGER,
    stock_ratio NUMERIC,
    category_name TEXT,
    brand_name TEXT,
    days_until_stockout INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.quantity,
        p.min_stock_level,
        ROUND(p.quantity::NUMERIC / NULLIF(p.min_stock_level, 0), 2) as stock_ratio,
        c.name as category,
        b.name as brand,
        -- Estimate days until stockout based on recent sales velocity
        COALESCE(
            (SELECT 
                CASE 
                    WHEN AVG(daily_sales) > 0 
                    THEN (p.quantity / AVG(daily_sales))::INTEGER
                    ELSE NULL
                END
            FROM (
                SELECT DATE(sm.created_at) as sale_date, 
                       SUM(ABS(sm.change_amount)) as daily_sales
                FROM stock_movements sm
                WHERE sm.product_id = p.id 
                  AND sm.operation_type = 'sale'
                  AND sm.created_at >= NOW() - INTERVAL '30 days'
                GROUP BY DATE(sm.created_at)
            ) daily_velocity
            ), 
            NULL
        ) as days_until_stockout
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN brands b ON p.brand_id = b.id
    WHERE p.is_active = true
      AND p.quantity <= p.min_stock_level
      AND (p_organization_id IS NULL OR p.owner_id = p_organization_id)
    ORDER BY 
        (p.quantity::NUMERIC / NULLIF(p.min_stock_level, 1)) ASC,
        p.quantity ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 5. INVENTORY VALUATION FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION calculate_inventory_value(
    p_organization_id UUID DEFAULT NULL,
    p_valuation_method VARCHAR(10) DEFAULT 'purchase' -- 'purchase' or 'sale'
) RETURNS TABLE (
    total_value NUMERIC,
    total_products INTEGER,
    total_quantity INTEGER,
    by_category JSONB
) AS $$
DECLARE
    v_price_field TEXT;
BEGIN
    -- Determine which price to use
    v_price_field := CASE 
        WHEN p_valuation_method = 'sale' THEN 'sale_price'
        ELSE 'purchase_price'
    END;
    
    RETURN QUERY
    EXECUTE format('
        WITH inventory_summary AS (
            SELECT 
                p.quantity * p.%I as product_value,
                p.quantity,
                c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_active = true
              AND p.quantity > 0
              AND ($1 IS NULL OR p.owner_id = $1)
        ),
        category_totals AS (
            SELECT 
                category_name,
                SUM(product_value) as category_value,
                COUNT(*) as category_products,
                SUM(quantity) as category_quantity
            FROM inventory_summary
            GROUP BY category_name
        )
        SELECT 
            COALESCE(SUM(product_value), 0) as total_value,
            COUNT(*)::INTEGER as total_products,
            COALESCE(SUM(quantity), 0)::INTEGER as total_quantity,
            COALESCE(
                jsonb_object_agg(
                    category_name, 
                    jsonb_build_object(
                        ''value'', category_value,
                        ''products'', category_products,
                        ''quantity'', category_quantity
                    )
                ) FILTER (WHERE category_name IS NOT NULL),
                ''{}''::jsonb
            ) as by_category
        FROM inventory_summary
        CROSS JOIN category_totals
        GROUP BY ()
    ', v_price_field) USING p_organization_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION update_product_stock TO authenticated;
GRANT EXECUTE ON FUNCTION process_sale_stock_updates TO authenticated;
GRANT EXECUTE ON FUNCTION reconcile_stock TO authenticated;
GRANT EXECUTE ON FUNCTION get_low_stock_products TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_inventory_value TO authenticated;

-- =============================================
-- USAGE EXAMPLES
-- =============================================

-- Example 1: Reduce stock for a sale
/*
SELECT update_product_stock(
    '7df37608-ed42-404e-8b8a-28d175e9743c'::UUID, -- product_id
    -5,                                             -- reduce by 5
    'sale',                                         -- operation type
    'sale-uuid-here'::UUID,                         -- reference to sale
    'sale',                                         -- reference type
    'Sold 5 units to customer',                     -- notes
    auth.uid()                                      -- created by current user
);
*/

-- Example 2: Process multiple stock updates for a sale
/*
SELECT process_sale_stock_updates(
    'sale-uuid-here'::UUID,
    '[
        {"product_id": "prod-1-uuid", "quantity": 2},
        {"product_id": "prod-2-uuid", "quantity": 1},
        {"product_id": "prod-3-uuid", "quantity": 3}
    ]'::JSONB
);
*/

-- Example 3: Get low stock products
/*
SELECT * FROM get_low_stock_products();
*/

-- Example 4: Calculate total inventory value
/*
SELECT * FROM calculate_inventory_value(NULL, 'purchase');
*/

-- =============================================
-- EXPECTED BENEFITS
-- =============================================
-- ✅ Race condition prevention during stock updates
-- ✅ Automatic stock movement logging
-- ✅ Business rule enforcement (no negative stock)
-- ✅ Low stock alerting with sales velocity
-- ✅ Accurate inventory valuation
-- ✅ Audit trail for all stock changes
-- ✅ Multi-tenant support built-in
