# Debug "Failed to create image record" - Table Exists

Since the table exists, let's debug step by step.

## Step 1: Check Browser Console

1. **Open Browser DevTools** (F12)
2. **Go to Console tab**
3. **Try uploading an image**
4. **Look for error messages** - copy the exact error

## Step 2: Check Network Tab

1. **Open Browser DevTools** → **Network tab**
2. **Try uploading an image**
3. **Find the request** to `/api/product-images` (POST method)
4. **Click on it** to see:
   - **Request Payload** (what data was sent)
   - **Response** (error message from server)
   - **Status Code** (should be 201, but probably 500)

## Step 3: Check Product ID

The most common issue is **invalid product ID** (0 or null).

**Check in Network tab:**
- Look at the Request Payload
- Find `product_id` field
- Make sure it's a valid number (not 0, not null)

**If product_id is 0 or null:**
- The product wasn't created successfully
- Or the product ID isn't being passed correctly

## Step 4: Test API Endpoint Manually

Open browser console and run:

```javascript
// Replace 1 with an actual product ID from your database
fetch('/api/product-images', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    product_id: 1, // Use a real product ID
    storage_path: 'test/123/original/test.jpg',
    url: 'https://your-project.supabase.co/storage/v1/object/public/product-images/test/123/original/test.jpg',
    is_featured: false
  })
})
.then(r => r.json())
.then(data => {
  console.log('Success:', data);
})
.catch(err => {
  console.error('Error:', err);
});
```

This will show the exact error message.

## Step 5: Check API Server Logs

If running `npm run dev:api`:
1. **Check the terminal** where API server is running
2. **Look for error messages** when upload fails
3. **Copy the error message**

## Step 6: Verify Database Schema

Check if all required columns exist:

1. **Go to Supabase Dashboard** → **Table Editor** → **product_images**
2. **Verify these columns exist:**
   - `id` (bigint, auto-increment)
   - `product_id` (bigint, NOT NULL)
   - `storage_path` (text, NOT NULL)
   - `url` (text, NOT NULL)
   - `alt_text` (text, nullable)
   - `sort_order` (integer, default 0)
   - `is_featured` (boolean, default false)
   - `file_size` (integer, nullable)
   - `width` (integer, nullable)
   - `height` (integer, nullable)
   - `mime_type` (text, nullable)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

## Step 7: Check Foreign Key Constraint

Make sure the product exists:

1. **Go to Supabase Dashboard** → **Table Editor** → **products**
2. **Find the product** you're trying to upload images for
3. **Note the product ID**
4. **Make sure it matches** the product_id being sent

## Common Issues & Solutions

### Issue 1: Product ID is 0
**Solution:** Make sure product is created first, then upload images

### Issue 2: Foreign Key Constraint Violation
**Error:** "insert or update on table violates foreign key constraint"
**Solution:** Product doesn't exist - create product first

### Issue 3: NULL Constraint Violation
**Error:** "null value in column violates not-null constraint"
**Solution:** Check that `storage_path` and `url` are being sent correctly

### Issue 4: Invalid URL Format
**Error:** "invalid input syntax"
**Solution:** Check that the URL from Supabase Storage is valid

## What to Share

Please share:
1. **Exact error message** from browser console
2. **Network tab response** (the error JSON)
3. **Product ID** being used
4. **API server logs** (if available)

This will help identify the exact issue!

