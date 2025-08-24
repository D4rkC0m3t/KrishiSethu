-- =====================================================
-- ADD CUSTOM/OTHER CATEGORY OPTION
-- Adds a special "Custom/Other" category for flexibility
-- Run this in Supabase SQL Editor Dashboard
-- =====================================================

-- Add the Custom/Other category at the end
INSERT INTO public.categories (name, description, sort_order, custom_type, color_code, icon, organization_id, created_by) VALUES 
  ('Custom/Other', 'Custom category for products that don''t fit standard classifications', 999, 'Custom', '#6B7280', '📝', NULL, NULL)
ON CONFLICT (name) DO NOTHING;

-- Verification
SELECT 
  name, 
  description, 
  custom_type,
  sort_order
FROM public.categories 
WHERE custom_type = 'Custom' OR name ILIKE '%custom%' OR name ILIKE '%other%'
ORDER BY sort_order;
