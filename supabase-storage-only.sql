-- Supabase Storage Setup Only
-- Run this if you get permission errors with the main script

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('product-images', 'product-images', true, 10485760, ARRAY['image/*']),
  ('documents', 'documents', false, 20971520, ARRAY['application/pdf', 'image/*'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create simple storage policies
CREATE POLICY IF NOT EXISTS "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY IF NOT EXISTS "Authenticated Upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'product-images');

CREATE POLICY IF NOT EXISTS "Authenticated Update" ON storage.objects
FOR UPDATE USING (bucket_id = 'product-images');

CREATE POLICY IF NOT EXISTS "Authenticated Delete" ON storage.objects
FOR DELETE USING (bucket_id = 'product-images');
