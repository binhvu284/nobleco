# Testing Guide - Product Image Upload

Follow these steps to test the image upload functionality.

## Prerequisites

### 1. Environment Variables Setup

Create a `.env` file in the project root (if it doesn't exist) with your Supabase credentials:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Server-side (for API)
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Where to find these:**
- Go to Supabase Dashboard → Settings → API
- Copy **Project URL** → `VITE_SUPABASE_URL` and `SUPABASE_URL`
- Copy **anon public** key → `VITE_SUPABASE_ANON_KEY`
- Copy **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

### 2. Verify Database Setup

Make sure you've run the database migration:
- Open Supabase Dashboard → SQL Editor
- Run the SQL from `db/migrations/add_product_images_table.sql`
- Verify the `product_images` table exists in Table Editor

### 3. Verify Storage Bucket

Make sure the Storage bucket is set up:
- Go to Supabase Dashboard → Storage
- Verify `product-images` bucket exists
- Check that it's set to **Public**
- Verify file size limit is set (e.g., 50MB)

## Testing Steps

### Step 1: Start the Development Server

```bash
# Terminal 1: Start frontend
npm run dev

# Terminal 2: Start API server (if running locally)
npm run dev:api
```

Or use the combined command:
```bash
npm run dev:full
```

### Step 2: Test Image Upload - New Product

1. **Open the application** in your browser (usually `http://localhost:5173`)

2. **Navigate to Admin Products page**

3. **Click "Add New Product"** button

4. **Fill in product details:**
   - Product Name: "Test Product with Images"
   - Short Description: "Testing image upload"
   - Price: 100000
   - Stock: 10
   - Status: Active

5. **Submit the form** to create the product

6. **After product creation:**
   - The modal should stay open (or reopen) showing the ImageUpload component
   - You should see: "Product Images (0/4)"
   - Click the "+ Upload Image" button

7. **Select an image file:**
   - Choose a test image (JPG, PNG, etc.)
   - Image should start uploading immediately
   - You should see upload progress/loading indicator

8. **Verify upload:**
   - Image should appear in the preview grid
   - First image should have "Featured" badge
   - Check browser console for any errors

9. **Upload multiple images:**
   - Try uploading 2-3 more images
   - Verify they all appear in the grid
   - Check that limit (4 images) is enforced

10. **Test image removal:**
    - Click the "×" button on an image
    - Image should be removed from both UI and database

### Step 3: Test Image Upload - Edit Existing Product

1. **Edit an existing product** (one you just created)

2. **Verify existing images load:**
   - Images should display automatically
   - Should show count: "Product Images (X/4)"

3. **Add more images:**
   - Upload additional images
   - Verify they're added to the list

4. **Remove images:**
   - Remove some images
   - Verify they're deleted

### Step 4: Test Image Display - Product Detail

1. **Open a product detail modal** (click on a product)

2. **Verify images display:**
   - Main image should be visible
   - Thumbnails should appear below (if multiple images)
   - Navigation arrows should work (if multiple images)

3. **Test gallery navigation:**
   - Click thumbnails to switch images
   - Use arrow buttons to navigate
   - Verify image counter shows correct count

### Step 5: Verify Data in Supabase

1. **Check Database:**
   - Go to Supabase Dashboard → Table Editor → `product_images`
   - Verify records exist for your test product
   - Check that all fields are populated correctly

2. **Check Storage:**
   - Go to Supabase Dashboard → Storage → `product-images`
   - Verify files are uploaded in folder structure: `{product_id}/original/{filename}`
   - Click on a file to verify it's accessible

3. **Check Image URLs:**
   - Copy a URL from the database
   - Open in browser to verify image loads

## Expected Behavior

### ✅ Success Indicators:
- Images upload without errors
- Images appear in preview immediately
- Images persist after page refresh
- Images display correctly in product detail view
- Image deletion works
- File size is compressed (check original vs uploaded)
- Images are accessible via public URLs

### ⚠️ Common Issues & Solutions:

**Issue: "Missing Supabase environment variables"**
- Solution: Check `.env` file exists and has correct variables
- Restart dev server after adding `.env` file

**Issue: "Failed to upload image"**
- Check browser console for detailed error
- Verify Storage bucket is public
- Verify Storage bucket name is exactly `product-images`
- Check file size (should be under 50MB)

**Issue: "Product images not loading"**
- Check API endpoint: `/api/product-images?productId=X`
- Verify database table exists
- Check browser Network tab for API errors

**Issue: "Images don't display"**
- Check image URLs are accessible
- Verify Storage bucket permissions
- Check browser console for CORS errors

**Issue: "Image upload fails silently"**
- Check browser console for errors
- Verify Supabase client is initialized correctly
- Check Network tab for failed requests

## Testing Checklist

- [ ] Environment variables configured
- [ ] Database migration completed
- [ ] Storage bucket created and configured
- [ ] Can create new product
- [ ] Can upload first image
- [ ] Can upload multiple images (up to 4)
- [ ] Image limit enforced (can't upload more than 4)
- [ ] Can remove images
- [ ] Images persist after page refresh
- [ ] Images display in product detail modal
- [ ] Gallery navigation works
- [ ] Featured image badge appears correctly
- [ ] Image compression works (check file sizes)
- [ ] Images accessible via public URLs

## Browser Console Checks

Open browser DevTools (F12) and check:

1. **Console Tab:**
   - No red errors
   - Check for any warnings

2. **Network Tab:**
   - Filter by "product-images" or "api"
   - Verify requests return 200 OK
   - Check request/response payloads

3. **Application Tab (Storage):**
   - Check if Supabase client is initialized
   - Verify environment variables are loaded

## Next Steps After Testing

If everything works:
- ✅ Add CSS styles for better UI
- ✅ Optimize image compression settings
- ✅ Add error handling improvements

If issues found:
- Note the specific error messages
- Check which step failed
- Verify configuration steps

---

**Need Help?**
- Check browser console for detailed errors
- Verify all environment variables are set
- Ensure Supabase Storage bucket is properly configured
- Check API server logs for backend errors

