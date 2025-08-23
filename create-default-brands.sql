-- =====================================================
-- CREATE DEFAULT BRANDS FOR INVENTORY MANAGEMENT
-- Run this SQL in: Supabase Dashboard > SQL Editor
-- =====================================================

-- Insert default brands if they don't exist
INSERT INTO brands (name, description, is_active, created_at, updated_at)
SELECT * FROM (
  VALUES 
    ('IFFCO', 'Indian Farmers Fertiliser Cooperative Limited', true, now(), now()),
    ('Coromandel', 'Coromandel International Limited', true, now(), now()),
    ('UPL', 'United Phosphorus Limited', true, now(), now()),
    ('Tata Chemicals', 'Tata Chemicals Limited', true, now(), now()),
    ('Godrej Agrovet', 'Godrej Agrovet Limited', true, now(), now()),
    ('Bayer', 'Bayer CropScience', true, now(), now()),
    ('Syngenta', 'Syngenta India Limited', true, now(), now()),
    ('Mahindra', 'Mahindra Agri Solutions', true, now(), now()),
    ('Rallis India', 'Rallis India Limited', true, now(), now()),
    ('Generic', 'Generic/Unbranded products', true, now(), now())
) AS new_brands(name, description, is_active, created_at, updated_at)
WHERE NOT EXISTS (
  SELECT 1 FROM brands WHERE brands.name = new_brands.name
);

-- Verify brands were created
SELECT id, name, description, is_active 
FROM brands 
ORDER BY name;

-- Show count
SELECT COUNT(*) as total_brands FROM brands;
