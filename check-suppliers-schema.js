const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkSuppliersSchema() {
  console.log('🔍 CHECKING ACTUAL SUPPLIERS TABLE SCHEMA');
  console.log('==========================================');
  
  try {
    // Method 1: Try to get the table structure via information_schema
    console.log('\n📋 Method 1: Checking via information_schema...');
    
    // Skip the RPC method as it's not available
    console.log('⚠️ RPC method not available, using insert method to discover schema');
    
    // Method 2: Try inserting with minimal data to see what's required
    console.log('\n🧪 Method 2: Testing minimal insert to identify required fields...');
    
    const testSupplier = {
      name: 'Schema Test Supplier',
      contact_person: 'Test Person',
      phone: '1234567890'
    };
    
    const { error: insertError } = await supabase
      .from('suppliers')
      .insert([testSupplier]);
      
    if (insertError) {
      console.log('❌ Minimal insert failed:', insertError.message);
      
      // Parse the error to understand what columns are required
      if (insertError.message.includes('violates not-null constraint')) {
        const match = insertError.message.match(/column "([^"]+)"/);
        if (match) {
          console.log(`💡 Required column missing: ${match[1]}`);
        }
      }
    } else {
      console.log('✅ Minimal insert succeeded! Cleaning up...');
      await supabase.from('suppliers').delete().eq('name', 'Schema Test Supplier');
    }
    
    // Method 3: Try to understand the current table structure by attempting various inserts
    console.log('\n🔬 Method 3: Testing common required fields...');
    
    const commonFields = [
      'created_by',
      'organization_id', 
      'created_at',
      'updated_at'
    ];
    
    console.log('Common audit fields that might be required:', commonFields.join(', '));
    
  } catch (err) {
    console.log('❌ Schema check error:', err.message);
  }
}

checkSuppliersSchema().catch(console.error);
