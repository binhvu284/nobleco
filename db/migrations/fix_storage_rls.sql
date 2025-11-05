-- ============================================
-- FIX SUPABASE STORAGE RLS POLICIES
-- ⚠️ IMPORTANT: Storage policies CANNOT be created via SQL Editor
-- Use Supabase Dashboard → Storage → Policies UI instead!
-- 
-- This file is for reference only. Use the Dashboard method.
-- See FIX_STORAGE_RLS_DASHBOARD.md for correct instructions.
-- ============================================

-- NOTE: The following SQL will NOT work due to permissions.
-- Storage policies must be created via Dashboard UI.
-- Keeping this file for documentation purposes only.

-- Enable RLS on storage.objects (if not already enabled)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes" ON storage.objects;

-- Policy 1: Allow public read access to product-images bucket
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'product-images'
);

-- Policy 2: Allow public uploads to product-images bucket
-- This allows anonymous users to upload images
CREATE POLICY "Allow public uploads"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
);

-- Policy 3: Allow public updates to product-images bucket
CREATE POLICY "Allow public updates"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'product-images'
)
WITH CHECK (
  bucket_id = 'product-images'
);

-- Policy 4: Allow public deletes from product-images bucket
CREATE POLICY "Allow public deletes"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'product-images'
);

-- ============================================
-- ALTERNATIVE: If you want to restrict uploads to authenticated users only
-- Uncomment the following and comment out the public upload policy above
-- ============================================

-- DROP POLICY IF EXISTS "Allow authenticated uploads only" ON storage.objects;
-- CREATE POLICY "Allow authenticated uploads only"
-- ON storage.objects
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   bucket_id = 'product-images'
-- );

-- ============================================
-- VERIFY POLICIES
-- ============================================

-- Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage';

-- ============================================
-- SETUP COMPLETE!
-- ============================================

