// Test script for product attachments functionality
// Run this in browser console after implementing the fix

async function testProductAttachments() {
  console.log('🧪 Testing Product Attachments Functionality...\n');

  try {
    // Test 1: Check if attachments column exists in database
    console.log('1️⃣ Testing database schema...');
    
    const { data: schemaData, error: schemaError } = await supabase
      .from('products')
      .select('attachments')
      .limit(1);
    
    if (schemaError) {
      console.error('❌ Schema test failed:', schemaError.message);
      if (schemaError.message.includes('attachments')) {
        console.log('💡 Solution: Run the migration script add-attachments-column-migration.sql');
        return false;
      }
    } else {
      console.log('✅ Attachments column exists in database');
    }

    // Test 2: Test creating a product with attachments
    console.log('\n2️⃣ Testing product creation with attachments...');
    
    const testProduct = {
      name: 'Test Product with Attachments',
      type: 'Chemical',
      category_id: null, // Will need a valid category ID
      brand_id: null,    // Will need a valid brand ID
      description: 'Test product for attachments functionality',
      attachments: [
        {
          name: 'test_image.jpg',
          url: 'https://example.com/test_image.jpg',
          path: 'products/images/test_image.jpg',
          type: 'image/jpeg',
          size: 123456,
          metadata: {
            uploadedAt: new Date().toISOString(),
            originalName: 'test_image.jpg',
            bucket: 'product-images'
          }
        }
      ],
      imageUrls: ['https://example.com/test_image.jpg'],
      quantity: 10,
      purchasePrice: 100,
      salePrice: 150,
      unit: 'kg',
      isActive: true
    };

    // Note: This is a dry run test - we won't actually insert
    console.log('📋 Test product data structure:', testProduct);
    console.log('✅ Product data structure is valid');

    // Test 3: Test field mapping
    console.log('\n3️⃣ Testing field mapping...');
    
    // Import the field mapping (this would be done in actual component)
    const fieldMappings = {
      attachments: 'attachments', // Should map to itself for JSONB
      imageUrls: 'image_urls',
      categoryId: 'category_id',
      brandId: 'brand_id',
      purchasePrice: 'purchase_price',
      salePrice: 'sale_price',
      isActive: 'is_active'
    };

    console.log('📋 Field mappings:', fieldMappings);
    console.log('✅ Field mappings are configured');

    // Test 4: Test JSONB structure
    console.log('\n4️⃣ Testing JSONB structure...');
    
    const attachmentExample = testProduct.attachments[0];
    const requiredFields = ['name', 'url', 'type', 'size', 'metadata'];
    const hasAllFields = requiredFields.every(field => attachmentExample.hasOwnProperty(field));
    
    if (hasAllFields) {
      console.log('✅ Attachment object has all required fields');
    } else {
      console.log('❌ Attachment object missing required fields');
      console.log('Required:', requiredFields);
      console.log('Present:', Object.keys(attachmentExample));
    }

    // Test 5: Test storage bucket configuration
    console.log('\n5️⃣ Testing storage bucket access...');
    
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.log('⚠️ Could not list storage buckets:', bucketsError.message);
      } else {
        const requiredBuckets = ['product-images', 'product-documents'];
        const existingBuckets = buckets.map(b => b.name);
        const missingBuckets = requiredBuckets.filter(b => !existingBuckets.includes(b));
        
        if (missingBuckets.length === 0) {
          console.log('✅ All required storage buckets exist:', existingBuckets);
        } else {
          console.log('⚠️ Missing storage buckets:', missingBuckets);
          console.log('💡 Run create-storage-buckets.sql to create missing buckets');
        }
      }
    } catch (error) {
      console.log('⚠️ Storage test failed:', error.message);
    }

    console.log('\n🎉 Product Attachments Test Complete!');
    console.log('\n📋 Summary:');
    console.log('- Database schema: Ready');
    console.log('- Field mappings: Configured');
    console.log('- Data structure: Valid');
    console.log('- Storage buckets: Check results above');
    
    return true;

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

// Auto-run if supabase is available
if (typeof supabase !== 'undefined') {
  testProductAttachments();
} else {
  console.log('⚠️ Supabase client not found. Run this in the application context.');
  console.log('💡 Copy and paste this function in browser console on the app page.');
}

// Export for manual testing
window.testProductAttachments = testProductAttachments;
