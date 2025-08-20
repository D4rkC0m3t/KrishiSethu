-- =====================================================
-- KRISHISETHU INVENTORY MANAGEMENT - E-INVOICE SCHEMA
-- =====================================================
-- Run this script in Supabase SQL Editor to create E-Invoice tables
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean recreation)
DROP TABLE IF EXISTS public.einvoice_items CASCADE;
DROP TABLE IF EXISTS public.einvoices CASCADE;

-- Create the main einvoices table
CREATE TABLE public.einvoices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_type TEXT DEFAULT 'b2b',
  status TEXT DEFAULT 'draft',
  
  -- Date fields
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  supply_date_time TIMESTAMP WITH TIME ZONE,
  
  -- Seller details (from system settings)
  seller_gstin TEXT NOT NULL DEFAULT '29ABCDE1234F1Z5',
  seller_name TEXT NOT NULL DEFAULT 'Krishisethu Agro Solutions',
  seller_address JSONB NOT NULL DEFAULT '{"street": "", "city": "", "state": "", "pincode": ""}',
  seller_state_code TEXT NOT NULL DEFAULT '29',
  seller_phone TEXT,
  seller_email TEXT,
  
  -- Buyer details
  customer_id UUID,
  buyer_gstin TEXT,
  buyer_name TEXT NOT NULL,
  buyer_address JSONB NOT NULL DEFAULT '{"street": "", "city": "", "state": "", "pincode": ""}',
  buyer_state_code TEXT,
  buyer_phone TEXT,
  buyer_email TEXT,
  buyer_contact_person TEXT,
  
  -- Consignee details
  consignee_name TEXT,
  consignee_gstin TEXT,
  consignee_address JSONB,
  consignee_state_code TEXT,
  consignee_phone TEXT,
  consignee_email TEXT,
  consignee_contact_person TEXT,
  
  -- Place of supply
  place_of_supply TEXT NOT NULL,
  place_of_supply_code TEXT NOT NULL DEFAULT '29',
  reverse_charge BOOLEAN DEFAULT false,
  invoice_category TEXT DEFAULT 'Regular',
  
  -- Financial totals
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_discount DECIMAL(15,2) DEFAULT 0,
  total_taxable_value DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_cgst DECIMAL(15,2) DEFAULT 0,
  total_sgst DECIMAL(15,2) DEFAULT 0,
  total_igst DECIMAL(15,2) DEFAULT 0,
  total_cess DECIMAL(15,2) DEFAULT 0,
  total_tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  round_off DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  
  -- Payment details
  payment_method TEXT DEFAULT 'cash',
  payment_terms TEXT,
  amount_paid DECIMAL(15,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'pending',
  
  -- E-way bill details
  ewaybill_number TEXT,
  ewaybill_date DATE,
  vehicle_number TEXT,
  transporter_id TEXT,
  transporter_name TEXT,
  transport_mode TEXT,
  transport_distance INTEGER,
  
  -- Dispatch details
  dispatch_from_name TEXT,
  dispatch_from_address JSONB,
  dispatch_to_name TEXT,
  dispatch_to_address JSONB,
  
  -- Government portal fields
  irn TEXT UNIQUE,
  ack_number TEXT,
  ack_date TIMESTAMP WITH TIME ZONE,
  qr_code_data TEXT,
  signed_invoice JSONB,
  
  -- Reference fields for credit/debit notes
  reference_invoice_number TEXT,
  reference_invoice_date DATE,
  original_invoice_number TEXT,
  reason_for_credit_debit TEXT,
  
  -- Additional fields
  notes TEXT,
  terms_and_conditions TEXT,
  bank_details JSONB,
  previous_outstanding DECIMAL(15,2) DEFAULT 0,
  
  -- Audit fields
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the einvoice_items table
CREATE TABLE public.einvoice_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  einvoice_id UUID REFERENCES einvoices(id) ON DELETE CASCADE,
  
  -- Product details
  product_id UUID,
  product_name TEXT NOT NULL,
  product_code TEXT,
  description TEXT,
  
  -- HSN and UQC
  hsn_code TEXT NOT NULL DEFAULT '38089199',
  uqc TEXT DEFAULT 'KGS',
  
  -- Quantity and pricing
  quantity DECIMAL(12,3) NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  gross_amount DECIMAL(15,2) NOT NULL,
  
  -- Discount
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  taxable_value DECIMAL(15,2) NOT NULL,
  
  -- GST rates
  gst_rate DECIMAL(5,2) NOT NULL DEFAULT 18.00,
  cgst_rate DECIMAL(5,2) DEFAULT 0,
  sgst_rate DECIMAL(5,2) DEFAULT 0,
  igst_rate DECIMAL(5,2) DEFAULT 0,
  cess_rate DECIMAL(5,2) DEFAULT 0,
  
  -- GST amounts
  cgst_amount DECIMAL(12,2) DEFAULT 0,
  sgst_amount DECIMAL(12,2) DEFAULT 0,
  igst_amount DECIMAL(12,2) DEFAULT 0,
  cess_amount DECIMAL(12,2) DEFAULT 0,
  total_gst_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  
  -- Total amount
  total_amount DECIMAL(15,2) NOT NULL,
  
  -- Additional item details
  batch_number TEXT,
  manufacturing_date DATE,
  expiry_date DATE,
  item_serial_number INTEGER NOT NULL DEFAULT 1,
  free_quantity DECIMAL(12,3) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_einvoices_invoice_number ON einvoices(invoice_number);
CREATE INDEX idx_einvoices_customer_id ON einvoices(customer_id);
CREATE INDEX idx_einvoices_invoice_date ON einvoices(invoice_date);
CREATE INDEX idx_einvoices_status ON einvoices(status);
CREATE INDEX idx_einvoices_irn ON einvoices(irn);
CREATE INDEX idx_einvoices_created_at ON einvoices(created_at);
CREATE INDEX idx_einvoice_items_einvoice_id ON einvoice_items(einvoice_id);
CREATE INDEX idx_einvoice_items_product_id ON einvoice_items(product_id);

-- Enable Row Level Security (RLS)
ALTER TABLE einvoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE einvoice_items ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Enable read access for all users" ON einvoices FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON einvoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON einvoices FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON einvoices FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON einvoice_items FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON einvoice_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON einvoice_items FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON einvoice_items FOR DELETE USING (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_einvoices_updated_at BEFORE UPDATE ON einvoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO einvoices (invoice_number, buyer_name, total_amount, status) 
VALUES ('INV-2024-001', 'Sample Customer', 1000.00, 'draft');

COMMENT ON TABLE einvoices IS 'Comprehensive E-Invoice table for GST compliance';
COMMENT ON TABLE einvoice_items IS 'Line items for E-Invoices with detailed GST breakdown';

-- Grant permissions
GRANT ALL ON einvoices TO anon, authenticated;
GRANT ALL ON einvoice_items TO anon, authenticated;
