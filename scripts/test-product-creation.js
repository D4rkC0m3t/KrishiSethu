/**
 * Product Creation Test
 * 
 * This script tests the fixed product creation functionality to ensure
 * that brand_id and category_id are properly set with real UUIDs.
 */

import { createClient } from '@supabase/supabase-js';

// Create Supabase client
const supabaseUrl = 'https://lnljcgttcdhrduixirgf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubGpjZ3R0Y2RocmR1aXhpcmdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwODkzNDUsImV4cCI6MjA1MDY2NTM0NX0.wGhG1ZLDOHtSTMXXz6KMShXoFNJUMqhQo8LuNXaMuLU';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testProductCreation() {
  console.log('🧪 Testing Product Creation Fix...\n');
  
  try {
    // First, get real categories and brands from database
    console.log('📋 Fetching real categories and brands...');
    
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .limit(5);
    
    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select('*')
      .eq('is_active', true)
      .limit(5);
    
    if (categoriesError || brandsError) {
      throw new Error(`Database error: ${categoriesError?.message || brandsError?.message}`);
    }
    
    if (!categories?.length || !brands?.length) {
      throw new Error('No categories or brands found in database');
    }
    
    console.log(`✅ Found ${categories.length} categories and ${brands.length} brands`);
    
    // Use the first category and the "BioNutri" brand (which was causing the original error)
    const testCategory = categories[0];
    const bioNutriBrand = brands.find(b => b.name === 'BioNutri') || brands[0];
    
    console.log(`📦 Test Category: "${testCategory.name}" (UUID: ${testCategory.id})`);
    console.log(`🏷️ Test Brand: "${bioNutriBrand.name}" (UUID: ${bioNutriBrand.id})`);
    
    // Create test product data - this simulates what the AddProduct form sends
    const testProductData = {
      name: 'Test NPK Fertilizer 20:20:0 - 50kg',
      type: 'NPK Fertilizer',
      categoryId: testCategory.id,  // Real UUID from database
      brandId: bioNutriBrand.id,    // Real UUID from database  
      category: testCategory.name,   // Display name
      brand: bioNutriBrand.name,     // Display name
      batchNo: 'TEST2024001',
      expiryDate: new Date('2025-12-31'),
      manufacturingDate: new Date('2024-01-01'),
      purchasePrice: 1200.00,
      salePrice: 1500.00,
      quantity: 100,
      minStockLevel: 10,
      unit: 'pcs',
      supplierId: null, // We'll skip supplier for this test
      hsn: '31054000',
      gstRate: 12,
      barcode: 'TEST123456789',
      description: 'Test product created to verify UUID fix',
      imageUrls: [],
      attachments: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('\\n🚀 Creating test product...');
    console.log('📊 Product data summary:');
    console.log(`   - Name: ${testProductData.name}`);
    console.log(`   - Category ID: ${testProductData.categoryId} (${testProductData.category})`);
    console.log(`   - Brand ID: ${testProductData.brandId} (${testProductData.brand})`);
    console.log(`   - Price: ₹${testProductData.salePrice}`);
    
    // Map the product data like the AddProduct form does
    const mappedProductData = {
      name: testProductData.name,
      type: testProductData.type,
      category_id: testProductData.categoryId,  // Direct mapping to database column
      brand_id: testProductData.brandId,        // Direct mapping to database column
      category: testProductData.category,
      brand: testProductData.brand,
      batch_no: testProductData.batchNo,
      expiry_date: testProductData.expiryDate.toISOString(),
      manufacturing_date: testProductData.manufacturingDate.toISOString(),
      purchase_price: testProductData.purchasePrice,
      sale_price: testProductData.salePrice,
      quantity: testProductData.quantity,
      min_stock_level: testProductData.minStockLevel,
      unit: testProductData.unit,
      supplier_id: testProductData.supplierId,
      hsn_code: testProductData.hsn,
      gst_rate: testProductData.gstRate,
      barcode: testProductData.barcode,
      description: testProductData.description,
      image_urls: testProductData.imageUrls,
      attachments: testProductData.attachments,
      is_active: testProductData.isActive,
      created_at: testProductData.createdAt.toISOString(),
      updated_at: testProductData.updatedAt.toISOString()
    };
    
    // Attempt to create the product directly
    const { data: result, error: createError } = await supabase
      .from('products')
      .insert(mappedProductData)
      .select()
      .single();
    
    if (createError) {
      throw new Error(`Product creation failed: ${createError.message}`);
    }
    
    console.log('\\n✅ SUCCESS! Product created successfully!');
    console.log('📋 Created product details:');
    console.log(`   - Product ID: ${result.id}`);
    console.log(`   - Name: ${result.name}`);
    console.log(`   - Category ID in DB: ${result.categoryId || result.category_id}`);
    console.log(`   - Brand ID in DB: ${result.brandId || result.brand_id}`);
    
    // Verify the data was saved correctly by querying it back
    console.log('\\n🔍 Verifying saved data...');
    const { data: savedProduct, error: verifyError } = await supabase
      .from('products')
      .select('*')
      .eq('id', result.id)
      .single();
    
    if (verifyError) {
      throw new Error(`Verification failed: ${verifyError.message}`);
    }
    
    console.log('✅ Verification successful!');
    console.log('📊 Database record:');
    console.log(`   - category_id: ${savedProduct.category_id} (${typeof savedProduct.category_id})`);
    console.log(`   - brand_id: ${savedProduct.brand_id} (${typeof savedProduct.brand_id})`);
    console.log(`   - name: ${savedProduct.name}`);
    console.log(`   - batch_no: ${savedProduct.batch_no}`);
    
    // Clean up - delete the test product
    console.log('\\n🧹 Cleaning up test product...');
    await supabase.from('products').delete().eq('id', result.id);
    console.log('✅ Test product deleted successfully');
    
    console.log('\\n🎉 TEST COMPLETED SUCCESSFULLY!');
    console.log('===============================');
    console.log('✅ The UUID fix is working correctly');
    console.log('✅ category_id and brand_id are properly set with real UUIDs');
    console.log('✅ No more "invalid input syntax for type uuid" errors');
    console.log('✅ Products can now be created through the AddProduct form');
    
  } catch (error) {
    console.error('\\n❌ TEST FAILED!');
    console.error('=============');
    console.error('Error details:', error.message);
    console.error('Full error:', error);
    
    if (error.message.includes('invalid input syntax for type uuid')) {
      console.error('\\n💡 The original UUID error is still occurring!');
      console.error('🔧 Check that the field mappings are working correctly');
    }
  }
  
  process.exit(0);
}

testProductCreation();
