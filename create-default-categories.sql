-- =====================================================
-- CREATE DEFAULT CATEGORIES FOR INVENTORY MANAGEMENT
-- Run this SQL in: Supabase Dashboard > SQL Editor
-- =====================================================

-- Insert default categories if they don't exist
INSERT INTO categories (name, description, is_active, sort_order, created_at, updated_at)
SELECT * FROM (
  VALUES 
    ('Chemical Fertilizer', 'Chemical-based fertilizers like urea, DAP, etc.', true, 1, now(), now()),
    ('Organic Fertilizer', 'Organic fertilizers like vermicompost, manure', true, 2, now(), now()),
    ('Bio Fertilizer', 'Bio-fertilizers with beneficial microorganisms', true, 3, now(), now()),
    ('NPK Fertilizers', 'Mixed NPK fertilizer products', true, 4, now(), now()),
    ('Seeds', 'All types of seeds and planting materials', true, 5, now(), now()),
    ('Pesticides', 'Insecticides, fungicides, herbicides', true, 6, now(), now()),
    ('Tools', 'Farming tools and equipment', true, 7, now(), now())
) AS new_categories(name, description, is_active, sort_order, created_at, updated_at)
WHERE NOT EXISTS (
  SELECT 1 FROM categories WHERE categories.name = new_categories.name
);

-- Verify categories were created
SELECT id, name, description, is_active, sort_order 
FROM categories 
ORDER BY sort_order;

-- Show count
SELECT COUNT(*) as total_categories FROM categories;
