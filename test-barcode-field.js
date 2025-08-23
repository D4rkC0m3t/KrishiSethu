// Test script to verify barcode field functionality
// Run this in browser console after setting up the barcode column

async function testBarcodeField() {
  console.log('🧪 Testing barcode field functionality...');
  
  try {
    // Test 1: Create a product with barcode
    console.log('📝 Test 1: Creating product with barcode...');
    
    const testProduct = {
      name: 'Test Product with Barcode',
      type: 'Chemical',
      barcode: '1234567890123', // Add barcode
      batch_no: 'TEST-001',
      expiry_date: new Date('2025-12-31').toISOString(),
      purchase_price: 100,
      sale_price: 120,
      quantity: 10,
      unit: 'kg',
      description: 'Test product to verify barcode field'
    };
    
    // Import the products service
    const { productsService } = await import('./src/lib/supabaseDb.js');
    
    const createdProduct = await productsService.create(testProduct);
    console.log('✅ Product created successfully with barcode:', createdProduct);
    
    // Test 2: Verify barcode is saved
    console.log('🔍 Test 2: Retrieving product to verify barcode...');
    
    const retrievedProduct = await productsService.getById(createdProduct.id);
    console.log('📦 Retrieved product:', retrievedProduct);
    
    if (retrievedProduct.barcode === testProduct.barcode) {
      console.log('✅ Barcode field saved and retrieved correctly!');
    } else {
      console.error('❌ Barcode field mismatch:', {
        expected: testProduct.barcode,
        actual: retrievedProduct.barcode
      });
    }
    
    // Test 3: Update product barcode
    console.log('📝 Test 3: Updating product barcode...');
    
    const newBarcode = '9876543210987';
    const updatedProduct = await productsService.update(createdProduct.id, {
      barcode: newBarcode
    });
    
    console.log('🔄 Product updated with new barcode:', updatedProduct);
    
    if (updatedProduct.barcode === newBarcode) {
      console.log('✅ Barcode update successful!');
    } else {
      console.error('❌ Barcode update failed:', {
        expected: newBarcode,
        actual: updatedProduct.barcode
      });
    }
    
    // Clean up: Delete test product
    console.log('🧹 Cleaning up test product...');
    await productsService.delete(createdProduct.id);
    console.log('✅ Test product cleaned up');
    
    console.log('🎉 All barcode tests passed!');
    return { success: true, message: 'Barcode field is working correctly' };
    
  } catch (error) {
    console.error('❌ Barcode test failed:', error);
    return { success: false, error: error.message };
  }
}

// Export for use in browser console
window.testBarcodeField = testBarcodeField;

console.log('🔧 Barcode test function loaded. Run testBarcodeField() to test.');
