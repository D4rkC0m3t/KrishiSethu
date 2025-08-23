import { storageService } from '../lib/storage';
import { supabase } from '../lib/supabase';

/**
 * Test Storage Functionality
 * Run this to verify storage is working after setup
 */

export const testStorageUpload = async () => {
  console.log('🧪 Testing storage upload functionality...\n');
  
  try {
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Authentication error:', authError.message);
      return { success: false, error: 'Authentication required' };
    }
    
    if (!user) {
      console.error('❌ No user authenticated');
      return { success: false, error: 'Please log in first' };
    }
    
    console.log('✅ User authenticated:', user.email);
    
    // Create a test file (1x1 pixel PNG)
    const testFileData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jINngAAAAABJRU5ErkJggg==';
    
    // Convert base64 to blob
    const response = await fetch(testFileData);
    const blob = await response.blob();
    const testFile = new File([blob], 'test-image.png', { type: 'image/png' });
    
    console.log('📁 Created test file:', testFile.name, testFile.size, 'bytes');
    
    // Test upload to product images
    console.log('📤 Testing upload to product-images bucket...');
    const uploadResult = await storageService.uploadProductImage(testFile, 'test-product');
    
    console.log('✅ Upload successful!');
    console.log('  URL:', uploadResult.url);
    console.log('  Path:', uploadResult.path);
    console.log('  Bucket:', uploadResult.metadata.bucket);
    
    // Clean up - delete the test file
    console.log('🧹 Cleaning up test file...');
    try {
      await storageService.deleteFile(uploadResult.path, uploadResult.metadata.bucket);
      console.log('✅ Test file cleaned up');
    } catch (cleanupError) {
      console.warn('⚠️ Could not clean up test file:', cleanupError.message);
    }
    
    return { 
      success: true, 
      message: 'Storage upload test passed',
      uploadResult 
    };
    
  } catch (error) {
    console.error('❌ Storage test failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

export const testAllBuckets = async () => {
  console.log('🧪 Testing all storage buckets...\n');
  
  const buckets = ['product-images', 'product-documents', 'pos-images', 'pos-documents'];
  const results = {};
  
  for (const bucketName of buckets) {
    try {
      console.log(`Testing bucket: ${bucketName}...`);
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list('', { limit: 1 });
      
      if (error) {
        results[bucketName] = { 
          success: false, 
          error: error.message,
          accessible: false 
        };
        console.error(`  ❌ ${bucketName}: ${error.message}`);
      } else {
        results[bucketName] = { 
          success: true, 
          accessible: true,
          fileCount: data ? data.length : 0 
        };
        console.log(`  ✅ ${bucketName}: Accessible`);
      }
      
    } catch (error) {
      results[bucketName] = { 
        success: false, 
        error: error.message,
        accessible: false 
      };
      console.error(`  💥 ${bucketName}: ${error.message}`);
    }
  }
  
  const successCount = Object.values(results).filter(r => r.success).length;
  const totalCount = buckets.length;
  
  console.log(`\n📊 Results: ${successCount}/${totalCount} buckets accessible`);
  
  if (successCount === totalCount) {
    console.log('🎉 All storage buckets are working properly!');
  } else {
    console.log('⚠️ Some buckets are not accessible. Run storage setup.');
  }
  
  return {
    success: successCount === totalCount,
    results,
    summary: `${successCount}/${totalCount} buckets accessible`
  };
};

// Helper function to run comprehensive storage tests
export const runFullStorageTest = async () => {
  console.log('🏥 Running comprehensive storage test...\n');
  
  const bucketTest = await testAllBuckets();
  
  if (bucketTest.success) {
    console.log('\n📤 Buckets are accessible, testing upload...\n');
    const uploadTest = await testStorageUpload();
    
    return {
      bucketsAccessible: bucketTest.success,
      uploadWorking: uploadTest.success,
      overall: bucketTest.success && uploadTest.success ? 'PASS' : 'FAIL',
      details: { bucketTest, uploadTest }
    };
  } else {
    return {
      bucketsAccessible: false,
      uploadWorking: false,
      overall: 'FAIL',
      details: { bucketTest }
    };
  }
};

export default {
  testStorageUpload,
  testAllBuckets,
  runFullStorageTest
};
