-- ============================================================================
-- 🔧 STORAGE PERMISSIONS FIX - Run in Supabase SQL Editor
-- ============================================================================
-- This script creates storage buckets and proper RLS policies
-- ============================================================================

-- 1. Create storage buckets (if they don't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  -- Product Images Bucket
  (
    'product-images',
    'product-images',
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
  ),
  
  -- Product Documents Bucket  
  (
    'product-documents',
    'product-documents',
    true,
    20971520, -- 20MB limit
    ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
  ),
  
  -- POS Images Bucket (for receipts, customer docs, etc.)
  (
    'pos-images',
    'pos-images', 
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  ),
  
  -- POS Documents Bucket
  (
    'pos-documents',
    'pos-documents',
    true,
    10485760, -- 10MB limit
    ARRAY['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  )
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies (if any) to start fresh
DROP POLICY IF EXISTS "Allow authenticated uploads for product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads for product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates for product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes for product-images" ON storage.objects;

DROP POLICY IF EXISTS "Allow authenticated uploads for product-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads for product-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates for product-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes for product-documents" ON storage.objects;

DROP POLICY IF EXISTS "Allow authenticated uploads for pos-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads for pos-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates for pos-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes for pos-images" ON storage.objects;

DROP POLICY IF EXISTS "Allow authenticated uploads for pos-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads for pos-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates for pos-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes for pos-documents" ON storage.objects;

-- 4. Create comprehensive storage policies

-- Product Images Policies
CREATE POLICY "Allow authenticated uploads for product-images" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow public reads for product-images" ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "Allow authenticated updates for product-images" ON storage.objects
FOR UPDATE 
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow authenticated deletes for product-images" ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'product-images');

-- Product Documents Policies
CREATE POLICY "Allow authenticated uploads for product-documents" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'product-documents');

CREATE POLICY "Allow public reads for product-documents" ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'product-documents');

CREATE POLICY "Allow authenticated updates for product-documents" ON storage.objects
FOR UPDATE 
TO authenticated
USING (bucket_id = 'product-documents')
WITH CHECK (bucket_id = 'product-documents');

CREATE POLICY "Allow authenticated deletes for product-documents" ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'product-documents');

-- POS Images Policies
CREATE POLICY "Allow authenticated uploads for pos-images" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'pos-images');

CREATE POLICY "Allow public reads for pos-images" ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'pos-images');

CREATE POLICY "Allow authenticated updates for pos-images" ON storage.objects
FOR UPDATE 
TO authenticated
USING (bucket_id = 'pos-images')
WITH CHECK (bucket_id = 'pos-images');

CREATE POLICY "Allow authenticated deletes for pos-images" ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'pos-images');

-- POS Documents Policies
CREATE POLICY "Allow authenticated uploads for pos-documents" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'pos-documents');

CREATE POLICY "Allow public reads for pos-documents" ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'pos-documents');

CREATE POLICY "Allow authenticated updates for pos-documents" ON storage.objects
FOR UPDATE 
TO authenticated
USING (bucket_id = 'pos-documents')
WITH CHECK (bucket_id = 'pos-documents');

CREATE POLICY "Allow authenticated deletes for pos-documents" ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'pos-documents');

-- 5. Create verification function
CREATE OR REPLACE FUNCTION verify_storage_setup()
RETURNS TABLE (
  bucket_name text,
  bucket_exists boolean,
  policies_count integer,
  test_result text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id as bucket_name,
    true as bucket_exists,
    (SELECT COUNT(*)::integer FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%' || b.id || '%') as policies_count,
    CASE 
      WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%' || b.id || '%') >= 4 
      THEN '✅ Ready'
      ELSE '❌ Missing policies'
    END as test_result
  FROM storage.buckets b
  WHERE b.id IN ('product-images', 'product-documents', 'pos-images', 'pos-documents')
  ORDER BY b.id;
END;
$$ LANGUAGE plpgsql;

-- 6. Run verification
SELECT * FROM verify_storage_setup();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ STORAGE SETUP COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '📁 Buckets Created:';
  RAISE NOTICE '   - product-images (10MB, images only)';
  RAISE NOTICE '   - product-documents (20MB, docs only)';
  RAISE NOTICE '   - pos-images (5MB, images only)';
  RAISE NOTICE '   - pos-documents (10MB, docs only)';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Policies Created:';
  RAISE NOTICE '   - 16 total policies (4 per bucket)';
  RAISE NOTICE '   - INSERT: Authenticated users only';
  RAISE NOTICE '   - SELECT: Public access';
  RAISE NOTICE '   - UPDATE/DELETE: Authenticated users only';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Next Steps:';
  RAISE NOTICE '   1. Test file upload in your app';
  RAISE NOTICE '   2. Check verification results above';
  RAISE NOTICE '   3. If issues persist, check user authentication';
  RAISE NOTICE '=================================================';
END $$;
