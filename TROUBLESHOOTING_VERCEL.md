# Troubleshooting Vercel Image Upload Issue

## Quick Fix Checklist

1. **Verify Environment Variables in Vercel:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Ensure these are set (you can use EITHER set):
     - Option A: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
     - Option B: `SUPABASE_URL` and `SUPABASE_ANON_KEY`
   - Make sure they're set for **Production**, **Preview**, and **Development** environments
   - Values should be:
     - `VITE_SUPABASE_URL` or `SUPABASE_URL`: `https://xxxxx.supabase.co`
     - `VITE_SUPABASE_ANON_KEY` or `SUPABASE_ANON_KEY`: Your anon/public key from Supabase

2. **Redeploy After Setting Variables:**
   - Go to Deployments tab
   - Click "..." on latest deployment
   - Click "Redeploy"
   - Wait for deployment to complete

3. **Test the Config Endpoint:**
   - Visit: `https://your-app.vercel.app/api/test-supabase-config`
   - You should see JSON showing which env vars are set
   - If all show `false`, the variables aren't accessible to the API

4. **Check Vercel Function Logs:**
   - Go to Vercel Dashboard → Your Project → Functions tab
   - Look for errors in `/api/supabase-config` function
   - Check for any 500 errors or runtime errors

## Common Issues

### Issue: "Failed to fetch Supabase config"
**Cause:** The `/api/supabase-config` endpoint is failing or not accessible.

**Solutions:**
1. Check that the endpoint exists: Visit `https://your-app.vercel.app/api/supabase-config` directly
2. Check Vercel function logs for errors
3. Verify environment variables are set correctly (see step 1 above)
4. Ensure you've redeployed after setting variables

### Issue: Environment variables show as `false` in test endpoint
**Cause:** Variables aren't accessible to serverless functions.

**Solutions:**
1. Make sure variables are set in Vercel dashboard (not just `.env` file)
2. Check that variable names are exactly correct (case-sensitive)
3. Verify variables are set for the correct environment (Production/Preview/Development)
4. Redeploy after adding/updating variables

### Issue: Works locally but not on Vercel
**Cause:** Local `.env` file works, but Vercel doesn't have the variables.

**Solutions:**
1. Copy variables from `.env` to Vercel dashboard
2. Ensure `VITE_` prefix is included for client-side variables
3. Redeploy after setting variables

## Debugging Steps

1. **Test Config Endpoint:**
   ```
   curl https://your-app.vercel.app/api/test-supabase-config
   ```
   Should return JSON showing which env vars are present.

2. **Test Supabase Config Endpoint:**
   ```
   curl https://your-app.vercel.app/api/supabase-config
   ```
   Should return `{"url":"...","anonKey":"..."}` if working.

3. **Check Browser Console:**
   - Open browser DevTools → Console
   - Look for errors when uploading image
   - Check Network tab for failed requests to `/api/supabase-config`

4. **Check Vercel Logs:**
   - Vercel Dashboard → Your Project → Logs
   - Filter for `/api/supabase-config`
   - Look for error messages

## Verification

After fixing, verify:
1. Visit `/api/test-supabase-config` - should show env vars as `true`
2. Visit `/api/supabase-config` - should return valid JSON with `url` and `anonKey`
3. Try uploading an image - should work without errors

## Still Not Working?

If still having issues:
1. Check Vercel deployment logs for build errors
2. Verify Supabase project is active and credentials are correct
3. Ensure Storage bucket `product-images` exists in Supabase
4. Check browser console for detailed error messages
5. Verify CORS settings in Supabase (Storage should allow public access)

