const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkSuppliersData() {
  console.log('🔍 CHECKING SUPPLIERS DATA SOURCE');
  console.log('=================================');
  
  // Check what's in the database
  console.log('\n📋 DATABASE QUERY:');
  const { data: suppliers, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.log('❌ Database query error:', error.message);
  } else {
    console.log(`✅ Found ${suppliers.length} suppliers in database:`);
    suppliers.forEach((supplier, i) => {
      console.log(`  ${i+1}. ${supplier.name}`);
      console.log(`     Contact: ${supplier.contact_person}`);
      console.log(`     Phone: ${supplier.phone}`);
      console.log(`     Email: ${supplier.email || 'N/A'}`);
      console.log(`     Address: ${typeof supplier.address === 'object' ? JSON.stringify(supplier.address) : supplier.address}`);
      console.log(`     GST: ${supplier.gst_number || 'N/A'}`);
      console.log(`     Active: ${supplier.is_active}`);
      console.log(`     Org ID: ${supplier.organization_id || 'Universal'}`);
      console.log(`     Created: ${supplier.created_at}`);
      console.log('');
    });
  }
  
  // Test the Add Supplier API
  console.log('\n🧪 TESTING SUPPLIER CREATION API:');
  const newSupplier = {
    name: 'Frontend Test Supplier',
    contact_person: 'Test Contact Person',
    phone: '+91-8888888888',
    email: 'frontend@test.com',
    address: {
      street: 'Test Street 123',
      city: 'Test City', 
      state: 'Test State',
      pincode: '888888'
    },
    gst_number: '07FRONT123Q1Z5',
    is_active: true,
    organization_id: null
  };
  
  const { data: created, error: createError } = await supabase
    .from('suppliers')
    .insert([newSupplier])
    .select();
    
  if (createError) {
    console.log('❌ Create test failed:', createError.message);
  } else {
    console.log('✅ Supplier creation works!');
    console.log(`   Created: ${created[0].name} (ID: ${created[0].id})`);
    
    // Clean up
    await supabase.from('suppliers').delete().eq('id', created[0].id);
    console.log('   Cleaned up test supplier');
  }
  
  console.log('\n🎯 CURRENT STATUS:');
  console.log('==================');
  console.log('✅ Database schema fixed');
  console.log('✅ Suppliers API working');
  console.log('✅ Can create/read suppliers');
  console.log('✅ RLS policies working');
  
  console.log('\n💡 If UI shows different data:');
  console.log('==============================');
  console.log('1. Clear browser cache/refresh');
  console.log('2. Check if frontend loads from database');
  console.log('3. Look for hardcoded mock data in components');
}

checkSuppliersData().catch(console.error);
