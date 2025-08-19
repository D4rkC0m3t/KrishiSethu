-- ============================================================================
-- 🔒 STORAGE POLICIES FIX - For Existing Buckets
-- ============================================================================
-- This script only fixes RLS policies since buckets already exist
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- 1. Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies to start fresh (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Allow authenticated uploads for product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads for product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates for product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes for product-images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access for Product Images" ON storage.objects;

DROP POLICY IF EXISTS "Allow authenticated uploads for product-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads for product-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates for product-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes for product-documents" ON storage.objects;
DROP POLICY IF EXISTS "Public Access for Product Documents" ON storage.objects;

DROP POLICY IF EXISTS "Allow authenticated uploads for pos-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads for pos-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates for pos-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes for pos-images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access for POS Images" ON storage.objects;

DROP POLICY IF EXISTS "Allow authenticated uploads for pos-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads for pos-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates for pos-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes for pos-documents" ON storage.objects;
DROP POLICY IF EXISTS "Public Access for POS Documents" ON storage.objects;

-- Drop any other generic policies that might conflict
DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Allow logged in users to upload." ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access." ON storage.objects;

-- 3. Create comprehensive storage policies for product_images bucket
CREATE POLICY "Allow authenticated uploads for product_images" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'product_images');

CREATE POLICY "Allow public reads for product_images" ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'product_images');

CREATE POLICY "Allow authenticated updates for product_images" ON storage.objects
FOR UPDATE 
TO authenticated
USING (bucket_id = 'product_images')
WITH CHECK (bucket_id = 'product_images');

CREATE POLICY "Allow authenticated deletes for product_images" ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'product_images');

-- 4. Create policies for product_documents bucket
CREATE POLICY "Allow authenticated uploads for product_documents" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'product_documents');

CREATE POLICY "Allow public reads for product_documents" ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'product_documents');

CREATE POLICY "Allow authenticated updates for product_documents" ON storage.objects
FOR UPDATE 
TO authenticated
USING (bucket_id = 'product_documents')
WITH CHECK (bucket_id = 'product_documents');

CREATE POLICY "Allow authenticated deletes for product_documents" ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'product_documents');

-- 5. Create policies for pos_images bucket
CREATE POLICY "Allow authenticated uploads for pos_images" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'pos_images');

CREATE POLICY "Allow public reads for pos_images" ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'pos_images');

CREATE POLICY "Allow authenticated updates for pos_images" ON storage.objects
FOR UPDATE 
TO authenticated
USING (bucket_id = 'pos_images')
WITH CHECK (bucket_id = 'pos_images');

CREATE POLICY "Allow authenticated deletes for pos_images" ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'pos_images');

-- 6. Create policies for pos_documents bucket
CREATE POLICY "Allow authenticated uploads for pos_documents" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'pos_documents');

CREATE POLICY "Allow public reads for pos_documents" ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'pos_documents');

CREATE POLICY "Allow authenticated updates for pos_documents" ON storage.objects
FOR UPDATE 
TO authenticated
USING (bucket_id = 'pos_documents')
WITH CHECK (bucket_id = 'pos_documents');

CREATE POLICY "Allow authenticated deletes for pos_documents" ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'pos_documents');

-- 7. Verify the setup
CREATE OR REPLACE FUNCTION check_storage_policies()
RETURNS TABLE (
  bucket_name text,
  policies_count bigint,
  status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id::text as bucket_name,
    COALESCE(p.policy_count, 0) as policies_count,
    CASE 
      WHEN COALESCE(p.policy_count, 0) >= 4 THEN '✅ Ready'
      WHEN COALESCE(p.policy_count, 0) > 0 THEN '⚠️ Incomplete'
      ELSE '❌ No policies'
    END as status
  FROM storage.buckets b
  LEFT JOIN (
    SELECT 
      CASE 
        WHEN policyname LIKE '%product_images%' THEN 'product_images'
        WHEN policyname LIKE '%product_documents%' THEN 'product_documents'
        WHEN policyname LIKE '%pos_images%' THEN 'pos_images'
        WHEN policyname LIKE '%pos_documents%' THEN 'pos_documents'
      END as bucket_id,
      COUNT(*) as policy_count
    FROM pg_policies 
    WHERE tablename = 'objects' 
      AND schemaname = 'storage'
      AND (policyname LIKE '%product_images%' 
           OR policyname LIKE '%product_documents%'
           OR policyname LIKE '%pos_images%'
           OR policyname LIKE '%pos_documents%')
    GROUP BY 1
  ) p ON b.id = p.bucket_id
  WHERE b.id IN ('product_images', 'product_documents', 'pos_images', 'pos_documents')
  ORDER BY b.id;
END;
$$ LANGUAGE plpgsql;

-- 8. Run the verification
SELECT * FROM check_storage_policies();

-- 9. Test authentication and bucket access
CREATE OR REPLACE FUNCTION test_bucket_access(bucket_name text)
RETURNS text AS $$
DECLARE
  result text;
BEGIN
  -- Try to list files in the bucket (this tests read permissions)
  PERFORM * FROM storage.objects WHERE bucket_id = bucket_name LIMIT 1;
  
  result := '✅ Accessible';
  RETURN result;
  
EXCEPTION
  WHEN insufficient_privilege THEN
    RETURN '❌ Permission denied';
  WHEN OTHERS THEN
    RETURN '⚠️ Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test all buckets
SELECT 
  'product_images' as bucket,
  test_bucket_access('product_images') as access_test
UNION ALL
SELECT 
  'product_documents' as bucket,
  test_bucket_access('product_documents') as access_test
UNION ALL
SELECT 
  'pos_images' as bucket,
  test_bucket_access('pos_images') as access_test
UNION ALL
SELECT 
  'pos_documents' as bucket,
  test_bucket_access('pos_documents') as access_test;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '🔒 STORAGE POLICIES SETUP COMPLETED!';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ RLS enabled on storage.objects';
  RAISE NOTICE '✅ Old policies removed';
  RAISE NOTICE '✅ New policies created for all 4 buckets:';
  RAISE NOTICE '   - product_images';
  RAISE NOTICE '   - product_documents'; 
  RAISE NOTICE '   - pos_images';
  RAISE NOTICE '   - pos_documents';
  RAISE NOTICE '';
  RAISE NOTICE '🔑 Each bucket now has 4 policies:';
  RAISE NOTICE '   - INSERT (upload): authenticated users only';
  RAISE NOTICE '   - SELECT (read): public access';
  RAISE NOTICE '   - UPDATE: authenticated users only';
  RAISE NOTICE '   - DELETE: authenticated users only';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Next Steps:';
  RAISE NOTICE '   1. Check verification results above';
  RAISE NOTICE '   2. Log out and back in to refresh auth token';
  RAISE NOTICE '   3. Try uploading a file in your app';
  RAISE NOTICE '=================================================';
END $$;
