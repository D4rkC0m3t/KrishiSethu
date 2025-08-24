-- =====================================================
-- FINAL FIX: PRODUCTS RLS POLICIES
-- Allows anonymous users to insert products for testing
-- Run this in Supabase SQL Editor Dashboard
-- =====================================================

-- Fix Products RLS policies to allow anonymous inserts
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;
DROP POLICY IF EXISTS "Users can view products in their organization" ON public.products;
DROP POLICY IF EXISTS "Anonymous users can view products" ON public.products;

-- Create permissive policies for development
CREATE POLICY "Everyone can view products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Everyone can insert products" ON public.products
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can manage products" ON public.products
  FOR ALL TO authenticated USING (true);

-- Verification query
SELECT 'Products RLS policies updated for universal access' as result;
