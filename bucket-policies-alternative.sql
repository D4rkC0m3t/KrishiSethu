-- =====================================================
-- ALTERNATIVE: BUCKET-LEVEL POLICIES FOR SUPABASE STORAGE
-- Use this if you get "must be owner of table objects" error
-- These policies work at the bucket level, not table level
-- =====================================================

-- =====================================================
-- METHOD 1: USING SUPABASE DASHBOARD (RECOMMENDED)
-- =====================================================
/*
MANUAL STEPS (Easiest method):

1. Go to Supabase Dashboard > Storage > Policies
2. Click "New Policy" for each bucket
3. Create the following policies:

FOR BUCKET: product-images
- Policy Name: "Allow authenticated users full access to product images"
- Operation: All
- Target roles: authenticated
- Policy definition: true

FOR BUCKET: product-documents  
- Policy Name: "Allow authenticated users full access to product documents"
- Operation: All
- Target roles: authenticated
- Policy definition: true

FOR BUCKET: pos-images
- Policy Name: "Allow authenticated users full access to pos images"
- Operation: All
- Target roles: authenticated  
- Policy definition: true

FOR BUCKET: pos-documents
- Policy Name: "Allow authenticated users full access to pos documents"
- Operation: All
- Target roles: authenticated
- Policy definition: true
*/

-- =====================================================
-- METHOD 2: USING SUPABASE CLIENT-SIDE CODE
-- =====================================================

-- Instead of SQL policies, you can use client-side bucket policies
-- This JavaScript code sets up bucket policies programmatically:

/*
// Run this in your browser console or add to your setup script:

const setupBucketPolicies = async () => {
  console.log('Setting up bucket policies...');
  
  const buckets = ['product-images', 'product-documents', 'pos-images', 'pos-documents'];
  
  for (const bucket of buckets) {
    try {
      // Note: Bucket policies are usually set during bucket creation
      // or managed through the dashboard. Client-side policy creation
      // is limited for security reasons.
      console.log(`Bucket ${bucket}: Use dashboard method instead`);
    } catch (error) {
      console.error(`Error with bucket ${bucket}:`, error);
    }
  }
};
*/

-- =====================================================
-- METHOD 3: SIMPLIFIED APPROACH - MAKE BUCKETS PUBLIC
-- =====================================================

-- If you're getting permission errors, the simplest solution is to:
-- 1. Make your buckets public (no authentication required)
-- 2. Handle access control in your application logic

/*
STEPS TO MAKE BUCKETS PUBLIC:
1. Go to Supabase Dashboard > Storage
2. Click on each bucket
3. Go to Settings
4. Set "Public bucket" to ON
5. This removes the need for RLS policies entirely
*/

-- =====================================================
-- METHOD 4: USING SUPABASE SERVICE ROLE (ADVANCED)
-- =====================================================

-- If you have access to service role key, you can create policies programmatically
-- This requires using the service role key (not anon key) in your backend

/*
// Backend code using service role:
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SERVICE_ROLE_KEY' // This has admin privileges
);

const createStoragePolicies = async () => {
  // Create policies using admin client
  // This would work but requires service role access
};
*/

-- =====================================================
-- VERIFICATION QUERY (This should work with any role)
-- =====================================================

-- Check current bucket settings
SELECT 
  id as bucket_name,
  public,
  created_at,
  updated_at
FROM storage.buckets 
WHERE id IN ('product-images', 'product-documents', 'pos-images', 'pos-documents')
ORDER BY id;

-- =====================================================
-- TROUBLESHOOTING GUIDE
-- =====================================================

/*
ERROR SOLUTIONS:

1. "must be owner of table objects"
   → Use Supabase Dashboard instead of SQL
   → Make buckets public
   → Contact your Supabase project owner

2. "permission denied for table objects" 
   → Your user doesn't have RLS policy creation rights
   → Use dashboard method
   → Make buckets public

3. "relation storage.objects does not exist"
   → Storage is not enabled in your project
   → Go to Dashboard > Storage to initialize it

4. Policies not working after creation
   → Check if RLS is enabled: SELECT rls FROM pg_tables WHERE tablename = 'objects' AND schemaname = 'storage';
   → Verify policies: SELECT * FROM pg_policies WHERE tablename = 'objects';
   → Test with authenticated user

RECOMMENDED SOLUTION FOR YOUR CASE:
Use the Dashboard method (Method 1) - it's the most reliable.
*/
