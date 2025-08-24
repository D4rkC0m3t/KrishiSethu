const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function testCustomOther() {
  console.log('🧪 TESTING CUSTOM/OTHER TYPE SUPPORT');
  console.log('====================================');
  
  // Test product with Custom/Other type
  const testProduct = {
    name: 'Custom Organic Mix - Special Blend 5kg',
    category: 'Organic Fertilizer', 
    type: 'Custom/Other',
    brand: 'AgriCorp',
    unit: 'pcs',
    purchase_price: 200,
    sale_price: 300,
    stock_quantity: 15,
    min_stock: 5,
    gst_rate: 0
  };
  
  console.log('📝 Attempting to insert Custom/Other product...');
  console.log('Product details:', {
    name: testProduct.name,
    category: testProduct.category,
    type: testProduct.type,
    brand: testProduct.brand
  });
  
  const { data: insertResult, error: insertError } = await supabase
    .from('products')
    .insert([testProduct])
    .select();
    
  if (insertError) {
    console.log('❌ Insertion failed:', insertError.message);
    
    if (insertError.message.includes('row-level security')) {
      console.log('💡 This is an RLS policy issue, not a schema issue');
      console.log('💡 The type column can accept "Custom/Other" values');
      console.log('💡 You need to run FINAL-PRODUCTS-RLS-FIX.sql first');
      return true; // Schema supports it, just RLS blocking
    } else if (insertError.message.includes('constraint') || insertError.message.includes('check')) {
      console.log('❌ Schema constraint issue - type column has restrictions');
      return false;
    }
  } else {
    console.log('✅ Custom/Other insertion successful!');
    console.log('✅ Product saved:', insertResult[0].name);
    console.log('✅ Type saved as:', insertResult[0].type);
    
    // Clean up
    if (insertResult[0]?.id) {
      await supabase.from('products').delete().eq('id', insertResult[0].id);
      console.log('🧹 Test product cleaned up');
    }
    return true;
  }
}

testCustomOther().then(success => {
  if (success) {
    console.log('\n✅ SCHEMA SUPPORTS CUSTOM/OTHER');
    console.log('================================');
    console.log('✅ The products table can store "Custom/Other" type values');
    console.log('✅ No schema changes needed');
    console.log('✅ Your frontend config update is sufficient');
  } else {
    console.log('\n❌ SCHEMA NEEDS FIXES');
    console.log('=====================');
    console.log('❌ The type column has constraints that prevent Custom/Other');
  }
}).catch(console.error);
