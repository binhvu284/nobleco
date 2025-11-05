# Fix Storage RLS Policy - Dashboard Method (CORRECT WAY)

## Problem
Error: "must be owner of table objects" when trying to create storage policies via SQL.

**Solution**: Storage policies must be created through the Supabase Dashboard UI, not SQL Editor.

## Step-by-Step Fix

### Method 1: Via Storage Policies UI (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to your project

2. **Open Storage**
   - Click **"Storage"** in the left sidebar
   - Click on the **`product-images`** bucket

3. **Go to Policies Tab**
   - Click on the **"Policies"** tab at the top

4. **Create Policy 1: Allow Public Read**
   - Click **"New Policy"** button
   - **Policy Name**: `Allow public read access`
   - **Allowed Operation**: Select **`SELECT`** (or **`Read`**)
   - **Target Roles**: Select **`public`**
   - **USING expression**: 
     ```sql
     bucket_id = 'product-images'
     ```
   - Click **"Review"** then **"Save Policy"**

5. **Create Policy 2: Allow Public Upload**
   - Click **"New Policy"** again
   - **Policy Name**: `Allow public uploads`
   - **Allowed Operation**: Select **`INSERT`** (or **`Upload`**)
   - **Target Roles**: Select **`public`**
   - **WITH CHECK expression**:
     ```sql
     bucket_id = 'product-images'
     ```
   - Click **"Review"** then **"Save Policy"**

6. **Create Policy 3: Allow Public Delete**
   - Click **"New Policy"** again
   - **Policy Name**: `Allow public deletes`
   - **Allowed Operation**: Select **`DELETE`**
   - **Target Roles**: Select **`public`**
   - **USING expression**:
     ```sql
     bucket_id = 'product-images'
     ```
   - Click **"Review"** then **"Save Policy"**

### Method 2: Quick Setup via Policy Templates

Some Supabase versions have policy templates:

1. **Go to Storage** → **`product-images`** bucket → **Policies**
2. Look for **"Create policy from template"** or **"Quick setup"**
3. Select **"Public Access"** or **"Allow all operations"**
4. This will automatically create all necessary policies

### Method 3: Disable RLS Temporarily (For Testing Only)

⚠️ **Warning**: This is less secure. Only use for testing.

1. **Go to Storage** → **`product-images`** bucket
2. **Settings** tab
3. Look for **"Row Level Security"** or **"RLS"** toggle
4. **Disable RLS** (if option available)
5. **Save**

**Note**: Re-enable RLS and add proper policies for production.

## Verify Policies Are Created

After creating policies:

1. **Go to Storage** → **`product-images`** → **Policies**
2. You should see 3 policies listed:
   - Allow public read access
   - Allow public uploads
   - Allow public deletes

## Test Upload

1. **Refresh your browser**
2. **Try uploading an image again**
3. It should work now!

## Troubleshooting

**If policies don't appear:**
- Make sure you're in the correct bucket (`product-images`)
- Refresh the page
- Check that bucket is set to **Public**

**If upload still fails:**
- Check browser console for specific error
- Verify bucket name is exactly `product-images` (case-sensitive)
- Make sure bucket is set to **Public** in bucket settings

---

**The Dashboard UI method is the correct way to create Storage policies in Supabase!**

