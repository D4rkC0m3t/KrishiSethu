/**
 * Quick Storage Fix Script
 * Run this script in the browser console to fix storage bucket issues
 * 
 * INSTRUCTIONS:
 * 1. Open your app in the browser
 * 2. Open Developer Tools (F12)
 * 3. Go to Console tab
 * 4. Copy and paste this entire script
 * 5. Press Enter to run
 */

(async function fixStorage() {
  console.log('🚀 Starting Quick Storage Fix...\n');
  
  // Check if we're in the right context
  if (typeof window === 'undefined' || !window.location.origin) {
    console.error('❌ This script must be run in a browser console');
    return;
  }
  
  console.log('📍 Running on:', window.location.origin);
  
  try {
    // Try to get Supabase client from window (if available)
    const supabase = window.supabase || 
                    (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) ||
                    null;
    
    if (!supabase) {
      console.log('⚠️ Supabase client not found in global scope');
      console.log('ℹ️ You may need to run this from within your app\'s context');
      console.log('');
      console.log('ALTERNATIVE SOLUTION:');
      console.log('1. Go to your Supabase Dashboard: https://supabase.com/dashboard');
      console.log('2. Navigate to Storage section');
      console.log('3. Create these buckets manually:');
      console.log('   - product-images (Public: Yes)');
      console.log('   - product-documents (Public: Yes)');
      console.log('   - pos-images (Public: Yes)');
      console.log('   - pos-documents (Public: Yes)');
      console.log('4. For each bucket, set up RLS policies to allow authenticated users to INSERT and SELECT');
      return;
    }
    
    console.log('✅ Found Supabase client, proceeding with setup...\n');
    
    // Define required buckets
    const buckets = [
      { name: 'product-images', public: true },
      { name: 'product-documents', public: true },
      { name: 'pos-images', public: true },
      { name: 'pos-documents', public: true }
    ];
    
    // Check authentication
    console.log('🔐 Checking authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.warn('⚠️ Auth check failed:', authError.message);
    } else if (user) {
      console.log('✅ User authenticated:', user.email);
    } else {
      console.log('ℹ️ No user authenticated - continuing anyway');
    }
    
    console.log('\n🪣 Creating storage buckets...\n');
    
    // Attempt to create each bucket
    const results = {};
    
    for (const bucket of buckets) {
      try {
        console.log(`Creating bucket: ${bucket.name}...`);
        
        const { data, error } = await supabase.storage.createBucket(bucket.name, {
          public: bucket.public,
          allowedMimeTypes: bucket.name.includes('image') ? 
            ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'] :
            ['application/pdf', 'application/msword', 'text/plain'],
          fileSizeLimit: bucket.name.includes('image') ? 10485760 : 20971520
        });
        
        if (error) {
          if (error.message && error.message.includes('already exists')) {
            console.log(`  ⚠️ ${bucket.name}: Already exists`);
            results[bucket.name] = { success: true, existed: true };
          } else {
            console.error(`  ❌ ${bucket.name}: ${error.message}`);
            results[bucket.name] = { success: false, error: error.message };
          }
        } else {
          console.log(`  ✅ ${bucket.name}: Created successfully`);
          results[bucket.name] = { success: true, existed: false };
        }
        
      } catch (bucketError) {
        console.error(`  💥 ${bucket.name}: Exception - ${bucketError.message}`);
        results[bucket.name] = { success: false, error: bucketError.message };
      }
    }
    
    console.log('\n📊 Final Results:');
    console.log('==================');
    
    let allSuccessful = true;
    Object.entries(results).forEach(([name, result]) => {
      const status = result.success ? (result.existed ? '⚠️  EXISTS' : '✅ CREATED') : '❌ FAILED';
      console.log(`${status} ${name}`);
      if (!result.success) {
        allSuccessful = false;
        console.log(`         Error: ${result.error}`);
      }
    });
    
    if (allSuccessful) {
      console.log('\n🎉 SUCCESS: All storage buckets are now available!');
      console.log('');
      console.log('📝 IMPORTANT: You may also need to set up RLS policies:');
      console.log('1. Go to Supabase Dashboard > Storage > Policies');
      console.log('2. For each bucket, create policies to allow authenticated users to:');
      console.log('   - INSERT (upload files)');
      console.log('   - SELECT (view/download files)');
      console.log('');
      console.log('🔄 Try uploading a file now - it should work!');
    } else {
      console.log('\n⚠️ Some buckets could not be created automatically.');
      console.log('You may need to create them manually in the Supabase Dashboard.');
    }
    
  } catch (error) {
    console.error('💥 Script failed:', error);
    console.log('');
    console.log('MANUAL SOLUTION:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Open your project');
    console.log('3. Go to Storage section');
    console.log('4. Create these buckets:');
    console.log('   - product-images');
    console.log('   - product-documents'); 
    console.log('   - pos-images');
    console.log('   - pos-documents');
    console.log('5. Set each bucket as Public');
    console.log('6. Set up RLS policies for authenticated users');
  }
})();

console.log('📋 Quick Storage Fix script loaded. Run fixStorage() if it didn\'t execute automatically.');
