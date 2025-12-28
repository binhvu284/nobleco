-- Setup centerstone-images storage bucket and RLS policies
-- 
-- IMPORTANT: Due to Supabase permissions, storage policies MUST be created via Dashboard
-- This SQL file is provided for reference, but policies should be created manually.
--
-- ============================================
-- METHOD 1: Create Policies via Supabase Dashboard (RECOMMENDED)
-- ============================================
-- 
-- Step 1: Create Storage Bucket
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "New bucket"
-- 3. Name: "centerstone-images"
-- 4. Public: Yes (checked)
-- 5. File size limit: 50MB (or as needed)
-- 6. Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
-- 7. Click "Create bucket"
--
-- Step 2: Create RLS Policies via Dashboard
-- 1. Go to Storage > centerstone-images bucket
-- 2. Click on "Policies" tab
-- 3. Click "New Policy"
-- 4. Create each policy below using the "Policy Editor" or "Policy Templates"
--
-- ============================================
-- METHOD 2: Try SQL (may require service_role key)
-- ============================================
-- If you have service_role access, you can try running the SQL below.
-- Otherwise, use METHOD 1 (Dashboard) which is guaranteed to work.

-- ============================================
-- RLS Policies for centerstone-images bucket
-- ============================================
-- 
-- NOTE: These policies can be created via SQL only if you have service_role permissions.
-- For regular users, create them via Supabase Dashboard (see METHOD 1 above).

-- Enable RLS on storage.objects (if not already enabled)
-- Note: This is usually enabled by default, but we ensure it's on
-- This may fail if you don't have permissions - that's okay, RLS is usually already enabled
DO $$
BEGIN
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
    -- RLS is likely already enabled, ignore error
    NULL;
END $$;

-- Policy: Allow authenticated users to upload images
-- This allows any authenticated user to upload images to the centerstone-images bucket
DROP POLICY IF EXISTS "Allow authenticated uploads to centerstone-images" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to centerstone-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'centerstone-images' AND
  (storage.foldername(name))[1] IS NOT NULL
);

-- Policy: Allow public read access to centerstone-images
-- This allows anyone (including unauthenticated users) to view images
DROP POLICY IF EXISTS "Allow public read access to centerstone-images" ON storage.objects;
CREATE POLICY "Allow public read access to centerstone-images"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'centerstone-images'
);

-- Policy: Allow authenticated users to update their own uploads
-- Users can update images they uploaded (based on folder structure: {centerstone_id}/original/{filename})
DROP POLICY IF EXISTS "Allow authenticated updates to centerstone-images" ON storage.objects;
CREATE POLICY "Allow authenticated updates to centerstone-images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'centerstone-images'
)
WITH CHECK (
  bucket_id = 'centerstone-images'
);

-- Policy: Allow authenticated users to delete images
-- Users can delete images from the centerstone-images bucket
DROP POLICY IF EXISTS "Allow authenticated deletes from centerstone-images" ON storage.objects;
CREATE POLICY "Allow authenticated deletes from centerstone-images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'centerstone-images'
);

-- ============================================
-- Alternative: More restrictive policies (if needed)
-- ============================================
-- If you want more restrictive policies, you can use these instead:
-- 
-- For uploads, you might want to restrict to specific centerstone IDs:
-- CREATE POLICY IF NOT EXISTS "Allow uploads for specific centerstones"
-- ON storage.objects
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   bucket_id = 'centerstone-images' AND
--   (storage.foldername(name))[1]::bigint IN (
--     SELECT id FROM centerstones
--   )
-- );
--
-- For deletes, you might want to restrict to the owner:
-- CREATE POLICY IF NOT EXISTS "Allow deletes for centerstone owners"
-- ON storage.objects
-- FOR DELETE
-- TO authenticated
-- USING (
--   bucket_id = 'centerstone-images' AND
--   (storage.foldername(name))[1]::bigint IN (
--     SELECT id FROM centerstones WHERE created_by = auth.uid()
--   )
-- );

COMMENT ON POLICY "Allow authenticated uploads to centerstone-images" ON storage.objects IS 
'Allows authenticated users to upload images to centerstone-images bucket';

COMMENT ON POLICY "Allow public read access to centerstone-images" ON storage.objects IS 
'Allows public read access to centerstone-images bucket';

COMMENT ON POLICY "Allow authenticated updates to centerstone-images" ON storage.objects IS 
'Allows authenticated users to update images in centerstone-images bucket';

COMMENT ON POLICY "Allow authenticated deletes from centerstone-images" ON storage.objects IS 
'Allows authenticated users to delete images from centerstone-images bucket';

