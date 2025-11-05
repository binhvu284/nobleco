# Debug Without DevTools - Alternative Methods

Since you're using Opera and can't access DevTools, here are alternative ways to debug:

## Method 1: Open DevTools in Opera (It Should Work!)

Opera does have DevTools. Try these shortcuts:

- **Windows/Linux**: Press `Ctrl + Shift + I` or `F12`
- **Mac**: Press `Cmd + Option + I`
- **Right-click** on the page → Select **"Inspect"** or **"Inspect Element"**

If that doesn't work, try:
- Menu → **Developer** → **Developer Tools**
- Or Menu → **More Tools** → **Developer Tools**

## Method 2: Check Error Messages in UI

I've added visible error messages! When you try to upload an image:

1. **Look below the upload button**
2. **You'll see a red error box** with:
   - The exact error message
   - The Product ID being used
   - Instructions to check API server logs

## Method 3: Check API Server Terminal

If you're running `npm run dev:api`:

1. **Look at the terminal** where the API server is running
2. **When you upload an image**, you'll see error messages like:
   ```
   POST product image error: Error: ...
   Error details: { message: ..., product_id: ..., ... }
   ```
3. **Copy the error message** and share it

## Method 4: Check Network Activity (Opera)

Even without DevTools, you can check network:

1. **Right-click** on the page
2. **Select "Inspect"** or **"View Page Source"**
3. **Look for Network tab** (if available)
4. Or use **Opera's built-in network monitor**

## Method 5: Test API Directly

Open a new tab and go to:
```
http://localhost:3001/api/product-images?productId=1
```

Replace `1` with an actual product ID. This will show if the API is working.

## Method 6: Check Supabase Dashboard

1. **Go to Supabase Dashboard** → **Table Editor** → **product_images**
2. **Try uploading an image**
3. **Refresh the table** - if no new row appears, the insert failed
4. **Check for any error messages** in the Supabase logs

## Method 7: Add Alert for Errors

I can add a JavaScript `alert()` to show errors. Would you like me to add that?

## What to Look For

When you try to upload, check:

1. **Error message in UI** (red box below upload button)
2. **API server terminal** (error logs)
3. **Product ID** shown in the error (should not be 0)

## Most Common Issues

### Product ID is 0
- **Error will show**: "Product ID: 0"
- **Solution**: Make sure you're editing an existing product, not creating a new one

### Table doesn't exist
- **Error will show**: "relation 'product_images' does not exist"
- **Solution**: Run the migration SQL

### Foreign key violation
- **Error will show**: "violates foreign key constraint"
- **Solution**: Product doesn't exist - create product first

## Share This Information

Please share:
1. **Error message** from the red box in UI
2. **Product ID** shown in the error
3. **API server terminal output** (if available)

This will help identify the exact issue!

