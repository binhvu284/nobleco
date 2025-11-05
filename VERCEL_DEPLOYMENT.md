# Vercel Deployment Guide

## Required Environment Variables

For image uploads and Supabase integration to work on Vercel, you need to set the following environment variables in your Vercel project settings:

### Frontend Environment Variables (Client-side)

These variables are prefixed with `VITE_` because Vite only exposes environment variables that start with `VITE_` to the client-side code.

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Backend Environment Variables (Server-side)

These are used by the API routes (serverless functions):

```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Note:** The `SUPABASE_SERVICE_ROLE_KEY` is preferred for server-side operations as it bypasses Row Level Security (RLS). Keep this key secure and never expose it to the client.

## How to Get Your Supabase Credentials

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Navigate to **Settings** → **API**
3. Copy the following:
   - **Project URL** → Use as `VITE_SUPABASE_URL` and `SUPABASE_URL`
   - **anon/public key** → Use as `VITE_SUPABASE_ANON_KEY`
   - **service_role key** → Use as `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

## Setting Environment Variables in Vercel

### Option 1: Via Vercel Dashboard (Recommended)

1. Go to your project on Vercel: https://vercel.com/dashboard
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add each variable:
   - **Key**: `VITE_SUPABASE_URL`
   - **Value**: Your Supabase project URL
   - **Environment**: Select all (Production, Preview, Development)
   - Click **Save**
6. Repeat for all other variables

### Option 2: Via Vercel CLI

```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

## After Setting Environment Variables

**Important:** After adding or updating environment variables in Vercel, you **must redeploy** your application for the changes to take effect.

1. Go to **Deployments** tab in Vercel
2. Click the **"..."** menu on the latest deployment
3. Click **Redeploy**

Or trigger a new deployment by pushing a commit to your connected Git repository.

## Troubleshooting

### Error: "Missing Supabase environment variables"

- ✅ Verify all environment variables are set in Vercel dashboard
- ✅ Ensure variable names are exactly correct (case-sensitive)
- ✅ Make sure you've redeployed after adding variables
- ✅ Check that `VITE_` prefix is included for client-side variables

### Image Upload Still Failing

- ✅ Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- ✅ Check that your Supabase Storage bucket `product-images` exists
- ✅ Ensure Storage bucket has public access for read operations
- ✅ Check browser console for detailed error messages

## Local Development

For local development, create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Note:** Never commit `.env` files to Git. They are already in `.gitignore`.

