-- =====================================================
-- SUPABASE STORAGE RLS POLICIES
-- Complete policies for product-images, product-documents, pos-images, pos-documents
-- Run this SQL in: Supabase Dashboard > SQL Editor
-- =====================================================

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PRODUCT-IMAGES BUCKET POLICIES
-- =====================================================

-- Policy 1: Allow authenticated users to view/download product images
CREATE POLICY "product_images_select_policy" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Policy 2: Allow authenticated users to upload product images
CREATE POLICY "product_images_insert_policy" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Allow users to update their own product images
CREATE POLICY "product_images_update_policy" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Allow users to delete their own product images
CREATE POLICY "product_images_delete_policy" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- PRODUCT-DOCUMENTS BUCKET POLICIES
-- =====================================================

-- Policy 1: Allow authenticated users to view/download product documents
CREATE POLICY "product_documents_select_policy" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'product-documents' 
  AND auth.role() = 'authenticated'
);

-- Policy 2: Allow authenticated users to upload product documents
CREATE POLICY "product_documents_insert_policy" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'product-documents' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Allow users to update their own product documents
CREATE POLICY "product_documents_update_policy" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'product-documents' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Allow users to delete their own product documents
CREATE POLICY "product_documents_delete_policy" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'product-documents' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- POS-IMAGES BUCKET POLICIES
-- =====================================================

-- Policy 1: Allow authenticated users to view/download POS images
CREATE POLICY "pos_images_select_policy" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'pos-images' 
  AND auth.role() = 'authenticated'
);

-- Policy 2: Allow authenticated users to upload POS images
CREATE POLICY "pos_images_insert_policy" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'pos-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Allow users to update their own POS images
CREATE POLICY "pos_images_update_policy" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'pos-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Allow users to delete their own POS images
CREATE POLICY "pos_images_delete_policy" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'pos-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- POS-DOCUMENTS BUCKET POLICIES
-- =====================================================

-- Policy 1: Allow authenticated users to view/download POS documents
CREATE POLICY "pos_documents_select_policy" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'pos-documents' 
  AND auth.role() = 'authenticated'
);

-- Policy 2: Allow authenticated users to upload POS documents
CREATE POLICY "pos_documents_insert_policy" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'pos-documents' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Allow users to update their own POS documents
CREATE POLICY "pos_documents_update_policy" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'pos-documents' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Allow users to delete their own POS documents
CREATE POLICY "pos_documents_delete_policy" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'pos-documents' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- ALTERNATIVE: MORE PERMISSIVE POLICIES (OPTIONAL)
-- Use these instead if you want all authenticated users to manage all files
-- =====================================================

/*
-- More permissive policies (uncomment if needed):

-- PRODUCT-IMAGES (All authenticated users can manage all files)
CREATE POLICY "product_images_all_access" ON storage.objects 
FOR ALL USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- PRODUCT-DOCUMENTS (All authenticated users can manage all files)
CREATE POLICY "product_documents_all_access" ON storage.objects 
FOR ALL USING (bucket_id = 'product-documents' AND auth.role() = 'authenticated');

-- POS-IMAGES (All authenticated users can manage all files)
CREATE POLICY "pos_images_all_access" ON storage.objects 
FOR ALL USING (bucket_id = 'pos-images' AND auth.role() = 'authenticated');

-- POS-DOCUMENTS (All authenticated users can manage all files)
CREATE POLICY "pos_documents_all_access" ON storage.objects 
FOR ALL USING (bucket_id = 'pos-documents' AND auth.role() = 'authenticated');
*/

-- =====================================================
-- VERIFICATION QUERIES
-- Run these to verify your policies were created
-- =====================================================

-- Check all storage policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

-- Check specific policies
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage' 
  AND policyname LIKE '%product_images%'
ORDER BY policyname;
