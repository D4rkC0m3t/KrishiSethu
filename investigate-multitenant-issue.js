const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function investigateMultiTenantIssues() {
  console.log('🔍 INVESTIGATING MULTI-TENANT POLICY ISSUES');
  console.log('============================================');
  
  // Check current authentication status
  const { data: { user } } = await supabase.auth.getUser();
  console.log('Current user:', user?.email || 'Not authenticated (Anonymous)');
  console.log('User ID:', user?.id || 'No user ID');
  
  console.log('\n📋 CHECKING OLD DATA IN TABLES');
  console.log('===============================');
  
  // Check purchases table
  console.log('🔍 Checking purchases table...');
  const { data: purchases, error: purchasesError } = await supabase
    .from('purchases')
    .select('id, created_at, organization_id, supplier_name, total_amount')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (purchasesError) {
    console.log('❌ Purchases query error:', purchasesError.message);
  } else {
    console.log(`📊 Found ${purchases.length} purchases records:`);
    purchases.forEach((purchase, i) => {
      console.log(`  ${i+1}. ID: ${purchase.id.substring(0, 8)}... | Org: ${purchase.organization_id?.substring(0, 8) || 'NULL'}... | Supplier: ${purchase.supplier_name || 'N/A'} | Amount: ${purchase.total_amount || 0}`);
    });
  }
  
  // Check suppliers table
  console.log('\n🔍 Checking suppliers table...');
  const { data: suppliers, error: suppliersError } = await supabase
    .from('suppliers')
    .select('id, created_at, organization_id, name, email, phone')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (suppliersError) {
    console.log('❌ Suppliers query error:', suppliersError.message);
  } else {
    console.log(`📊 Found ${suppliers.length} suppliers records:`);
    suppliers.forEach((supplier, i) => {
      console.log(`  ${i+1}. ID: ${supplier.id.substring(0, 8)}... | Org: ${supplier.organization_id?.substring(0, 8) || 'NULL'}... | Name: ${supplier.name || 'N/A'} | Email: ${supplier.email || 'N/A'}`);
    });
  }
  
  // Check customers table too
  console.log('\n🔍 Checking customers table...');
  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('id, created_at, organization_id, name, email, phone')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (customersError) {
    console.log('❌ Customers query error:', customersError.message);
  } else {
    console.log(`📊 Found ${customers.length} customers records:`);
    customers.forEach((customer, i) => {
      console.log(`  ${i+1}. ID: ${customer.id.substring(0, 8)}... | Org: ${customer.organization_id?.substring(0, 8) || 'NULL'}... | Name: ${customer.name || 'N/A'} | Email: ${customer.email || 'N/A'}`);
    });
  }
  
  console.log('\n🔒 ANALYZING RLS POLICIES');
  console.log('=========================');
  
  // Check if we can see data that shouldn't be visible
  console.log('🧪 Testing multi-tenant isolation...');
  
  const testQueries = [
    { table: 'purchases', description: 'Purchases multi-tenancy' },
    { table: 'suppliers', description: 'Suppliers multi-tenancy' }, 
    { table: 'customers', description: 'Customers multi-tenancy' },
    { table: 'products', description: 'Products multi-tenancy' }
  ];
  
  for (const query of testQueries) {
    const { data, error } = await supabase
      .from(query.table)
      .select('id, organization_id')
      .limit(5);
      
    if (!error && data) {
      const orgIds = [...new Set(data.map(row => row.organization_id).filter(id => id))];
      console.log(`${query.description}: Found ${data.length} records from ${orgIds.length} different organizations`);
      
      if (orgIds.length > 1) {
        console.log(`⚠️  MULTI-TENANT VIOLATION: Seeing data from multiple organizations!`);
        console.log(`   Organization IDs: ${orgIds.map(id => id?.substring(0, 8)).join(', ')}`);
      } else if (orgIds.length === 1) {
        console.log(`✅ Single organization data: ${orgIds[0]?.substring(0, 8)}`);
      } else {
        console.log(`⚠️  No organization_id values found - possibly universal data`);
      }
    } else if (error) {
      console.log(`${query.description}: RLS blocking (${error.message})`);
    }
  }
  
  console.log('\n🎯 ROOT CAUSE ANALYSIS');
  console.log('======================');
  console.log('Issues detected:');
  console.log('1. Old test/development data still in database');
  console.log('2. RLS policies may not be properly filtering by organization');
  console.log('3. Anonymous users might be seeing cross-tenant data');
  console.log('4. Need to clean old data and fix RLS policies');
}

investigateMultiTenantIssues().catch(console.error);
