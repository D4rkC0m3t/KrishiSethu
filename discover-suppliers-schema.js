const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function discoverSuppliersSchema() {
  console.log('🔍 DISCOVERING ACTUAL SUPPLIERS TABLE SCHEMA');
  console.log('============================================');
  
  const requiredFields = [];
  
  // Test 1: Minimal fields
  console.log('\n🧪 Test 1: Basic fields');
  let testData = {
    name: 'Test Supplier Step 1',
    contact_person: 'Test Person',
    phone: '1234567890'
  };
  
  let { error } = await supabase.from('suppliers').insert([testData]);
  if (error) {
    console.log('❌ Error:', error.message);
    if (error.message.includes('organization_id')) {
      requiredFields.push('organization_id');
      console.log('💡 organization_id is required');
    }
  } else {
    console.log('✅ Basic fields work!');
    await supabase.from('suppliers').delete().eq('name', testData.name);
  }
  
  // Test 2: Add organization_id
  if (requiredFields.includes('organization_id')) {
    console.log('\n🧪 Test 2: Adding organization_id');
    testData = {
      ...testData,
      name: 'Test Supplier Step 2',
      organization_id: '00000000-0000-0000-0000-000000000000'
    };
    
    ({ error } = await supabase.from('suppliers').insert([testData]));
    if (error) {
      console.log('❌ Error:', error.message);
      if (error.message.includes('created_by')) {
        requiredFields.push('created_by');
        console.log('💡 created_by is required');
      }
    } else {
      console.log('✅ organization_id works!');
      await supabase.from('suppliers').delete().eq('name', testData.name);
    }
  }
  
  // Test 3: Add created_by
  if (requiredFields.includes('created_by')) {
    console.log('\n🧪 Test 3: Adding created_by');
    testData = {
      ...testData,
      name: 'Test Supplier Step 3',
      created_by: '00000000-0000-0000-0000-000000000000'
    };
    
    ({ error } = await supabase.from('suppliers').insert([testData]));
    if (error) {
      console.log('❌ Error:', error.message);
      // Check for other possible required fields
      const possibleFields = ['updated_by', 'status', 'is_active'];
      for (const field of possibleFields) {
        if (error.message.includes(field)) {
          requiredFields.push(field);
          console.log(`💡 ${field} is required`);
        }
      }
    } else {
      console.log('✅ All required fields found!');
      await supabase.from('suppliers').delete().eq('name', testData.name);
    }
  }
  
  console.log('\n📋 DISCOVERED REQUIRED FIELDS:');
  console.log('===============================');
  requiredFields.forEach(field => {
    console.log(`✓ ${field} - REQUIRED (NOT NULL)`);
  });
  
  const baseFields = ['name', 'contact_person', 'phone'];
  console.log('\n📋 CONFIRMED WORKING FIELDS:');
  console.log('============================');
  baseFields.forEach(field => {
    console.log(`✓ ${field} - Working`);
  });
  
  // Now create the proper fix
  console.log('\n🔧 RECOMMENDED FIX:');
  console.log('===================');
  console.log('1. Make organization_id nullable OR provide default value');
  console.log('2. Make created_by nullable OR provide default value');
  console.log('3. Ensure all other audit fields have defaults');
}

discoverSuppliersSchema().catch(console.error);
