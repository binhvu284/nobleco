# Personal ID Feature Setup Guide

This guide will help you set up the Personal ID upload feature using Option A (API-based access control).

## What Has Been Created

✅ Database migration file: `db/migrations/create_user_personal_ids_table.sql`
✅ Repository functions: `api/_repo/personalIds.js`
✅ API endpoints: `api/user-personal-ids.js`
✅ Dev server integration: Added route in `scripts/dev-api-server.mjs`

## What You Need to Set Up

### Step 1: Run Database Migration

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **SQL Editor**
4. Click **New Query**
5. Copy and paste the contents of `db/migrations/create_user_personal_ids_table.sql`
6. Click **Run** (or press Ctrl+Enter)
7. Verify the table was created:
   ```sql
   SELECT * FROM information_schema.tables 
   WHERE table_name = 'user_personal_ids';
   ```

### Step 2: Create Storage Bucket

1. In Supabase Dashboard, go to **Storage**
2. Click **New bucket**
3. Configure:
   - **Name**: `user-personal-ids` (exact name, no spaces)
   - **Public bucket**: ❌ **NO** (Keep it private!)
   - **File size limit**: 5 MB (recommended)
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp`
4. Click **Create bucket**

### Step 3: Configure Environment Variables

#### For Local Development (.env file)

Add these to your `.env` file in the project root:

```env
# Supabase Configuration (if not already present)
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Optional: For frontend (if needed)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:** 
- The `SUPABASE_SERVICE_ROLE_KEY` is **REQUIRED** for server-side storage operations
- Never commit `.env` to Git (it's already in `.gitignore`)
- Restart your dev server after adding variables

#### For Vercel Deployment

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Add these variables:

```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

3. Set for **Production**, **Preview**, and **Development** environments
4. **Redeploy** your application after adding variables

### Step 4: Get Your Supabase Credentials

1. Go to Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → Use as `SUPABASE_URL` and `VITE_SUPABASE_URL`
   - **service_role key** → Use as `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **Keep this secret!**
   - **anon/public key** → Use as `VITE_SUPABASE_ANON_KEY` (optional, for frontend)

### Step 5: Verify Setup

#### Test Database Table
```sql
-- Run this in Supabase SQL Editor
SELECT * FROM user_personal_ids LIMIT 1;
-- Should return empty result (no error means table exists)
```

#### Test Storage Bucket
1. Go to **Storage** → **user-personal-ids**
2. You should see the bucket listed
3. Try uploading a test file manually (you can delete it later)

#### Test API Endpoint (Local)
```bash
# Start your dev server
npm run dev

# In another terminal, test the endpoint
curl http://localhost:3001/api/user-personal-ids?userId=1
# Should return: {} (empty object if no personal ID exists)
```

### Step 6: Security Checklist

- [ ] Storage bucket is **private** (not public)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set in environment variables
- [ ] Service role key is **NOT** exposed to frontend
- [ ] `.env` file is in `.gitignore` (should already be)
- [ ] Database migration has been run successfully

## How It Works

1. **User uploads personal ID images** → Frontend sends to `/api/user-personal-ids`
2. **API validates authentication** → Checks user's session token
3. **API uploads to Supabase Storage** → Uses Service Role Key (bypasses RLS)
4. **API saves metadata to database** → Stores file paths and URLs
5. **User views personal ID** → API fetches from database and provides signed URLs

## Storage Path Structure

Files are stored in this structure:
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

## API Endpoints

- `GET /api/user-personal-ids?userId={id}` - Get personal ID for a user
- `POST /api/user-personal-ids` - Upload personal ID images (multipart/form-data)
- `DELETE /api/user-personal-ids?userId={id}` - Delete personal ID
- `PATCH /api/user-personal-ids?userId={id}&action=verify` - Admin verify personal ID

## Troubleshooting

### Error: "Missing SUPABASE_SERVICE_ROLE_KEY"
- Make sure you've added `SUPABASE_SERVICE_ROLE_KEY` to your `.env` file
- Restart your dev server after adding environment variables

### Error: "Bucket not found"
- Verify the bucket name is exactly `user-personal-ids` (no spaces, lowercase)
- Check that the bucket exists in Supabase Storage dashboard

### Error: "Table does not exist"
- Run the migration file in Supabase SQL Editor
- Verify the table was created: `SELECT * FROM user_personal_ids;`

### Files not uploading
- Check that `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Verify the bucket is created and accessible
- Check browser console and server logs for detailed error messages

## Next Steps

After completing this setup:
1. The UI components will be added to UserProfileModal
2. Admin can view personal IDs in UserDetailModal
3. Users can upload, view, expand, and delete their personal IDs

## Support

If you encounter issues:
1. Check server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure database migration ran successfully
4. Confirm storage bucket exists and is configured correctly

