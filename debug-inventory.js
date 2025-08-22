// Debug script to test inventory loading
import { supabase } from './src/lib/supabase.js';
import { productOperations } from './src/lib/supabaseDb.js';
import { normalizeProductsArray, validateNormalizedProduct } from './src/utils/productNormalizer.js';

async function debugInventoryLoading() {
  console.log('🔍 Starting inventory loading debug...');
  
  try {
    console.log('🔄 Step 1: Testing Supabase connection...');
    const { data: testConnection, error: connectionError } = await supabase
      .from('products')
      .select('count', { count: 'exact', head: true });
    
    if (connectionError) {
      console.error('❌ Connection failed:', connectionError);
      return;
    }
    
    console.log('✅ Connection successful');
    
    console.log('🔄 Step 2: Testing simple product query...');
    const { data: simpleProducts, error: simpleError } = await supabase
      .from('products')
      .select('*')
      .limit(2);
    
    if (simpleError) {
      console.error('❌ Simple query failed:', simpleError);
      return;
    }
    
    console.log('✅ Simple query successful:', simpleProducts?.length, 'products');
    console.log('Sample product:', simpleProducts?.[0]);
    
    console.log('🔄 Step 3: Testing enhanced query with joins...');
    try {
      const rawProducts = await productOperations.getAllProducts();
      console.log('✅ Enhanced query successful:', rawProducts?.length, 'products');
      console.log('Sample enhanced product:', rawProducts?.[0]);
      
      console.log('🔄 Step 4: Testing product normalization...');
      const normalizedProducts = normalizeProductsArray(rawProducts);
      console.log('✅ Normalization successful:', normalizedProducts?.length, 'products');
      console.log('Sample normalized product:', normalizedProducts?.[0]);
      
      console.log('🔄 Step 5: Testing product validation...');
      const validProducts = normalizedProducts.filter(product => {
        const isValid = validateNormalizedProduct(product);
        if (!isValid) {
          console.warn('⚠️ Invalid product:', product);
        }
        return isValid;
      });
      
      console.log('✅ Validation successful:', validProducts.length, 'valid products');
      
    } catch (enhancedError) {
      console.error('❌ Enhanced query failed:', enhancedError);
      
      console.log('🔄 Step 3b: Testing fallback simple query...');
      const fallbackProducts = normalizeProductsArray(simpleProducts);
      console.log('✅ Fallback successful:', fallbackProducts?.length, 'products');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugInventoryLoading();
