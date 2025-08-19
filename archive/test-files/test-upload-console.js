/**
 * 🧪 Quick Storage Upload Test - Run in Browser Console
 * 
 * Copy and paste this into your browser console while logged into your app
 * This will test if the storage policies fix worked
 */

async function quickUploadTest() {
  console.log('🧪 Quick Storage Upload Test Starting...');
  
  try {
    // Check if we can access the Supabase client
    let supabase;
    try {
      const supabaseModule = await import('./inventory-management/src/lib/supabase.js');
      supabase = supabaseModule.supabase;
      console.log('✅ Supabase client loaded');
    } catch (importError) {
      console.error('❌ Could not load Supabase client:', importError);
      return;
    }

    // Step 1: Check authentication
    console.log('📋 Step 1: Checking authentication...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ Not authenticated. Please log in first.');
      return;
    }
    
    console.log('✅ User authenticated:', user.email);

    // Step 2: Test bucket access
    console.log('📋 Step 2: Testing bucket access...');
    const buckets = ['product_images', 'product_documents', 'pos_images', 'pos_documents'];
    
    for (const bucket of buckets) {
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .list('test/', { limit: 1 });
        
        if (error) {
          console.warn(`⚠️ ${bucket}: ${error.message}`);
        } else {
          console.log(`✅ ${bucket}: Accessible`);
        }
      } catch (err) {
        console.warn(`⚠️ ${bucket}: Error - ${err.message}`);
      }
    }

    // Step 3: Create a test file
    console.log('📋 Step 3: Creating test file...');
    const testFile = createSmallTestFile();
    console.log(`📁 Test file: ${testFile.name} (${testFile.size} bytes)`);

    // Step 4: Try uploading to product_images bucket
    console.log('📋 Step 4: Testing upload...');
    const fileName = `test-${Date.now()}.png`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product_images')
      .upload(fileName, testFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Upload failed:', uploadError.message);
      
      // Check specific error types
      if (uploadError.message.includes('row-level security')) {
        console.error('🔒 RLS Policy Issue: The storage policies are not set up correctly.');
        console.log('💡 Solution: Run the fix-storage-policies-only.sql script in your Supabase SQL Editor');
      } else if (uploadError.message.includes('permission')) {
        console.error('🔑 Permission Issue: Your user might not have proper authentication.');
        console.log('💡 Solution: Try logging out and back in, then run this test again');
      }
      return;
    }

    console.log('✅ Upload successful!', uploadData);

    // Step 5: Test if file is accessible
    console.log('📋 Step 5: Testing file access...');
    const { data: urlData } = supabase.storage
      .from('product_images')
      .getPublicUrl(fileName);

    console.log('🔗 File URL:', urlData.publicUrl);

    // Step 6: Clean up test file
    console.log('📋 Step 6: Cleaning up test file...');
    const { error: deleteError } = await supabase.storage
      .from('product_images')
      .remove([fileName]);

    if (deleteError) {
      console.warn('⚠️ Could not clean up test file:', deleteError.message);
    } else {
      console.log('✅ Test file cleaned up');
    }

    console.log('🎉 All tests passed! Storage upload is working correctly.');

  } catch (error) {
    console.error('💥 Test failed with error:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Helper function to create a small test file
function createSmallTestFile() {
  // Create a tiny 1x1 transparent PNG (85 bytes)
  const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  
  return new File([bytes], 'test.png', { type: 'image/png' });
}

console.log('🚀 Quick upload test ready!');
console.log('📝 Make sure you are logged in, then run: quickUploadTest()');

// Make the function globally available
window.quickUploadTest = quickUploadTest;
