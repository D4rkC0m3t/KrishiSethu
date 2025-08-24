-- =====================================================
-- CREATE MISSING TABLES - HANDLES EXISTING OBJECTS
-- Creates only missing tables and policies safely
-- Run this in Supabase SQL Editor Dashboard
-- =====================================================

BEGIN;

-- Step 1: Handle BRANDS table (may already exist)
-- Check if brands table needs sample data
DO $$
BEGIN
  -- Only insert brands if table is empty
  IF NOT EXISTS (SELECT 1 FROM public.brands LIMIT 1) THEN
    INSERT INTO public.brands (name, description, website, contact_email) VALUES 
      ('AgriCorp', 'Premium agricultural products and fertilizers', 'www.agricorp.com', 'info@agricorp.com'),
      ('FertMax', 'Maximum yield fertilizer solutions', 'www.fertmax.com', 'sales@fertmax.com'),
      ('CropGrow', 'Complete crop nutrition systems', 'www.cropgrow.com', 'support@cropgrow.com'),
      ('NutriCorp', 'Essential plant nutrition products', 'www.nutricorp.com', 'contact@nutricorp.com'),
      ('EcoFarm', 'Sustainable and organic farming solutions', 'www.ecofarm.com', 'info@ecofarm.com'),
      ('GreenGold', 'Gold standard in agricultural inputs', 'www.greengold.com', 'hello@greengold.com'),
      ('BioNutri', 'Biological nutrition solutions', 'www.bionutri.com', 'sales@bionutri.com'),
      ('SeedMaster', 'Quality seeds and planting materials', 'www.seedmaster.com', 'orders@seedmaster.com'),
      ('PlantCare', 'Comprehensive plant care products', 'www.plantcare.com', 'support@plantcare.com'),
      ('HarvestMax', 'Maximum harvest solutions', 'www.harvestmax.com', 'info@harvestmax.com')
    ON CONFLICT (name) DO NOTHING;
    
    RAISE NOTICE 'Added sample brands data';
  ELSE
    RAISE NOTICE 'Brands table already has data, skipping insert';
  END IF;
END $$;

-- Step 2: Create PURCHASES table (if not exists)
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_number VARCHAR(100) UNIQUE,
  supplier_id UUID REFERENCES public.suppliers(id),
  supplier_name VARCHAR(255),
  organization_id UUID NOT NULL,
  purchase_date DATE DEFAULT CURRENT_DATE,
  total_amount DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  net_amount DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'draft',
  notes TEXT,
  payment_terms VARCHAR(100),
  delivery_date DATE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS on purchases (if not already enabled)
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Drop existing purchase policies if they exist, then recreate
DROP POLICY IF EXISTS "Multi-tenant purchases access" ON public.purchases;
DROP POLICY IF EXISTS "Block anonymous purchases access" ON public.purchases;
DROP POLICY IF EXISTS "Everyone can view purchases" ON public.purchases;
DROP POLICY IF EXISTS "Authenticated users can manage purchases" ON public.purchases;

-- Create fresh multi-tenant policies for purchases
CREATE POLICY "Multi-tenant purchases access" ON public.purchases
  FOR ALL TO authenticated 
  USING (organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Block anonymous purchases access" ON public.purchases
  FOR ALL TO anon USING (false);

-- Step 3: Create PURCHASE_ITEMS table (if not exists)
CREATE TABLE IF NOT EXISTS public.purchase_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  product_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  organization_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS on purchase_items
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;

-- Drop and recreate purchase items policies
DROP POLICY IF EXISTS "Multi-tenant purchase items access" ON public.purchase_items;

CREATE POLICY "Multi-tenant purchase items access" ON public.purchase_items
  FOR ALL TO authenticated 
  USING (organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid()));

-- Step 4: Create SALES table (if not exists)
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number VARCHAR(100) UNIQUE,
  customer_id UUID REFERENCES public.customers(id),
  customer_name VARCHAR(255),
  organization_id UUID NOT NULL,
  sale_date DATE DEFAULT CURRENT_DATE,
  total_amount DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  net_amount DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'completed',
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS on sales
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Drop and recreate sales policies
DROP POLICY IF EXISTS "Multi-tenant sales access" ON public.sales;
DROP POLICY IF EXISTS "Block anonymous sales access" ON public.sales;
DROP POLICY IF EXISTS "Everyone can view sales" ON public.sales;
DROP POLICY IF EXISTS "Authenticated users can manage sales" ON public.sales;

CREATE POLICY "Multi-tenant sales access" ON public.sales
  FOR ALL TO authenticated 
  USING (organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Block anonymous sales access" ON public.sales
  FOR ALL TO anon USING (false);

-- Step 5: Create SALE_ITEMS table (if not exists)
CREATE TABLE IF NOT EXISTS public.sale_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  product_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  organization_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS on sale_items
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- Drop and recreate sale items policies
DROP POLICY IF EXISTS "Multi-tenant sale items access" ON public.sale_items;

CREATE POLICY "Multi-tenant sale items access" ON public.sale_items
  FOR ALL TO authenticated 
  USING (organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid()));

-- Step 6: Create indexes for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_purchases_organization_id ON public.purchases(organization_id);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier_id ON public.purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON public.purchases(purchase_date);

CREATE INDEX IF NOT EXISTS idx_sales_organization_id ON public.sales(organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON public.sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales(sale_date);

CREATE INDEX IF NOT EXISTS idx_purchase_items_organization_id ON public.purchase_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_organization_id ON public.sale_items(organization_id);

-- Step 7: Add updated_at triggers (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_purchases_updated_at ON public.purchases;
CREATE TRIGGER update_purchases_updated_at 
  BEFORE UPDATE ON public.purchases 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sales_updated_at ON public.sales;
CREATE TRIGGER update_sales_updated_at 
  BEFORE UPDATE ON public.sales 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- Final verification
SELECT 
  'Missing tables created/verified with multi-tenant security' as result,
  (SELECT COUNT(*) FROM public.brands) as brands_count,
  (SELECT COUNT(*) FROM public.purchases) as purchases_count,
  (SELECT COUNT(*) FROM public.sales) as sales_count,
  (SELECT COUNT(*) FROM public.categories) as categories_count;
