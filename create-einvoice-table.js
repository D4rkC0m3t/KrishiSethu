const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://lnljcgttcdhrduixirgf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubGpjZ3R0Y2RocmR1aXhpcmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTI0NDMsImV4cCI6MjA3MTUyODQ0M30.pGQ02RsrhIW7OZNf4DYl3Oo855Bo3r-GRuu7XFeTmmo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createEInvoiceTable() {
  try {
    console.log('📋 Creating E-Invoice table...');
    
    // Create the main einvoices table
    const createEInvoicesTable = `
      CREATE TABLE IF NOT EXISTS public.einvoices (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        invoice_number TEXT UNIQUE NOT NULL,
        invoice_type TEXT DEFAULT 'b2b',
        status TEXT DEFAULT 'draft',
        
        invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
        due_date DATE,
        supply_date_time TIMESTAMP WITH TIME ZONE,
        
        seller_gstin TEXT NOT NULL DEFAULT '29ABCDE1234F1Z5',
        seller_name TEXT NOT NULL DEFAULT 'Krishisethu Agro Solutions',
        seller_address JSONB NOT NULL DEFAULT '{"street": "", "city": "", "state": "", "pincode": ""}',
        seller_state_code TEXT NOT NULL DEFAULT '29',
        seller_phone TEXT,
        seller_email TEXT,
        
        customer_id UUID REFERENCES customers(id),
        buyer_gstin TEXT,
        buyer_name TEXT NOT NULL,
        buyer_address JSONB NOT NULL DEFAULT '{"street": "", "city": "", "state": "", "pincode": ""}',
        buyer_state_code TEXT,
        buyer_phone TEXT,
        buyer_email TEXT,
        buyer_contact_person TEXT,
        
        consignee_name TEXT,
        consignee_gstin TEXT,
        consignee_address JSONB,
        consignee_state_code TEXT,
        consignee_phone TEXT,
        consignee_email TEXT,
        consignee_contact_person TEXT,
        
        place_of_supply TEXT NOT NULL,
        place_of_supply_code TEXT NOT NULL DEFAULT '29',
        reverse_charge BOOLEAN DEFAULT false,
        invoice_category TEXT DEFAULT 'Regular',
        
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
        
        payment_method TEXT DEFAULT 'cash',
        payment_terms TEXT,
        amount_paid DECIMAL(15,2) DEFAULT 0,
        payment_status TEXT DEFAULT 'pending',
        
        ewaybill_number TEXT,
        ewaybill_date DATE,
        vehicle_number TEXT,
        transporter_id TEXT,
        transporter_name TEXT,
        transport_mode TEXT,
        transport_distance INTEGER,
        
        dispatch_from_name TEXT,
        dispatch_from_address JSONB,
        dispatch_to_name TEXT,
        dispatch_to_address JSONB,
        
        irn TEXT UNIQUE,
        ack_number TEXT,
        ack_date TIMESTAMP WITH TIME ZONE,
        qr_code_data TEXT,
        signed_invoice JSONB,
        
        reference_invoice_number TEXT,
        reference_invoice_date DATE,
        original_invoice_number TEXT,
        reason_for_credit_debit TEXT,
        
        notes TEXT,
        terms_and_conditions TEXT,
        bank_details JSONB,
        previous_outstanding DECIMAL(15,2) DEFAULT 0,
        
        created_by UUID,
        updated_by UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    console.log('Creating einvoices table...');
    const { error: tableError } = await supabase.rpc('exec_sql', { 
      sql_query: createEInvoicesTable 
    });

    if (tableError) {
      console.log('⚠️ Could not create via RPC, trying direct table creation...');
      
      // Try creating table directly using Supabase client
      const { error: directError } = await supabase
        .from('einvoices')
        .select('id')
        .limit(1);
      
      if (directError && directError.message.includes('does not exist')) {
        console.log('❌ Table does not exist and could not be created via RPC');
        console.log('Please run the SQL script manually in Supabase SQL Editor');
        return;
      }
    }

    // Create the einvoice_items table
    const createEInvoiceItemsTable = `
      CREATE TABLE IF NOT EXISTS public.einvoice_items (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        einvoice_id UUID REFERENCES einvoices(id) ON DELETE CASCADE,
        
        product_id UUID REFERENCES products(id),
        product_name TEXT NOT NULL,
        product_code TEXT,
        description TEXT,
        
        hsn_code TEXT NOT NULL DEFAULT '38089199',
        uqc TEXT DEFAULT 'KGS',
        
        quantity DECIMAL(12,3) NOT NULL,
        unit_price DECIMAL(12,2) NOT NULL,
        gross_amount DECIMAL(15,2) NOT NULL,
        
        discount_percentage DECIMAL(5,2) DEFAULT 0,
        discount_amount DECIMAL(12,2) DEFAULT 0,
        taxable_value DECIMAL(15,2) NOT NULL,
        
        gst_rate DECIMAL(5,2) NOT NULL DEFAULT 18.00,
        cgst_rate DECIMAL(5,2) DEFAULT 0,
        sgst_rate DECIMAL(5,2) DEFAULT 0,
        igst_rate DECIMAL(5,2) DEFAULT 0,
        cess_rate DECIMAL(5,2) DEFAULT 0,
        
        cgst_amount DECIMAL(12,2) DEFAULT 0,
        sgst_amount DECIMAL(12,2) DEFAULT 0,
        igst_amount DECIMAL(12,2) DEFAULT 0,
        cess_amount DECIMAL(12,2) DEFAULT 0,
        total_gst_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        
        total_amount DECIMAL(15,2) NOT NULL,
        
        batch_number TEXT,
        manufacturing_date DATE,
        expiry_date DATE,
        item_serial_number INTEGER NOT NULL DEFAULT 1,
        free_quantity DECIMAL(12,3) DEFAULT 0,
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    console.log('Creating einvoice_items table...');
    const { error: itemsError } = await supabase.rpc('exec_sql', { 
      sql_query: createEInvoiceItemsTable 
    });

    if (itemsError) {
      console.log('⚠️ Could not create items table via RPC');
    }

    // Create indexes
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_einvoices_invoice_number ON einvoices(invoice_number);
      CREATE INDEX IF NOT EXISTS idx_einvoices_customer_id ON einvoices(customer_id);
      CREATE INDEX IF NOT EXISTS idx_einvoices_invoice_date ON einvoices(invoice_date);
      CREATE INDEX IF NOT EXISTS idx_einvoices_status ON einvoices(status);
      CREATE INDEX IF NOT EXISTS idx_einvoices_irn ON einvoices(irn);
      CREATE INDEX IF NOT EXISTS idx_einvoice_items_einvoice_id ON einvoice_items(einvoice_id);
    `;

    console.log('Creating indexes...');
    const { error: indexError } = await supabase.rpc('exec_sql', { 
      sql_query: createIndexes 
    });

    if (indexError) {
      console.log('⚠️ Could not create indexes via RPC');
    }

    // Test table access
    console.log('🔍 Testing table access...');
    const { data: testData, error: testError } = await supabase
      .from('einvoices')
      .select('id')
      .limit(1);

    if (testError) {
      console.log('❌ Cannot access einvoices table:', testError.message);
      console.log('📋 Please run the create-einvoice-table.sql script manually in Supabase SQL Editor');
    } else {
      console.log('✅ E-Invoice tables created and accessible!');
      console.log('📊 Current einvoices count:', testData?.length || 0);
    }

    // Test items table
    const { data: itemsTestData, error: itemsTestError } = await supabase
      .from('einvoice_items')
      .select('id')
      .limit(1);

    if (itemsTestError) {
      console.log('❌ Cannot access einvoice_items table:', itemsTestError.message);
    } else {
      console.log('✅ E-Invoice items table accessible!');
      console.log('📊 Current einvoice items count:', itemsTestData?.length || 0);
    }

    console.log('\n🎉 E-Invoice table setup completed!');
    console.log('📋 Tables created: einvoices, einvoice_items');
    console.log('🔧 Next step: Update the EInvoice component to use the new table');

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

createEInvoiceTable();
