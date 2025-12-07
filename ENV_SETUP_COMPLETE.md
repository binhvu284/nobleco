# Complete Environment Setup for Nobleco Payment System

## Your Configuration

- **Domain:** `app.nobleco.vn`
- **Payment Method:** Bank Transfer (Sepay.vn)
- **Sepay API Key:** `[REDACTED-SEPAY-API-KEY]`

## Complete .env File for Vercel Import

Copy this content to create your `.env` file, then import it to Vercel:

```env
# ============================================
# Nobleco Production Environment Variables
# ============================================
# Domain: app.nobleco.vn
# Payment Method: Bank Transfer (Sepay.vn)
# ============================================

# Sepay.vn Bank Transfer Payment Integration
SEPAY_API_KEY=[REDACTED-SEPAY-API-KEY]

# Application Base URL
NEXT_PUBLIC_BASE_URL=https://app.nobleco.vn

# ============================================
# Supabase Configuration
# ============================================
# TODO: Fill in your Supabase credentials
# Get from: https://app.supabase.com → Your Project → Settings → API

# Frontend (Client-side)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# Backend (Server-side) - Keep secret!
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here
```

## Step-by-Step: Set Up in Vercel

### Step 1: Create .env File Locally

1. **Create a file named `.env`** in your project root directory
2. **Copy the content above** into the `.env` file
3. **Fill in your Supabase credentials** (replace the placeholder values)

### Step 2: Import to Vercel

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Select your **Nobleco** project

2. **Navigate to Environment Variables:**
   - Click **"Settings"** in top navigation
   - Click **"Environment Variables"** in left sidebar

3. **Import .env File:**
   - Click the **"Import .env"** button (with document icon)
   - Select your `.env` file
   - Choose **"All Environments"** or **"Production"** from dropdown
   - Click **"Save"**

### Step 3: Verify Variables

After importing, verify these variables are present:

- ✅ `SEPAY_API_KEY` = `[REDACTED-SEPAY-API-KEY]`
- ✅ `NEXT_PUBLIC_BASE_URL` = `https://app.nobleco.vn`
- ✅ `VITE_SUPABASE_URL` = (your Supabase URL)
- ✅ `VITE_SUPABASE_ANON_KEY` = (your Supabase anon key)
- ✅ `SUPABASE_URL` = (your Supabase URL)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` = (your Supabase service role key)

### Step 4: Redeploy

1. **Go to Deployments tab**
2. **Click "..."** on latest deployment
3. **Click "Redeploy"**
4. **Wait for deployment to complete**

## Webhook URL for Sepay Dashboard

When configuring webhook in Sepay Dashboard, use this URL:

```
https://app.nobleco.vn/api/sepay/webhook
```

**Sepay Webhook Configuration:**
- **URL:** `https://app.nobleco.vn/api/sepay/webhook`
- **Authentication:** API Key
- **API Key:** `[REDACTED-SEPAY-API-KEY]`
- **Content Type:** `application/json`
- **Event:** "Có tiền vào" (Money In)

## Local Development .env

For local development, create a `.env` file with:

```env
# Sepay API Key (use same or sandbox key)
SEPAY_API_KEY=[REDACTED-SEPAY-API-KEY]

# Local development URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Supabase (same as production or use test project)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here
```

**For local webhook testing with ngrok:**
```env
# When using ngrok, update this to your ngrok URL
NEXT_PUBLIC_BASE_URL=https://your-ngrok-url.ngrok.io
```

## Next Steps

1. ✅ **Fill in Supabase credentials** in your `.env` file
2. ✅ **Import .env to Vercel** using "Import .env" button
3. ✅ **Configure Sepay webhook** with URL: `https://app.nobleco.vn/api/sepay/webhook`
4. ✅ **Redeploy** your Vercel application
5. ✅ **Test payment flow** with a test transaction

## Important Notes

- ⚠️ **Never commit `.env` file to Git** (already in `.gitignore`)
- ⚠️ **Keep API keys secure** - Don't share or expose them
- ✅ **Domain is set:** `app.nobleco.vn` is configured
- ✅ **Sepay API Key is set:** Ready for bank transfer payments
- ⚠️ **Supabase credentials needed:** Fill in your Supabase values

## Verification Checklist

- [ ] `.env` file created with all values
- [ ] Supabase credentials filled in
- [ ] Environment variables imported to Vercel
- [ ] Variables verified in Vercel dashboard
- [ ] Application redeployed
- [ ] Sepay webhook configured with correct URL
- [ ] Payment flow tested

---

**Domain:** `app.nobleco.vn`  
**Sepay API Key:** Configured  
**Status:** Ready for Supabase credentials and deployment

