# Setup Centerstone Images Storage

This guide explains how to set up the `centerstone-images` storage bucket in Supabase for uploading center stone product images.

## Prerequisites

- Access to Supabase Dashboard
- Database migration `create_centerstones_tables.sql` has been run

## Step 1: Create Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"** button
4. Configure the bucket:
   - **Name**: `centerstone-images` (must match exactly)
   - **Public bucket**: ✅ **Yes** (checked) - This allows public read access to images
   - **File size limit**: `50MB` (or adjust as needed)
   - **Allowed MIME types**: 
     - `image/jpeg`
     - `image/png`
     - `image/webp`
     - `image/gif`
5. Click **"Create bucket"**

## Step 2: Create RLS Policies via Dashboard

**Important:** Due to Supabase permissions, storage policies must be created via the Dashboard, not SQL.

### Policy 1: Allow Authenticated Uploads

1. Go to **Storage** > **centerstone-images** bucket
2. Click on the **"Policies"** tab
3. Click **"New Policy"**
4. Choose **"Create a policy from scratch"** or use **"Policy Templates"** > **"Allow authenticated users to upload files"**
5. Configure:
   - **Policy name**: `Allow authenticated uploads to centerstone-images`
   - **Allowed operation**: `INSERT`
   - **Target roles**: `authenticated`
   - **USING expression**: Leave empty or use `bucket_id = 'centerstone-images'`
   - **WITH CHECK expression**: 
     ```sql
     bucket_id = 'centerstone-images' AND (storage.foldername(name))[1] IS NOT NULL
     ```
6. Click **"Review"** then **"Save policy"**

### Policy 2: Allow Public Read Access

1. Click **"New Policy"** again
2. Choose **"Policy Templates"** > **"Allow public read access"** or create from scratch
3. Configure:
   - **Policy name**: `Allow public read access to centerstone-images`
   - **Allowed operation**: `SELECT`
   - **Target roles**: `public`
   - **USING expression**: 
     ```sql
     bucket_id = 'centerstone-images'
     ```
4. Click **"Review"** then **"Save policy"**

### Policy 3: Allow Authenticated Updates

1. Click **"New Policy"** again
2. Create from scratch:
   - **Policy name**: `Allow authenticated updates to centerstone-images`
   - **Allowed operation**: `UPDATE`
   - **Target roles**: `authenticated`
   - **USING expression**: 
     ```sql
     bucket_id = 'centerstone-images'
     ```
   - **WITH CHECK expression**: 
     ```sql
     bucket_id = 'centerstone-images'
     ```
3. Click **"Review"** then **"Save policy"**

### Policy 4: Allow Authenticated Deletes

1. Click **"New Policy"** again
2. Choose **"Policy Templates"** > **"Allow authenticated users to delete their own files"** or create from scratch
3. Configure:
   - **Policy name**: `Allow authenticated deletes from centerstone-images`
   - **Allowed operation**: `DELETE`
   - **Target roles**: `authenticated`
   - **USING expression**: 
     ```sql
     bucket_id = 'centerstone-images'
     ```
4. Click **"Review"** then **"Save policy"**

## Step 3: Verify Setup

To verify the bucket is set up correctly:

1. **Check bucket exists**: Go to Storage > Buckets and verify `centerstone-images` is listed
2. **Check policies**: Go to Storage > centerstone-images > Policies and verify all 4 policies are listed
3. **Test upload**: Try uploading an image for a center stone product in the admin panel

## Troubleshooting

### Error: "new row violates row-level security policy"

This error occurs if:
- The storage bucket doesn't exist → Create it in Step 1
- RLS policies are not set up → Create them in Step 2
- The bucket name doesn't match → Ensure it's exactly `centerstone-images`

### Error: "must be owner of table objects"

This error occurs when trying to create policies via SQL. **Solution:** Create policies via Dashboard (Step 2) instead of SQL.

### Error: "Bucket not found"

- Verify the bucket name is exactly `centerstone-images` (case-sensitive)
- Check that the bucket was created successfully in Supabase Dashboard

### Images not displaying

- Ensure the bucket is set to **Public**
- Check that the RLS policy "Allow public read access to centerstone-images" is active
- Verify the image URLs are correct in the database

## Storage Structure

Images are stored in the following structure:
```
centerstone-images/
  └── {centerstone_id}/
      └── original/
          └── {timestamp}-{random}.{ext}
```

Example:
```
centerstone-images/
  └── 1/
      └── original/
          └── 1703123456789-abc123.jpg
```

## Security Notes

- The bucket is public for read access (images need to be displayed to users)
- Only authenticated users can upload/update/delete images
- Consider implementing more restrictive policies if needed

## Alternative: Using SQL (Advanced)

If you have `service_role` key access, you can try running the SQL migration:
```sql
\i db/migrations/setup_centerstone_images_storage.sql
```

However, for most users, creating policies via Dashboard (Step 2) is the recommended and guaranteed method.
