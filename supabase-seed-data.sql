-- Krishisethu Inventory Management - Seed Data for Supabase
-- This script populates the database with initial data

-- Insert Categories
INSERT INTO categories (name, description, sort_order) VALUES
('NPK Fertilizers', 'Nitrogen, Phosphorus, Potassium fertilizers', 1),
('Nitrogen Fertilizers', 'High nitrogen content fertilizers', 2),
('Phosphorus Fertilizers', 'Phosphorus-rich fertilizers for root development', 3),
('Potassium Fertilizers', 'Potassium-based fertilizers for plant health', 4),
('Organic Fertilizers', 'Natural and organic fertilizers', 5),
('Micronutrients', 'Essential micronutrients for plant growth', 6),
('Bio-fertilizers', 'Biological fertilizers with beneficial microorganisms', 7),
('Liquid Fertilizers', 'Water-soluble liquid fertilizers', 8),
('Pesticides', 'Plant protection chemicals', 9),
('Seeds', 'Agricultural seeds and planting materials', 10);

-- Insert Brands
INSERT INTO brands (name, description) VALUES
('Tata Chemicals', 'Leading chemical fertilizer manufacturer'),
('IFFCO', 'Indian Farmers Fertiliser Cooperative Limited'),
('Coromandel', 'Premium fertilizer and crop protection solutions'),
('UPL', 'United Phosphorus Limited - Crop protection'),
('Godrej Agrovet', 'Diversified agribusiness company'),
('Nagarjuna Fertilizers', 'Quality fertilizer products'),
('Green Gold', 'Organic and bio-fertilizer specialist'),
('FarmGrow', 'Agricultural input solutions'),
('KrishiChem', 'Chemical fertilizer products'),
('BioMax', 'Biological fertilizer solutions');

-- Insert Suppliers
INSERT INTO suppliers (name, contact_person, phone, email, address, gst_number, payment_terms) VALUES
(
    'Tata Chemicals Ltd',
    'Rajesh Kumar',
    '+91-9876543210',
    'rajesh@tatachemicals.com',
    '{"street": "123 Industrial Area", "city": "Mumbai", "state": "Maharashtra", "pincode": "400001", "country": "India"}',
    '27AAAAA0000A1Z5',
    '30 days'
),
(
    'IFFCO Distribution Center',
    'Suresh Sharma',
    '+91-9876543211',
    'suresh@iffco.com',
    '{"street": "456 Agricultural Complex", "city": "Delhi", "state": "Delhi", "pincode": "110001", "country": "India"}',
    '07BBBBB1111B2Z6',
    '45 days'
),
(
    'Coromandel International',
    'Priya Patel',
    '+91-9876543212',
    'priya@coromandel.com',
    '{"street": "789 Chemical Hub", "city": "Hyderabad", "state": "Telangana", "pincode": "500001", "country": "India"}',
    '36CCCCC2222C3Z7',
    '30 days'
),
(
    'Green Gold Organics',
    'Amit Singh',
    '+91-9876543213',
    'amit@greengold.com',
    '{"street": "321 Organic Farm", "city": "Pune", "state": "Maharashtra", "pincode": "411001", "country": "India"}',
    '27DDDDD3333D4Z8',
    '15 days'
);

-- Insert sample customers
INSERT INTO customers (name, phone, email, address, credit_limit) VALUES
(
    'Ramesh Kumar',
    '+91-9876543220',
    'ramesh@farmer.com',
    '{"street": "Village Rampur", "city": "Rampur", "state": "Uttar Pradesh", "pincode": "244901", "country": "India"}',
    50000.00
),
(
    'Sunita Devi',
    '+91-9876543221',
    'sunita@farmer.com',
    '{"street": "Village Krishnapur", "city": "Krishnapur", "state": "Bihar", "pincode": "800001", "country": "India"}',
    25000.00
),
(
    'Mahesh Agro Farm',
    '+91-9876543222',
    'mahesh@agrofarm.com',
    '{"street": "Farm House 123", "city": "Nashik", "state": "Maharashtra", "pincode": "422001", "country": "India"}',
    100000.00
);

-- Get category and brand IDs for products
-- Note: In a real scenario, you'd use the actual UUIDs returned from the inserts above

-- Insert sample products
INSERT INTO products (
    name, code, type, category_id, brand_id, supplier_id, description, composition,
    quantity, unit, min_stock_level, max_stock_level, reorder_point,
    purchase_price, sale_price, mrp, batch_no, expiry_date,
    hsn_code, gst_rate, barcode, location, tags
) VALUES
(
    'NPK 20-20-20',
    'NPK-202020-001',
    'Chemical',
    (SELECT id FROM categories WHERE name = 'NPK Fertilizers' LIMIT 1),
    (SELECT id FROM brands WHERE name = 'Tata Chemicals' LIMIT 1),
    (SELECT id FROM suppliers WHERE name = 'Tata Chemicals Ltd' LIMIT 1),
    'Balanced NPK fertilizer for all crops',
    '{"nitrogen": 20, "phosphorus": 20, "potassium": 20}',
    100, 'kg', 10, 200, 20,
    850.00, 950.00, 1000.00,
    'TC2024001', '2025-12-31',
    '31051000', 5.00,
    '1234567890123',
    'Warehouse-A-Shelf-1',
    ARRAY['fertilizer', 'npk', 'chemical']
),
(
    'Urea',
    'UREA-001',
    'Chemical',
    (SELECT id FROM categories WHERE name = 'Nitrogen Fertilizers' LIMIT 1),
    (SELECT id FROM brands WHERE name = 'IFFCO' LIMIT 1),
    (SELECT id FROM suppliers WHERE name = 'IFFCO Distribution Center' LIMIT 1),
    'High quality urea for nitrogen supply',
    '{"nitrogen": 46, "phosphorus": 0, "potassium": 0}',
    200, 'kg', 20, 500, 50,
    280.00, 320.00, 350.00,
    'IF2024002', '2026-06-30',
    '31021000', 5.00,
    '1234567890124',
    'Warehouse-A-Shelf-2',
    ARRAY['fertilizer', 'nitrogen', 'urea']
),
(
    'DAP (Di-Ammonium Phosphate)',
    'DAP-001',
    'Chemical',
    (SELECT id FROM categories WHERE name = 'Phosphorus Fertilizers' LIMIT 1),
    (SELECT id FROM brands WHERE name = 'Coromandel' LIMIT 1),
    (SELECT id FROM suppliers WHERE name = 'Coromandel International' LIMIT 1),
    'Di-ammonium phosphate for root development',
    '{"nitrogen": 18, "phosphorus": 46, "potassium": 0}',
    8, 'kg', 10, 100, 15,
    1200.00, 1350.00, 1400.00,
    'CR2024003', '2025-09-30',
    '31051000', 5.00,
    '1234567890125',
    'Warehouse-A-Shelf-3',
    ARRAY['fertilizer', 'phosphorus', 'dap']
),
(
    'Organic Compost',
    'COMPOST-001',
    'Organic',
    (SELECT id FROM categories WHERE name = 'Organic Fertilizers' LIMIT 1),
    (SELECT id FROM brands WHERE name = 'Green Gold' LIMIT 1),
    (SELECT id FROM suppliers WHERE name = 'Green Gold Organics' LIMIT 1),
    'Premium organic compost for soil enrichment',
    '{"nitrogen": 1.5, "phosphorus": 1.0, "potassium": 1.5}',
    60, 'kg', 20, 150, 30,
    150.00, 200.00, 220.00,
    'GG2024005', '2025-08-15',
    '31051000', 5.00,
    '1234567890127',
    'Warehouse-C-Shelf-1',
    ARRAY['organic', 'compost', 'soil']
),
(
    'Zinc Sulphate',
    'ZINC-001',
    'Chemical',
    (SELECT id FROM categories WHERE name = 'Micronutrients' LIMIT 1),
    (SELECT id FROM brands WHERE name = 'Tata Chemicals' LIMIT 1),
    (SELECT id FROM suppliers WHERE name = 'Tata Chemicals Ltd' LIMIT 1),
    'Essential micronutrient for crop growth',
    '{"zinc": 33, "sulphur": 17}',
    35, 'kg', 10, 80, 15,
    180.00, 220.00, 250.00,
    'TC2024006', '2025-11-30',
    '31051000', 5.00,
    '1234567890128',
    'Warehouse-B-Shelf-2',
    ARRAY['micronutrient', 'zinc', 'sulphate']
);

-- Insert system settings
INSERT INTO settings (key, value, description) VALUES
(
    'company_info',
    '{
        "name": "Krishisethu Fertilizers",
        "address": {
            "street": "123 Agricultural Complex",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400001",
            "country": "India"
        },
        "phone": "+91-9876543210",
        "email": "info@krishisethu.com",
        "website": "https://krishisethu.com",
        "gst_number": "27AAAAA0000A1Z5",
        "pan_number": "AAAAA0000A",
        "logo_url": "/logo.png"
    }',
    'Company information and contact details'
),
(
    'tax_settings',
    '{
        "default_tax_rate": 5,
        "gst_enabled": true,
        "tax_inclusive": false,
        "hsn_code": "31051000"
    }',
    'Tax configuration settings'
),
(
    'inventory_settings',
    '{
        "low_stock_threshold": 10,
        "auto_reorder_enabled": false,
        "barcode_enabled": true,
        "track_batches": true,
        "track_expiry": true
    }',
    'Inventory management settings'
),
(
    'sales_settings',
    '{
        "invoice_prefix": "INV",
        "receipt_prefix": "RCP",
        "auto_invoice_number": true,
        "print_after_sale": true,
        "email_receipts": false
    }',
    'Sales and invoicing settings'
),
(
    'notification_settings',
    '{
        "low_stock_alerts": true,
        "expiry_alerts": true,
        "payment_reminders": true,
        "email_notifications": false,
        "sms_notifications": false
    }',
    'Notification preferences'
);

-- Create initial stock movements for the products
INSERT INTO stock_movements (product_id, movement_type, quantity, reference_type, notes, movement_date) VALUES
(
    (SELECT id FROM products WHERE code = 'NPK-202020-001' LIMIT 1),
    'in',
    100,
    'initial_stock',
    'Initial stock entry',
    CURRENT_DATE
),
(
    (SELECT id FROM products WHERE code = 'UREA-001' LIMIT 1),
    'in',
    200,
    'initial_stock',
    'Initial stock entry',
    CURRENT_DATE
),
(
    (SELECT id FROM products WHERE code = 'DAP-001' LIMIT 1),
    'in',
    8,
    'initial_stock',
    'Initial stock entry - Low stock alert',
    CURRENT_DATE
),
(
    (SELECT id FROM products WHERE code = 'COMPOST-001' LIMIT 1),
    'in',
    60,
    'initial_stock',
    'Initial stock entry',
    CURRENT_DATE
),
(
    (SELECT id FROM products WHERE code = 'ZINC-001' LIMIT 1),
    'in',
    35,
    'initial_stock',
    'Initial stock entry',
    CURRENT_DATE
);

-- Note: User data will be automatically created when users sign up through Supabase Auth
-- You can manually insert test users if needed for development
