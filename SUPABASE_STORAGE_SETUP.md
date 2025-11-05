# Supabase Storage Setup Guide for Product Images

Follow these steps to set up Supabase Storage for product images.

## Step 1: Access Supabase Dashboard

1. Go to [https://supabase.com](https://supabase.com)
2. Log in to your account
3. Select your project (or create a new one if needed)

## Step 2: Create Storage Bucket

1. In the left sidebar, click on **"Storage"**
2. Click the **"New bucket"** button (or **"Create bucket"**)
3. Fill in the bucket details:
   - **Name**: `product-images`
   - **Public bucket**: ✅ **Toggle ON** (This allows public access via CDN)
   - **File size limit**: `50 MB` (or your preferred limit)
   - **Allowed MIME types**: `image/*` (or leave empty for all types)
4. Click **"Create bucket"**

## Step 3: Configure Bucket Settings

After creating the bucket:

1. Click on the `product-images` bucket to open its settings
2. Go to **"Policies"** tab (if you want to set up Row Level Security)
3. For now, since it's a public bucket, you can skip RLS policies (we'll handle access via API)

### Optional: Set Up RLS Policies (If Needed)

If you want to restrict access:

1. Click **"New Policy"**
2. Create a policy for **SELECT** (read access):
   - Policy name: `Allow public read access`
   - Target roles: `public`
   - USING expression: `true`
   - WITH CHECK expression: `true`
3. Create a policy for **INSERT** (upload access):
   - Policy name: `Allow authenticated uploads`
   - Target roles: `authenticated` (or `service_role` for server-side)
   - USING expression: `true`
   - WITH CHECK expression: `true`
4. Create a policy for **DELETE** (delete access):
   - Policy name: `Allow authenticated deletes`
   - Target roles: `authenticated` (or `service_role` for server-side)
   - USING expression: `true`
   - WITH CHECK expression: `true`

**Note**: Since we're using `service_role` key on the server side, RLS policies may not be necessary. Public buckets are accessible to everyone by default.

## Step 4: Run Database Migration

1. In Supabase Dashboard, go to **"SQL Editor"** (left sidebar)
2. Click **"New query"**
3. Open the file `db/migrations/add_product_images_table.sql` from this project
4. Copy and paste the entire SQL content into the SQL Editor
5. Click **"Run"** (or press `Ctrl+Enter` / `Cmd+Enter`)
6. Verify the execution was successful (you should see "Success. No rows returned")

## Step 5: Verify Your Supabase Credentials

Make sure you have these environment variables set:

### For Server-Side (API):
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your service role key (found in Settings > API)

### For Client-Side (Frontend - if needed):
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your anon/public key (found in Settings > API)

### Where to Find These:

1. In Supabase Dashboard, go to **"Settings"** > **"API"**
2. You'll see:
   - **Project URL**: Copy this as `SUPABASE_URL` or `VITE_SUPABASE_URL`
   - **anon public** key: Copy this as `VITE_SUPABASE_ANON_KEY`
   - **service_role** key: Copy this as `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

## Step 6: Test Storage Access (Optional)

You can test if the bucket is accessible:

1. Go to **Storage** > **product-images**
2. Try uploading a test image manually
3. Verify you can see the image URL

## Step 7: Folder Structure (Auto-Created)

The folder structure will be created automatically when you upload images:
```
product-images/
  {product_id}/
    original/
      {uuid}-{filename}.jpg
```

Example:
```
product-images/
  123/
    original/
      a1b2c3d4-product-image.jpg
```

## Verification Checklist

- [ ] Storage bucket `product-images` created
- [ ] Bucket is set to **Public**
- [ ] File size limit configured (50MB recommended)
- [ ] Database table `product_images` created (via migration)
- [ ] Environment variables configured
- [ ] Test upload works (optional)

## Troubleshooting

### Bucket Not Found Error
- Make sure the bucket name is exactly `product-images` (case-sensitive)
- Check that the bucket exists in your Supabase project

### Permission Denied Error
- Verify the bucket is set to **Public**
- Check your `SUPABASE_SERVICE_ROLE_KEY` is correct
- Ensure RLS policies allow the operations you need

### Database Table Missing
- Run the migration SQL again
- Check the SQL Editor for any errors
- Verify the table exists in **Table Editor** > **product_images**

## Next Steps

After completing this setup:
1. ✅ Backend is ready (repository + API endpoints)
2. ⏭️ Frontend components will be created next
3. ⏭️ Image upload functionality will be integrated

---

**Note**: The frontend will use the Supabase client library to upload files directly to Storage, then create a record in the database via our API endpoint.

