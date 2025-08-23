-- =====================================================
-- SIMPLIFIED SUPABASE STORAGE POLICIES
-- All authenticated users can add, edit, delete all files
-- Run this SQL in: Supabase Dashboard > SQL Editor
-- =====================================================

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SIMPLE POLICIES (ALL OPERATIONS FOR AUTHENTICATED USERS)
-- =====================================================

-- Policy 1: Allow all operations on product-images for authenticated users
CREATE POLICY "product_images_full_access" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Policy 2: Allow all operations on product-documents for authenticated users
CREATE POLICY "product_documents_full_access" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'product-documents' 
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'product-documents' 
  AND auth.role() = 'authenticated'
);

-- Policy 3: Allow all operations on pos-images for authenticated users
CREATE POLICY "pos_images_full_access" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'pos-images' 
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'pos-images' 
  AND auth.role() = 'authenticated'
);

-- Policy 4: Allow all operations on pos-documents for authenticated users
CREATE POLICY "pos_documents_full_access" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'pos-documents' 
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'pos-documents' 
  AND auth.role() = 'authenticated'
);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check that policies were created
SELECT policyname, cmd, bucket_id 
FROM pg_policies p
JOIN (
  SELECT 'product-images' as bucket_id UNION ALL
  SELECT 'product-documents' UNION ALL  
  SELECT 'pos-images' UNION ALL
  SELECT 'pos-documents'
) buckets ON p.qual LIKE '%' || buckets.bucket_id || '%'
WHERE p.tablename = 'objects' AND p.schemaname = 'storage'
ORDER BY policyname;
