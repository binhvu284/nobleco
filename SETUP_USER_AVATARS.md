# User Avatars Setup Guide

This guide will help you set up the database and storage for user avatars.

## Step 1: Create Database Table

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the migration script: `db/migrations/add_user_avatars_table.sql`

This will create the `user_avatars` table with:
- One avatar per user (unique constraint on `user_id`)
- Storage path and URL tracking
- Image metadata (dimensions, file size, MIME type)

## Step 2: Create Storage Bucket

1. In Supabase Dashboard, go to **Storage**
2. Click **"New bucket"** or **"Create bucket"**
3. Configure the bucket:
   - **Name**: `user-avatars`
   - **Public bucket**: ✅ **Toggle ON** (allows public access via CDN)
   - **File size limit**: `5 MB` (recommended for avatars)
   - **Allowed MIME types**: `image/*` (or leave empty for all types)
4. Click **"Create bucket"**

## Step 3: Configure Storage Policies (REQUIRED if RLS is enabled)

**IMPORTANT**: Even if the bucket is public, if Row Level Security (RLS) is enabled on the storage.objects table, you MUST create policies.

1. Click on the `user-avatars` bucket
2. Go to **"Policies"** tab
3. Click **"New Policy"** and create these policies:

### Policy 1: Allow Public Read Access
- **Policy Name**: `Allow public read access`
- **Allowed Operation**: `SELECT`
- **Target Roles**: `public`
- **USING expression**: `bucket_id = 'user-avatars'`

### Policy 2: Allow Public Uploads
- **Policy Name**: `Allow public uploads`
- **Allowed Operation**: `INSERT`
- **Target Roles**: `public`
- **WITH CHECK expression**: `bucket_id = 'user-avatars'`

### Policy 3: Allow Public Updates
- **Policy Name**: `Allow public updates`
- **Allowed Operation**: `UPDATE`
- **Target Roles**: `public`
- **USING expression**: `bucket_id = 'user-avatars'`
- **WITH CHECK expression**: `bucket_id = 'user-avatars'`

### Policy 4: Allow Public Deletes
- **Policy Name**: `Allow public deletes`
- **Allowed Operation**: `DELETE`
- **Target Roles**: `public`
- **USING expression**: `bucket_id = 'user-avatars'`

**Note**: If you're still getting permission errors after creating policies, check:
- Bucket Settings → **Public bucket** toggle is ON
- Policies are saved and active (green checkmark)
- Try refreshing the page after creating policies

## Step 4: Verify Setup

1. The `user_avatars` table should be created in your database
2. The `user-avatars` storage bucket should be visible in Storage
3. Test by uploading an avatar through the user profile modal

## Usage

Users can now:
- Upload their avatar in edit profile mode
- Crop/adjust the avatar before uploading
- Replace existing avatars (old avatar is automatically deleted)
- View their avatar in the profile modal

## API Endpoints

- `GET /api/user-avatars?userId={id}` - Get user avatar
- `POST /api/user-avatars?userId={id}` - Upload/update avatar
- `DELETE /api/user-avatars?userId={id}` - Delete avatar

## Notes

- Avatars are automatically compressed to max 800x800px
- Old avatars are automatically deleted when replaced
- Avatar images are stored in Supabase Storage under `{userId}/avatar-{timestamp}-{random}.{ext}`

