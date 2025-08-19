// Diagnostic script to check why inventory is not loading
// Run this in browser console to debug the issue

console.log('🔍 Starting Inventory Loading Diagnosis...');

// Test 1: Check if Supabase client is available
if (typeof supabase === 'undefined') {
  console.error('❌ Supabase client not found in global scope');
  console.log('ℹ️ Try accessing from window.supabase or check if it\'s imported correctly');
} else {
  console.log('✅ Supabase client is available');
}

// Test 2: Check database connection
const testConnection = async () => {
  try {
    console.log('🔗 Testing database connection...');
    const { data, error } = await supabase.from('products').select('count').limit(1);
    
    if (error) {
      console.error('❌ Database connection error:', error);
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (err) {
    console.error('❌ Connection test failed:', err);
    return false;
  }
};

// Test 3: Check if products table exists and has data
const checkProductsTable = async () => {
  try {
    console.log('📦 Checking products table...');
    
    // Check table structure
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Products table error:', error);
      
      // Check if it's a permission issue
      if (error.message.includes('permission denied') || error.message.includes('RLS')) {
        console.log('🔒 This might be a Row Level Security (RLS) issue');
        console.log('💡 Check if RLS policies allow authenticated users to read products');
      }
      
      return false;
    }
    
    console.log(`✅ Products table accessible, found ${products?.length || 0} products`);
    if (products && products.length > 0) {
      console.log('📋 Sample product:', products[0]);
    } else {
      console.log('📭 Products table is empty');
    }
    
    return true;
  } catch (err) {
    console.error('❌ Products table check failed:', err);
    return false;
  }
};

// Test 4: Check brands and categories tables (for joins)
const checkRelatedTables = async () => {
  try {
    console.log('🏷️ Checking brands and categories tables...');
    
    // Check brands
    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select('*')
      .limit(3);
    
    if (brandsError) {
      console.warn('⚠️ Brands table issue:', brandsError);
    } else {
      console.log(`✅ Brands table: ${brands?.length || 0} records`);
    }
    
    // Check categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .limit(3);
    
    if (categoriesError) {
      console.warn('⚠️ Categories table issue:', categoriesError);
    } else {
      console.log(`✅ Categories table: ${categories?.length || 0} records`);
    }
    
    return true;
  } catch (err) {
    console.error('❌ Related tables check failed:', err);
    return false;
  }
};

// Test 5: Test the exact query used by getAllProducts
const testGetAllProductsQuery = async () => {
  try {
    console.log('🔍 Testing getAllProducts query...');
    
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        brands(id, name),
        categories(id, name)
      `)
      .order('name', { ascending: true });
    
    if (error) {
      console.error('❌ getAllProducts query failed:', error);
      
      // Try fallback query without joins
      console.log('🔄 Trying fallback query without joins...');
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });
      
      if (fallbackError) {
        console.error('❌ Fallback query also failed:', fallbackError);
      } else {
        console.log(`✅ Fallback query successful: ${fallbackData?.length || 0} products`);
        if (fallbackData && fallbackData.length > 0) {
          console.log('📋 Sample product (no joins):', fallbackData[0]);
        }
      }
      
      return false;
    }
    
    console.log(`✅ getAllProducts query successful: ${data?.length || 0} products`);
    if (data && data.length > 0) {
      console.log('📋 Sample product (with joins):', data[0]);
    }
    
    return true;
  } catch (err) {
    console.error('❌ getAllProducts query test failed:', err);
    return false;
  }
};

// Test 6: Check authentication state
const checkAuthState = async () => {
  try {
    console.log('🔐 Checking authentication state...');
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Auth check error:', error);
      return false;
    }
    
    if (!session) {
      console.warn('⚠️ No active session found');
      return false;
    }
    
    console.log('✅ User is authenticated:', session.user.email);
    return true;
  } catch (err) {
    console.error('❌ Auth state check failed:', err);
    return false;
  }
};

// Run all tests
const runDiagnostics = async () => {
  console.log('🚀 Running comprehensive diagnostics...\n');
  
  const results = {
    connection: await testConnection(),
    auth: await checkAuthState(),
    products: await checkProductsTable(),
    related: await checkRelatedTables(),
    query: await testGetAllProductsQuery()
  };
  
  console.log('\n📊 Diagnostic Results:');
  console.log('='.repeat(50));
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  // Provide recommendations
  console.log('\n💡 Recommendations:');
  if (!results.connection) {
    console.log('- Check Supabase URL and API key configuration');
  }
  if (!results.auth) {
    console.log('- Ensure user is logged in');
  }
  if (!results.products) {
    console.log('- Check RLS policies on products table');
    console.log('- Verify products table exists and has correct permissions');
  }
  if (!results.related) {
    console.log('- Check brands and categories tables');
  }
  if (!results.query) {
    console.log('- The join query might be failing, check foreign key relationships');
  }
  
  console.log('\n🔧 Next Steps:');
  console.log('1. Fix any failed tests above');
  console.log('2. Check browser Network tab for failed requests');
  console.log('3. Check Supabase dashboard for RLS policies');
  console.log('4. Verify table structure matches expected schema');
};

// Auto-run diagnostics
runDiagnostics();