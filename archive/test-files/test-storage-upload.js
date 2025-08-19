/**
 * 🧪 STORAGE UPLOAD TEST
 * 
 * Run this in your browser console to test storage upload functionality
 * Make sure you're logged in first!
 */

async function testStorageUpload() {
  console.log('🧪 Starting storage upload test...');
  
  try {
    // Import the storage service (adjust path as needed)
    const { testStorageAccess, uploadFileWithAuth } = await import('./inventory-management/src/utils/storageAuthFix.js');
    
    // Step 1: Test storage access
    console.log('📋 Step 1: Testing storage access...');
    const accessTest = await testStorageAccess();
    console.log('📊 Access test results:', accessTest);
    
    if (accessTest.overall === 'failed') {
      console.error('❌ Storage access test failed. Check your Supabase configuration.');
      return;
    }
    
    // Step 2: Test authentication
    console.log('📋 Step 2: Testing authentication...');
    const authTest = await checkStorageAuth();
    console.log('🔐 Auth test results:', authTest);
    
    if (!authTest.success) {
      console.error('❌ Authentication test failed:', authTest.error);
      return;
    }
    
    // Step 3: Create a test file
    console.log('📋 Step 3: Creating test file...');
    const testFile = createTestImageFile();
    console.log('📁 Test file created:', testFile.name, testFile.size, 'bytes');
    
    // Step 4: Upload test file
    console.log('📋 Step 4: Uploading test file...');
    const uploadResult = await uploadFileWithAuth(testFile, 'test/', (progress) => {
      console.log(`📤 Upload progress: ${progress}%`);
    });
    
    console.log('✅ Upload successful:', uploadResult);
    console.log('🔗 File URL:', uploadResult.url);
    
    // Step 5: Verify file exists
    console.log('📋 Step 5: Verifying file exists...');
    const response = await fetch(uploadResult.url);
    if (response.ok) {
      console.log('✅ File accessible via public URL');
    } else {
      console.warn('⚠️ File uploaded but not accessible via public URL');
    }
    
    console.log('🎉 All tests passed! Storage upload is working correctly.');
    
  } catch (error) {
    console.error('💥 Test failed:', error);
    console.error('Stack:', error.stack);
  }
}

// Helper function to create a test image file
function createTestImageFile() {
  // Create a small test image (1x1 transparent PNG)
  const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return new File([bytes], 'test-image.png', { type: 'image/png' });
}

// Helper function to check storage auth (copied from your existing code)
async function checkStorageAuth() {
  try {
    console.log('🔐 Checking storage authentication...');
    
    // Get current user - adjust this based on your auth context
    const { supabase } = await import('./inventory-management/src/lib/supabase.js');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ User authentication error:', userError);
      throw new Error('User not authenticated');
    }
    
    if (!user) {
      console.log('❌ No user found');
      throw new Error('No user authenticated');
    }
    
    console.log('✅ User authenticated:', user.email);
    return { success: true, user };
    
  } catch (error) {
    console.error('❌ Storage authentication check failed:', error);
    return { success: false, error: error.message };
  }
}

// Run the test
console.log('🚀 Ready to test storage upload!');
console.log('Run: testStorageUpload()');
console.log('Make sure you are logged in first!');

// Export for use
window.testStorageUpload = testStorageUpload;
