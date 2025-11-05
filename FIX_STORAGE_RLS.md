# Fix Storage RLS Policy Error

## Problem
Error: "new row violates row-level security policy"

This happens because Supabase Storage has Row Level Security (RLS) enabled, but there are no policies allowing uploads.

## Solution

### Option 1: Quick Fix via Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard** → **Storage** → **Policies** tab
2. **Select the `product-images` bucket**
3. **Click "New Policy"** and create these policies:

#### Policy 1: Allow Public Read
- **Policy Name**: `Allow public read access`
- **Allowed Operation**: `SELECT`
- **Target Roles**: `public`
- **USING expression**: `bucket_id = 'product-images'`

#### Policy 2: Allow Public Upload
- **Policy Name**: `Allow public uploads`
- **Allowed Operation**: `INSERT`
- **Target Roles**: `public`
- **WITH CHECK expression**: `bucket_id = 'product-images'`

#### Policy 3: Allow Public Delete
- **Policy Name**: `Allow public deletes`
- **Allowed Operation**: `DELETE`
- **Target Roles**: `public`
- **USING expression**: `bucket_id = 'product-images'`

### Option 2: Fix via SQL (Faster)

1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Copy and paste** the SQL from `db/migrations/fix_storage_rls.sql`
3. **Click "Run"**

This will automatically create all necessary policies.

## After Fixing

1. **Refresh your browser** (or restart dev server)
2. **Try uploading an image again**

The upload should now work!

## Alternative: Disable RLS (Not Recommended)

If you want to disable RLS entirely (less secure):

```sql
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

**Note**: This is not recommended for production. Use policies instead.

