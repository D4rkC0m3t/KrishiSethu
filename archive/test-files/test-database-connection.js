// Test Database Connection and Product Fetching
// Run this file to diagnose the inventory loading issue

import { supabase } from './src/lib/supabase.js';
import { productOperations } from './inventory-management/src/lib/supabaseDb.js';

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection and product fetching...');
  
  try {
    // Test 1: Basic Supabase connection
    console.log('\n1. Testing basic Supabase connection...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.error('❌ Auth error:', authError);
    } else {
      console.log('✅ Supabase connection successful');
      console.log('🔐 Current user:', authData.session?.user?.email || 'Not authenticated');
    }

    // Test 2: Check if products table exists and is accessible
    console.log('\n2. Testing products table access...');
    const { data: tableData, error: tableError } = await supabase
      .from('products')
      .select('count(*)', { count: 'exact' });
    
    if (tableError) {
      console.error('❌ Products table error:', tableError);
      console.error('Error details:', tableError.message);
      
      // Check if it's an RLS issue
      if (tableError.message.includes('RLS') || tableError.message.includes('policy')) {
        console.log('🔧 This appears to be a Row Level Security (RLS) issue');
        console.log('🔧 Solution: Run the fix-inventory-loading-rls.sql script');
      }
    } else {
      console.log('✅ Products table accessible');
      console.log('📊 Total products in database:', tableData?.[0]?.count || 0);
    }

    // Test 3: Test the productOperations.getAllProducts() method
    console.log('\n3. Testing productOperations.getAllProducts()...');
    try {
      const products = await productOperations.getAllProducts();
      console.log('✅ productOperations.getAllProducts() successful');
      console.log('📦 Products fetched:', products.length);
      
      if (products.length > 0) {
        console.log('📋 Sample product:', {
          id: products[0].id,
          name: products[0].name,
          quantity: products[0].quantity,
          brand: products[0].brand || products[0].brandName,
          category: products[0].category || products[0].categoryName
        });
      } else {
        console.log('⚠️ No products found in database');
        console.log('🔧 Solution: Add some products to the database first');
      }
    } catch (productError) {
      console.error('❌ productOperations.getAllProducts() failed:', productError);
      console.error('Error details:', productError.message);
    }

    // Test 4: Check brands and categories tables
    console.log('\n4. Testing brands and categories tables...');
    try {
      const { data: brands, error: brandsError } = await supabase
        .from('brands')
        .select('count(*)', { count: 'exact' });
      
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('count(*)', { count: 'exact' });

      if (brandsError) {
        console.error('❌ Brands table error:', brandsError.message);
      } else {
        console.log('✅ Brands table accessible, count:', brands?.[0]?.count || 0);
      }

      if (categoriesError) {
        console.error('❌ Categories table error:', categoriesError.message);
      } else {
        console.log('✅ Categories table accessible, count:', categories?.[0]?.count || 0);
      }
    } catch (error) {
      console.error('❌ Error testing brands/categories:', error);
    }

    // Test 5: Check current user authentication status
    console.log('\n5. Checking authentication status...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('❌ User authentication error:', userError);
      console.log('🔧 Solution: Make sure user is logged in');
    } else if (!user) {
      console.log('⚠️ No authenticated user found');
      console.log('🔧 Solution: User needs to log in first');
    } else {
      console.log('✅ User authenticated:', user.email);
      console.log('🔐 User ID:', user.id);
      console.log('🔐 User role:', user.role);
    }

  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
  }
}

// Run the test
testDatabaseConnection().then(() => {
  console.log('\n🏁 Database connection test completed');
}).catch(error => {
  console.error('💥 Test failed with error:', error);
});