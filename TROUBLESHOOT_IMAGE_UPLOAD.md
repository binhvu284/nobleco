# Troubleshoot "Failed to create image record" Error

## Problem
Image uploads to Storage successfully, but fails when creating database record.

## Step 1: Verify Database Table Exists

1. **Go to Supabase Dashboard** → **Table Editor**
2. **Look for `product_images` table**
3. **If it doesn't exist**, run the migration:
   - Go to **SQL Editor**
   - Open `db/migrations/add_product_images_table.sql`
   - Copy and paste the SQL
   - Click **"Run"**

## Step 2: Check Browser Console

1. **Open Browser DevTools** (F12)
2. **Go to Console tab**
3. **Look for detailed error messages**
4. **Common errors:**
   - "relation 'product_images' does not exist" → Table not created
   - "permission denied" → RLS policies issue
   - "null value in column" → Missing required field

## Step 3: Check Network Tab

1. **Open Browser DevTools** → **Network tab**
2. **Try uploading an image again**
3. **Find the request to `/api/product-images`**
4. **Click on it** to see:
   - **Request payload** (what was sent)
   - **Response** (error message)
   - **Status code** (should be 201, not 500)

## Step 4: Check API Server Logs

If running `npm run dev:api`:
1. **Check the terminal** where API server is running
2. **Look for error messages** when upload fails
3. **Common errors:**
   - "Error creating product image: ..."
   - Database connection errors

## Step 5: Verify Product ID

The error might be because:
- Product ID is invalid (0 or null)
- Product doesn't exist in database

**Check:**
- Make sure product was created successfully before uploading images
- Product ID should be a valid number

## Quick Fixes

### Fix 1: Run Database Migration
```sql
-- Run this in Supabase SQL Editor
-- Copy from db/migrations/add_product_images_table.sql
```

### Fix 2: Check Product ID
- In browser console, check what `productId` value is being sent
- Make sure it's not 0 or null

### Fix 3: Test API Endpoint Directly

Open browser console and run:
```javascript
fetch('/api/product-images', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    product_id: 1, // Replace with actual product ID
    storage_path: 'test/path.jpg',
    url: 'https://test.com/image.jpg'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

This will show the exact error message.

## Most Common Issue

**The `product_images` table doesn't exist!**

**Solution:** Run the migration SQL in Supabase Dashboard → SQL Editor

