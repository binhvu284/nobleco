-- ============================================
-- FIX USER AVATARS STORAGE RLS POLICIES
-- ⚠️ IMPORTANT: Storage policies CANNOT be created via SQL Editor
-- Use Supabase Dashboard → Storage → Policies UI instead!
-- 
-- This file is for reference only. Use the Dashboard method.
-- ============================================

-- NOTE: The following SQL will NOT work due to permissions.
-- Storage policies must be created via Dashboard UI.
-- Keeping this file for documentation purposes only.

-- ============================================
-- INSTRUCTIONS FOR SUPABASE DASHBOARD
-- ============================================

-- 1. Go to Supabase Dashboard → Storage
-- 2. Click on the "user-avatars" bucket
-- 3. Go to "Policies" tab
-- 4. Click "New Policy" and create these policies:

-- Policy 1: Allow public read access
--   Policy Name: Allow public read access
--   Allowed Operation: SELECT
--   Target Roles: public
--   USING expression: bucket_id = 'user-avatars'

-- Policy 2: Allow public uploads
--   Policy Name: Allow public uploads
--   Allowed Operation: INSERT
--   Target Roles: public
--   WITH CHECK expression: bucket_id = 'user-avatars'

-- Policy 3: Allow public updates
--   Policy Name: Allow public updates
--   Allowed Operation: UPDATE
--   Target Roles: public
--   USING expression: bucket_id = 'user-avatars'
--   WITH CHECK expression: bucket_id = 'user-avatars'

-- Policy 4: Allow public deletes
--   Policy Name: Allow public deletes
--   Allowed Operation: DELETE
--   Target Roles: public
--   USING expression: bucket_id = 'user-avatars'

-- ============================================
-- ALTERNATIVE: If bucket is public, RLS might be disabled
-- ============================================

-- If the bucket is set to "Public" in settings, RLS might be disabled.
-- However, if you're still getting permission errors, you need to:
-- 1. Check if bucket is actually public (Settings → Public bucket: ON)
-- 2. If RLS is enabled, create the policies above
-- 3. Make sure the anon key has proper permissions

-- ============================================
-- VERIFICATION
-- ============================================

-- After creating policies, test by:
-- 1. Trying to upload an avatar through the UI
-- 2. Check browser console for any errors
-- 3. Verify the file appears in Storage → user-avatars bucket

