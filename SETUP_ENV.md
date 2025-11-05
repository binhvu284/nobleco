# Environment Variables Setup

## For Localhost Development

Create a `.env` file in the project root with:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:** 
- Restart the dev server after creating/updating `.env`
- The file should be in the root directory (same level as `package.json`)
- Never commit `.env` to Git (it's already in `.gitignore`)

## For Vercel Deployment

Go to Vercel Dashboard → Your Project → Settings → Environment Variables and add:

```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:**
- After adding variables, you MUST redeploy
- Set for Production, Preview, and Development environments
- Variable names: Use `SUPABASE_URL` and `SUPABASE_ANON_KEY` (without `VITE_` prefix for server-side)

## How to Get Your Supabase Credentials

1. Go to https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → Use as `VITE_SUPABASE_URL` (localhost) or `SUPABASE_URL` (Vercel)
   - **anon/public key** → Use as `VITE_SUPABASE_ANON_KEY` (localhost) or `SUPABASE_ANON_KEY` (Vercel)

## Verify Setup

### Localhost:
1. Create `.env` file with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
2. Restart dev server: `npm run dev`
3. Open browser console - should see "Using build-time Supabase config"
4. Try uploading an image

### Vercel:
1. Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` in Vercel dashboard
2. Redeploy
3. Visit `/api/test-supabase-config` - should show both as `true`
4. Try uploading an image

