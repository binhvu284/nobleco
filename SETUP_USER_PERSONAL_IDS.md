# Setup User Personal IDs Storage

This guide explains how to set up the storage bucket and database table for user personal ID images in Supabase.

## Database Setup

### 1. Run the Migration

Execute the SQL migration file `db/migrations/create_user_personal_ids_table.sql` in your Supabase SQL Editor:

```sql
-- The migration creates:
-- - user_personal_ids table
-- - Indexes for performance
-- - Foreign key constraints
-- - Unique constraint on user_id (one personal ID per user)
```

### 2. Verify Table Creation

After running the migration, verify the table was created:

```sql
SELECT * FROM information_schema.tables 
WHERE table_name = 'user_personal_ids';
```

## Storage Setup

### 1. Create Storage Bucket

1. Go to **Storage** in your Supabase Dashboard
2. Click **New bucket**
3. Configure the bucket:
   - **Name**: `user-personal-ids`
   - **Public bucket**: ❌ **NO** (Keep it private for security)
   - **File size limit**: 5 MB (recommended)
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp`

### 2. Set Up RLS Policies

**IMPORTANT:** Since this project uses custom authentication (not Supabase Auth), Supabase Storage RLS policies won't work with `auth.uid()`. You have two options:

#### Option A: Disable RLS and Handle Access via API (Recommended)

1. Go to **Storage** > **Policies** > **user-personal-ids**
2. **Disable RLS** for this bucket (or leave it enabled but don't create policies)
3. Handle all storage access through your backend API endpoints using the **Service Role Key**
4. Your API will validate user authentication and manage file access server-side

This is the recommended approach for custom authentication systems.

#### Option B: Use Service Role for Storage Operations

If you want to keep RLS enabled but bypass it for your app:

1. Use the **Service Role Key** (not the anon key) in your backend API
2. The service role bypasses RLS policies
3. Implement your own access control in your API endpoints

#### Option C: Create Helper Function (If Using Supabase Auth)

If you plan to integrate Supabase Auth later, you can create a helper function:

```sql
-- Create a function to get user ID from custom auth token
CREATE OR REPLACE FUNCTION get_user_id_from_token()
RETURNS bigint AS $$
DECLARE
  token text;
  user_id bigint;
BEGIN
  -- Extract token from request headers (this is a placeholder)
  -- You'll need to implement token validation logic
  -- For now, return NULL to disable direct client access
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Then use it in policies (but this requires implementing token validation):

```sql
-- Policy example (won't work until token validation is implemented)
(bucket_id = 'user-personal-ids'::text AND (storage.foldername(name))[1] = get_user_id_from_token()::text)
```

**For now, use Option A** - handle all storage operations through your backend API with proper authentication checks.

### 3. Storage Path Structure

The storage paths should follow this structure:
```
user-personal-ids/
  {user_id}/
    front_{timestamp}.{ext}
    back_{timestamp}.{ext}
```

Example:
```
user-personal-ids/
  123/
    front_1704067200000.jpg
    back_1704067200000.jpg
```

## Security Notes

1. **Private Bucket**: The bucket should remain private to protect sensitive personal information
2. **RLS Policies**: Since you're using custom auth, handle access control via your API endpoints, not RLS policies
3. **Service Role Key**: Use Supabase Service Role Key in your backend API for storage operations (keep it secret!)
4. **File Validation**: Always validate file types and sizes on the server side
5. **Access Control**: Implement access control in your API - only users can access their own personal IDs, admins can view all
6. **Verification Status**: The `verified` field tracks if an admin has verified the ID
7. **Never expose Service Role Key**: Keep the service role key in your backend environment variables only

## Testing

After setup, test the following:
1. User can upload front and back images
2. User can view their own images
3. User can delete their own images
4. Admin can view all user personal IDs
5. Admin can delete any personal ID

## API Endpoints

The API endpoints for personal ID management will be:
- `POST /api/user-personal-ids` - Upload personal ID images
- `GET /api/user-personal-ids?userId={id}` - Get user's personal ID
- `DELETE /api/user-personal-ids` - Delete personal ID images
- `PATCH /api/user-personal-ids/verify` - Admin verify personal ID

