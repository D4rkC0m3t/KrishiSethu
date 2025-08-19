-- ============================================================================
-- 📊 CHECK STORAGE POLICIES - Permission-Safe Script
-- ============================================================================
-- This script only READS current policies without modifying anything
-- Safe to run even without owner permissions
-- ============================================================================

-- 1. Check if RLS is enabled on storage.objects
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Enabled'
    ELSE '❌ RLS Disabled - This might be the issue!'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 2. List all existing storage buckets
SELECT 
  id as bucket_name,
  name,
  public,
  file_size_limit,
  created_at
FROM storage.buckets
WHERE id IN ('product_images', 'product_documents', 'pos_images', 'pos_documents')
ORDER BY id;

-- 3. Check existing policies on storage.objects
SELECT 
  policyname as policy_name,
  cmd as operation,
  roles,
  qual as policy_condition,
  CASE 
    WHEN policyname LIKE '%product_images%' THEN 'product_images'
    WHEN policyname LIKE '%product_documents%' THEN 'product_documents'
    WHEN policyname LIKE '%pos_images%' THEN 'pos_images'
    WHEN policyname LIKE '%pos_documents%' THEN 'pos_documents'
    ELSE 'Other/Generic'
  END as bucket_group
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY bucket_group, cmd;

-- 4. Count policies per bucket
SELECT 
  CASE 
    WHEN policyname LIKE '%product_images%' THEN 'product_images'
    WHEN policyname LIKE '%product_documents%' THEN 'product_documents'
    WHEN policyname LIKE '%pos_images%' THEN 'pos_images'
    WHEN policyname LIKE '%pos_documents%' THEN 'pos_documents'
    ELSE 'Other'
  END as bucket_name,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ Complete (4+ policies)'
    WHEN COUNT(*) > 0 THEN '⚠️ Incomplete (' || COUNT(*) || ' policies)'
    ELSE '❌ No policies'
  END as status
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
  AND (policyname LIKE '%product_images%' 
       OR policyname LIKE '%product_documents%'
       OR policyname LIKE '%pos_images%'
       OR policyname LIKE '%pos_documents%')
GROUP BY 1
ORDER BY 1;

-- 5. Summary report
DO $$
DECLARE
  rls_enabled boolean;
  total_buckets integer;
  buckets_with_policies integer;
  total_policies integer;
BEGIN
  -- Check RLS status
  SELECT rowsecurity INTO rls_enabled 
  FROM pg_tables 
  WHERE schemaname = 'storage' AND tablename = 'objects';
  
  -- Count buckets
  SELECT COUNT(*) INTO total_buckets
  FROM storage.buckets
  WHERE id IN ('product_images', 'product_documents', 'pos_images', 'pos_documents');
  
  -- Count buckets with policies
  SELECT COUNT(DISTINCT bucket_name) INTO buckets_with_policies
  FROM (
    SELECT 
      CASE 
        WHEN policyname LIKE '%product_images%' THEN 'product_images'
        WHEN policyname LIKE '%product_documents%' THEN 'product_documents'
        WHEN policyname LIKE '%pos_images%' THEN 'pos_images'
        WHEN policyname LIKE '%pos_documents%' THEN 'pos_documents'
      END as bucket_name
    FROM pg_policies 
    WHERE tablename = 'objects' AND schemaname = 'storage'
      AND (policyname LIKE '%product_images%' 
           OR policyname LIKE '%product_documents%'
           OR policyname LIKE '%pos_images%'
           OR policyname LIKE '%pos_documents%')
  ) t WHERE bucket_name IS NOT NULL;
  
  -- Count total policies
  SELECT COUNT(*) INTO total_policies
  FROM pg_policies 
  WHERE tablename = 'objects' AND schemaname = 'storage'
    AND (policyname LIKE '%product_images%' 
         OR policyname LIKE '%product_documents%'
         OR policyname LIKE '%pos_images%'
         OR policyname LIKE '%pos_documents%');

  RAISE NOTICE '================================================';
  RAISE NOTICE '📊 STORAGE POLICIES DIAGNOSTIC REPORT';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'RLS Status: %', CASE WHEN rls_enabled THEN '✅ Enabled' ELSE '❌ DISABLED (Major Issue!)' END;
  RAISE NOTICE 'Total Buckets: % of 4', total_buckets;
  RAISE NOTICE 'Buckets with Policies: % of 4', COALESCE(buckets_with_policies, 0);
  RAISE NOTICE 'Total Policies: % (should be 16)', total_policies;
  RAISE NOTICE '';
  RAISE NOTICE '🎯 DIAGNOSIS:';
  
  IF NOT rls_enabled THEN
    RAISE NOTICE '❌ CRITICAL: RLS is disabled on storage.objects';
    RAISE NOTICE '   This prevents all storage operations';
  END IF;
  
  IF total_buckets < 4 THEN
    RAISE NOTICE '❌ Missing buckets (found % of 4)', total_buckets;
  END IF;
  
  IF COALESCE(buckets_with_policies, 0) = 0 THEN
    RAISE NOTICE '❌ CRITICAL: No policies found for any bucket';
    RAISE NOTICE '   This is why you get "Permission denied" errors';
  ELSIF COALESCE(buckets_with_policies, 0) < 4 THEN
    RAISE NOTICE '⚠️  Only % of 4 buckets have policies', COALESCE(buckets_with_policies, 0);
  END IF;
  
  IF total_policies = 0 THEN
    RAISE NOTICE '❌ No storage policies exist - must create via Dashboard';
  ELSIF total_policies < 16 THEN
    RAISE NOTICE '⚠️  Incomplete policies (% of 16) - may cause issues', total_policies;
  ELSE
    RAISE NOTICE '✅ Policies look complete';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '💡 SOLUTION:';
  RAISE NOTICE '   Since you cannot modify policies via SQL,';
  RAISE NOTICE '   create them via Supabase Dashboard > Storage > Policies';
  RAISE NOTICE '================================================';
END $$;
