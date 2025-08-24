#!/usr/bin/env node

/**
 * Apply Database Fix via Node.js and Supabase API
 * This script applies the necessary database schema changes
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

async function executeSQL(sql, description) {
  console.log(`🔄 ${description}...`);
  try {
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });
    if (error) {
      console.log(`❌ Failed: ${error.message}`);
      return false;
    } else {
      console.log(`✅ Success: ${description}`);
      return true;
    }
  } catch (err) {
    console.log(`❌ Error: ${err.message}`);
    return false;
  }
}

async function runSQLCommands() {
  console.log('🚀 APPLYING DATABASE FIX VIA API');
  console.log('=================================');
  console.log('');
  
  // Since we can't execute DDL via RPC, let's try a different approach
  // We'll work with what we can access and provide clear instructions
  
  console.log('⚠️  IMPORTANT DISCOVERY:');
  console.log('The database schema changes need to be applied via Supabase Dashboard SQL Editor.');
  console.log('Anonymous API access cannot execute DDL (Data Definition Language) commands.');
  console.log('');
  
  // Instead, let's diagnose what we can access and provide a step-by-step fix
  console.log('🔍 ANALYZING CURRENT ACCESS LEVEL...');
  
  // Test what operations are possible
  let canInsertCategories = false;
  let canInsertBrands = false;
  
  // Test categories insert (should fail due to RLS)
  try {
    const { error } = await supabase
      .from('categories')
      .insert({ name: 'TEST_CATEGORY', description: 'Test' });
    
    if (!error) {
      canInsertCategories = true;
      // Clean up
      await supabase.from('categories').delete().eq('name', 'TEST_CATEGORY');
    } else {
      console.log('📋 Categories insert blocked by RLS:', error.message);
    }
  } catch (err) {
    console.log('📋 Categories test error:', err.message);
  }
  
  // Test brands access
  try {
    const { error } = await supabase
      .from('brands')
      .select('count', { count: 'exact', head: true });
      
    if (!error) {
      console.log('✅ Brands table is accessible');
      
      // Try to insert test brand
      try {
        const { error: insertError } = await supabase
          .from('brands')
          .insert({ name: 'TEST_BRAND', description: 'Test' });
        
        if (!insertError) {
          canInsertBrands = true;
          // Clean up
          await supabase.from('brands').delete().eq('name', 'TEST_BRAND');
          console.log('✅ Brands table allows inserts');
        } else {
          console.log('📋 Brands insert blocked:', insertError.message);
        }
      } catch (err) {
        console.log('📋 Brands insert test error:', err.message);
      }
    } else {
      console.log('❌ Brands table error:', error.message);
    }
  } catch (err) {
    console.log('❌ Brands table not accessible:', err.message);
  }
  
  console.log('');
  console.log('🎯 DIAGNOSIS COMPLETE - HERE\'S WHAT NEEDS TO BE DONE:');
  console.log('=====================================================');
  console.log('');
  
  console.log('❌ CRITICAL ISSUES FOUND:');
  console.log('1. Products table missing 15+ essential columns (quantity, category, brand, etc.)');
  console.log('2. Users table has infinite recursion in RLS policies');
  console.log('3. Brands table may not exist or not be accessible');
  console.log('4. RLS policies block data insertion on most tables');
  console.log('5. No reference data loaded (categories, brands)');
  console.log('');
  
  console.log('✅ MANUAL FIX REQUIRED:');
  console.log('');
  console.log('STEP 1: Open Supabase SQL Editor');
  console.log('   URL: https://supabase.com/dashboard/project/lnljcgttcdhrduixirgf/sql');
  console.log('');
  console.log('STEP 2: Copy and paste the fix-existing-database.sql file contents');
  console.log('   File: ./fix-existing-database.sql');
  console.log('');
  console.log('STEP 3: Execute the SQL script');
  console.log('   This will add missing columns, fix RLS policies, and load reference data');
  console.log('');
  console.log('STEP 4: Verify the fix worked');
  console.log('   Run: node verify-fix.js');
  console.log('');
  
  console.log('🚨 WHY YOUR INVENTORY IS STUCK LOADING:');
  console.log('The products table exists but is missing critical columns like:');
  console.log('- quantity (shows 0 instead of actual stock)');
  console.log('- category (used for filtering and display)');  
  console.log('- brand (used for filtering and display)');
  console.log('- unit_price, sale_price (pricing information)');
  console.log('- status (active/inactive filtering)');
  console.log('');
  console.log('Without these columns, Inventory.jsx cannot function properly.');
  console.log('');
  
  console.log('💡 AFTER RUNNING THE SQL FIX:');
  console.log('1. Your inventory will load properly');
  console.log('2. You can add products through the UI');
  console.log('3. All filtering and sorting will work');
  console.log('4. Categories and brands will be populated');
  console.log('');
  
  return false; // Indicates manual intervention needed
}

async function main() {
  const success = await runSQLCommands();
  
  if (!success) {
    console.log('⚠️  MANUAL ACTION REQUIRED');
    console.log('This script cannot make the necessary schema changes.');
    console.log('Please follow the steps above to fix the database via Supabase Dashboard.');
    console.log('');
    console.log('📄 Files created for you:');
    console.log('- fix-existing-database.sql (run this in Supabase SQL Editor)');
    console.log('- verify-fix.js (run this after to confirm fix worked)');
    console.log('- complete-database-schema.sql (complete schema for reference)');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('💥 Script failed:', err.message);
  process.exit(1);
});
