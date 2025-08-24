-- =====================================================
-- CREATE MISSING TABLES WITH PROPER MULTI-TENANT SETUP
-- Creates brands, purchases, sales tables with RLS
-- Run this in Supabase SQL Editor Dashboard
-- =====================================================

BEGIN;

-- Step 1: Create BRANDS table (universal reference data)
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  website VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS on brands (universal data)
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view brands (reference data)
CREATE POLICY "Everyone can view brands" ON public.brands
  FOR SELECT USING (true);

-- Only authenticated users can manage brands
CREATE POLICY "Authenticated users can manage brands" ON public.brands
  FOR ALL TO authenticated USING (true);

-- Step 2: Insert sample brands data
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

-- Step 3: Create PURCHASES table (multi-tenant)
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

-- Enable RLS on purchases (multi-tenant)
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Multi-tenant policy for purchases
CREATE POLICY "Multi-tenant purchases access" ON public.purchases
  FOR ALL TO authenticated 
  USING (organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid()));

-- Block anonymous access to purchases
CREATE POLICY "Block anonymous purchases access" ON public.purchases
  FOR ALL TO anon USING (false);

-- Step 4: Create PURCHASE_ITEMS table (multi-tenant)  
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

-- Enable RLS on purchase_items (multi-tenant)
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;

-- Multi-tenant policy for purchase_items
CREATE POLICY "Multi-tenant purchase items access" ON public.purchase_items
  FOR ALL TO authenticated 
  USING (organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid()));

-- Step 5: Create SALES table (multi-tenant)
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

-- Enable RLS on sales (multi-tenant)
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Multi-tenant policy for sales
CREATE POLICY "Multi-tenant sales access" ON public.sales
  FOR ALL TO authenticated 
  USING (organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid()));

-- Block anonymous access to sales
CREATE POLICY "Block anonymous sales access" ON public.sales
  FOR ALL TO anon USING (false);

-- Step 6: Create SALE_ITEMS table (multi-tenant)
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

-- Enable RLS on sale_items (multi-tenant)
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- Multi-tenant policy for sale_items
CREATE POLICY "Multi-tenant sale items access" ON public.sale_items
  FOR ALL TO authenticated 
  USING (organization_id = (SELECT organization_id FROM auth.users WHERE id = auth.uid()));

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_purchases_organization_id ON public.purchases(organization_id);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier_id ON public.purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON public.purchases(purchase_date);

CREATE INDEX IF NOT EXISTS idx_sales_organization_id ON public.sales(organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON public.sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales(sale_date);

CREATE INDEX IF NOT EXISTS idx_purchase_items_organization_id ON public.purchase_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_organization_id ON public.sale_items(organization_id);

-- Step 8: Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_brands_updated_at 
  BEFORE UPDATE ON public.brands 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at 
  BEFORE UPDATE ON public.purchases 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at 
  BEFORE UPDATE ON public.sales 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- Verification
SELECT 
  'Missing tables created with multi-tenant security' as result,
  (SELECT COUNT(*) FROM public.brands) as brands_count,
  (SELECT COUNT(*) FROM public.purchases) as purchases_count,
  (SELECT COUNT(*) FROM public.sales) as sales_count;
