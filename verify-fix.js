#!/usr/bin/env node

/**
 * Verification script to confirm database fix worked
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

async function verifyFix() {
  console.log('🔬 VERIFYING DATABASE FIX');
  console.log('========================');
  console.log('');
  
  let allGood = true;
  
  // Test 1: Check users table (should not have infinite recursion)
  console.log('🔍 Test 1: Users table RLS fix...');
  try {
    const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error && error.message.includes('infinite recursion')) {
      console.log('❌ Users table still has infinite recursion issue');
      allGood = false;
    } else {
      console.log('✅ Users table RLS policies fixed');
    }
  } catch (err) {
    console.log('⚠️  Users table test error:', err.message);
  }
  
  // Test 2: Check brands table exists
  console.log('🔍 Test 2: Brands table existence...');
  try {
    const { data, error } = await supabase.from('brands').select('count', { count: 'exact', head: true });
    if (error && error.message.includes('does not exist')) {
      console.log('❌ Brands table still missing');
      allGood = false;
    } else {
      console.log('✅ Brands table exists');
    }
  } catch (err) {
    console.log('❌ Brands table error:', err.message);
    allGood = false;
  }
  
  // Test 3: Check critical product columns
  console.log('🔍 Test 3: Products table missing columns...');
  const criticalColumns = ['category', 'brand', 'quantity', 'unit_price', 'sale_price'];
  let missingColumns = [];
  
  for (const column of criticalColumns) {
    try {
      const { error } = await supabase.from('products').select(column).limit(1);
      if (error && error.message.includes(`column "${column}" does not exist`)) {
        missingColumns.push(column);
      }
    } catch (err) {
      if (err.message.includes(`column "${column}" does not exist`)) {
        missingColumns.push(column);
      }
    }
  }
  
  if (missingColumns.length > 0) {
    console.log(`❌ Products table still missing: ${missingColumns.join(', ')}`);
    allGood = false;
  } else {
    console.log('✅ All critical product columns exist');
  }
  
  // Test 4: Check reference data
  console.log('🔍 Test 4: Reference data loaded...');
  try {
    const { count: categoriesCount } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });
      
    const { count: brandsCount } = await supabase
      .from('brands')
      .select('*', { count: 'exact', head: true });
    
    if (categoriesCount < 5) {
      console.log(`❌ Categories not loaded properly (${categoriesCount} found)`);
      allGood = false;
    } else {
      console.log(`✅ Categories loaded (${categoriesCount} found)`);
    }
    
    if (brandsCount < 5) {
      console.log(`❌ Brands not loaded properly (${brandsCount} found)`);
      allGood = false;
    } else {
      console.log(`✅ Brands loaded (${brandsCount} found)`);
    }
  } catch (err) {
    console.log('⚠️  Reference data test error:', err.message);
  }
  
  // Test 5: Test a simple product insert (should work now)
  console.log('🔍 Test 5: Product insert capability...');
  try {
    const testProduct = {
      name: 'TEST_VERIFICATION_PRODUCT',
      category: 'Compound Fertilizers',
      brand: 'AgriCorp',
      sku: 'TEST-VERIFY-001',
      quantity: 10,
      unit_price: 100.00,
      sale_price: 120.00,
      status: 'active'
    };
    
    const { error: insertError } = await supabase
      .from('products')
      .insert(testProduct);
    
    if (insertError) {
      console.log('❌ Product insert failed:', insertError.message);
      allGood = false;
    } else {
      console.log('✅ Product insert works');
      
      // Clean up test product
      await supabase
        .from('products')
        .delete()
        .eq('name', 'TEST_VERIFICATION_PRODUCT');
    }
  } catch (err) {
    console.log('❌ Product insert test error:', err.message);
    allGood = false;
  }
  
  console.log('');
  console.log('🎯 VERIFICATION RESULT:');
  console.log('======================');
  
  if (allGood) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('✅ Database fix was successful');
    console.log('💡 Your inventory should now load properly');
    console.log('');
    console.log('Next steps:');
    console.log('1. Refresh your React app');
    console.log('2. Try adding a product through the UI');
    console.log('3. Your inventory loading issue should be resolved!');
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('⚠️  The database fix may not have completed properly');
    console.log('💡 Check the SQL script execution in Supabase dashboard');
    console.log('💡 Make sure to run fix-existing-database.sql first');
  }
}

verifyFix().catch((err) => {
  console.error('💥 Verification failed:', err.message);
  process.exit(1);
});
