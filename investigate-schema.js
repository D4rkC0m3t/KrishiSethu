#!/usr/bin/env node

/**
 * Investigate the actual database schema structure
 * to understand the multi-tenancy setup
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lnljcgttcdhrduixirgf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubGpjZ3R0Y2RocmR1aXhpcmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NTI0NDMsImV4cCI6MjA3MTUyODQ0M30.pGQ02RsrhIW7OZNf4DYl3Oo855Bo3r-GRuu7XFeTmmo';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function investigateTableSchema(tableName) {
  console.log(`\n🔍 INVESTIGATING: ${tableName.toUpperCase()}`);
  console.log('='.repeat(50));
  
  try {
    // Try to get one record to see the actual structure
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`❌ Cannot query ${tableName}:`, error.message);
      return;
    }
    
    // Try to understand what columns exist by attempting different inserts
    console.log(`📋 Testing column requirements for ${tableName}...`);
    
    // Test basic insert
    let testData = {
      name: `TEST_${tableName.toUpperCase()}`,
    };
    
    if (tableName === 'categories') {
      testData.description = 'Test category';
      testData.sort_order = 1;
    } else if (tableName === 'brands') {
      testData.description = 'Test brand';
    }
    
    const { error: insertError } = await supabase
      .from(tableName)
      .insert(testData);
    
    console.log(`🧪 Insert test result:`, insertError?.message || 'SUCCESS');
    
    if (insertError) {
      // Parse the error to understand missing required fields
      const message = insertError.message;
      
      if (message.includes('null value in column')) {
        const match = message.match(/null value in column "([^"]+)"/);
        if (match) {
          console.log(`📋 Required column: ${match[1]} (NOT NULL)`);
          
          // If it needs organization_id, let's see what that should be
          if (match[1] === 'organization_id') {
            console.log(`🏢 ${tableName} requires organization_id - this is TENANT-SPECIFIC data`);
            console.log(`💡 This means ${tableName} is NOT universal, each organization has their own ${tableName}`);
          }
        }
      }
      
      if (message.includes('violates check constraint')) {
        console.log(`📋 Has check constraints (enum values or other restrictions)`);
      }
      
      if (message.includes('violates row-level security')) {
        console.log(`🔒 RLS policy blocks this operation`);
      }
    }
    
    // Clean up test record if it was created
    if (!insertError) {
      await supabase.from(tableName).delete().eq('name', `TEST_${tableName.toUpperCase()}`);
      console.log(`🧹 Cleaned up test record`);
    }
    
  } catch (err) {
    console.log(`❌ Investigation error:`, err.message);
  }
}

async function checkAuthUser() {
  console.log('\n🔐 CHECKING AUTH STATE');
  console.log('='.repeat(50));
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (user) {
      console.log('✅ Authenticated user:', user.id);
      console.log('📧 Email:', user.email);
      console.log('🏢 User metadata:', user.user_metadata);
    } else {
      console.log('❌ No authenticated user (anonymous)');
      console.log('💡 This might be why organization_id is NULL');
    }
  } catch (err) {
    console.log('❌ Auth check error:', err.message);
  }
}

async function main() {
  console.log('🔬 MULTI-TENANCY SCHEMA INVESTIGATION');
  console.log('=====================================');
  console.log('Understanding which tables are universal vs tenant-specific');
  console.log('');
  
  await checkAuthUser();
  
  // Test both categories and brands to understand the pattern
  await investigateTableSchema('categories');
  await investigateTableSchema('brands');
  await investigateTableSchema('products');
  
  console.log('');
  console.log('🎯 ANALYSIS SUMMARY:');
  console.log('====================');
  console.log('');
  console.log('Based on the investigation:');
  console.log('- Tables requiring organization_id = TENANT-SPECIFIC');
  console.log('- Tables without organization_id = UNIVERSAL/SHARED');
  console.log('');
  console.log('💡 RECOMMENDATIONS:');
  console.log('1. If categories should be universal → remove organization_id requirement');
  console.log('2. If categories should be tenant-specific → need proper organization context');
  console.log('3. Same logic applies to brands');
  console.log('');
}

main().catch(console.error);
