-- ============================================================================
-- 🧹 CLEAN DATABASE (CAUTION: THIS WILL DELETE ALL DATA)
-- ============================================================================
-- Only run this if you want to start completely fresh
-- ============================================================================

-- Drop all tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS purchase_items CASCADE;
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS brands CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- Drop sequences
DROP SEQUENCE IF EXISTS product_code_seq CASCADE;
DROP SEQUENCE IF EXISTS sale_number_seq CASCADE;
DROP SEQUENCE IF EXISTS purchase_number_seq CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS generate_product_code() CASCADE;
DROP FUNCTION IF EXISTS generate_sale_number() CASCADE;
DROP FUNCTION IF EXISTS generate_purchase_number() CASCADE;

-- Drop types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS product_type CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS transaction_status CASCADE;
DROP TYPE IF EXISTS movement_type CASCADE;

SELECT 'Database cleaned successfully!' as status;