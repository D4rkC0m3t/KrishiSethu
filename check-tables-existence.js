const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkTablesExistence() {
  console.log('🔍 CHECKING WHICH TABLES EXIST AND CONTAIN DATA');
  console.log('===============================================');
  
  const tablesToCheck = [
    'purchases', 'suppliers', 'customers', 'products', 
    'sales', 'stock_movements', 'categories', 'brands'
  ];
  
  const existingTables = [];
  const tablesWithData = [];
  
  for (const table of tablesToCheck) {
    console.log(`\n🧪 Checking ${table}...`);
    
    try {
      // Try to query the table
      const { data, error, count } = await supabase
        .from(table)
        .select('id, organization_id, created_at', { count: 'exact' })
        .limit(5);
        
      if (error) {
        if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
          console.log(`❌ Table '${table}' does not exist`);
        } else {
          console.log(`⚠️  Table '${table}' exists but error: ${error.message}`);
          existingTables.push(table);
        }
      } else {
        console.log(`✅ Table '${table}' exists`);
        existingTables.push(table);
        
        console.log(`   Total records: ${count}`);
        
        if (data && data.length > 0) {
          tablesWithData.push({ table, count, sample: data });
          
          // Check organization_id distribution
          const orgIds = [...new Set(data.map(row => row.organization_id).filter(id => id))];
          const nullOrgCount = data.filter(row => !row.organization_id).length;
          
          console.log(`   Sample records: ${data.length}`);
          console.log(`   Records with organization_id: ${data.length - nullOrgCount}`);
          console.log(`   Records without organization_id: ${nullOrgCount}`);
          console.log(`   Different organizations: ${orgIds.length}`);
          
          if (orgIds.length > 0) {
            console.log(`   Organization IDs: ${orgIds.map(id => id.substring(0, 8)).join(', ')}`);
          }
        } else {
          console.log(`   No records found`);
        }
      }
    } catch (err) {
      console.log(`❌ Failed to check ${table}:`, err.message);
    }
  }
  
  console.log('\n📊 SUMMARY');
  console.log('===========');
  console.log(`✅ Existing tables: ${existingTables.join(', ')}`);
  console.log(`📋 Tables with data: ${tablesWithData.map(t => `${t.table}(${t.count})`).join(', ')}`);
  
  console.log('\n🔒 MULTI-TENANT ISSUES DETECTED:');
  console.log('=================================');
  
  // Analyze multi-tenant violations
  const violations = [];
  
  for (const tableData of tablesWithData) {
    const { table, sample } = tableData;
    const orgIds = [...new Set(sample.map(row => row.organization_id).filter(id => id))];
    
    if (orgIds.length > 1) {
      violations.push({
        table,
        issue: 'Multiple organizations visible',
        organizations: orgIds.length
      });
    }
    
    const nullOrgCount = sample.filter(row => !row.organization_id).length;
    if (nullOrgCount > 0 && !['categories', 'brands', 'products'].includes(table)) {
      violations.push({
        table,
        issue: 'Records without organization_id',
        count: nullOrgCount
      });
    }
  }
  
  if (violations.length > 0) {
    console.log('⚠️  VIOLATIONS FOUND:');
    violations.forEach(v => {
      console.log(`   - ${v.table}: ${v.issue} (${v.organizations || v.count})`);
    });
    
    console.log('\n💡 RECOMMENDED ACTIONS:');
    console.log('1. Run CLEANUP-MULTITENANT-FINAL.sql to fix RLS policies');
    console.log('2. Clean up old test data');  
    console.log('3. Enforce strict multi-tenant isolation');
  } else {
    console.log('✅ No multi-tenant violations detected');
  }
}

checkTablesExistence().catch(console.error);
