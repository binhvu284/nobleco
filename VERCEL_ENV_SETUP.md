# Vercel Environment Variables Setup Guide

This guide shows you how to set up environment variables in Vercel using the **"Import .env"** feature for Sepay.vn bank transfer integration.

## Step-by-Step: Import .env File in Vercel

### Step 1: Create .env File Locally

**Option A: Use the Template File (Recommended)**

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```
   (A `.env.example` template file is provided in the project root)

2. **Open `.env` file** and fill in your actual values

**Option B: Create New .env File**

1. **Create a `.env` file** in your project root directory

2. **Add the following environment variables** for Sepay.vn bank transfer integration:

```env
# ============================================
# Sepay.vn Bank Transfer Payment Integration
# ============================================

# Sepay API Token (Get from Sepay Dashboard → API Access)
# This is the ONLY credential needed for Sepay
SEPAY_API_KEY=your_sepay_api_token_here

# ============================================
# Application Base URL
# ============================================

# Production domain (update with your actual domain)
NEXT_PUBLIC_BASE_URL=https://yourdomain.com

# ============================================
# Supabase Configuration (Required)
# ============================================

# Frontend Supabase (Client-side)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# Backend Supabase (Server-side)
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here
```

### Step 2: Fill in Your Actual Values

**Before importing, replace the placeholder values:**

1. **SEPAY_API_KEY:**
   - Login to Sepay Dashboard: https://my.sepay.vn (or https://my.dev.sepay.vn for sandbox)
   - Go to **"Cấu hình Công ty"** → **"API Access"**
   - Click **"+ Thêm API"** → Create API token
   - Copy the token and replace `your_sepay_api_token_here`

2. **NEXT_PUBLIC_BASE_URL:**
   - Replace with your production domain (e.g., `https://app.noblecovn.com`)
   - Or your Vercel deployment URL (e.g., `https://your-project.vercel.app`)

3. **Supabase Credentials:**
   - Get from Supabase Dashboard → Settings → API
   - Replace all Supabase placeholders with your actual values

### Step 3: Import .env File to Vercel

1. **Login to Vercel Dashboard**
   - Go to: https://vercel.com/dashboard
   - Select your **Nobleco** project

2. **Navigate to Environment Variables**
   - Click **"Settings"** in the top navigation
   - Click **"Environment Variables"** in the left sidebar

3. **Select Environment**
   - Use the dropdown at the top: **"All Environments"**
   - Choose where to apply variables:
     - **Production** - Live production environment
     - **Preview** - Preview deployments (pull requests)
     - **Development** - Local development (if using Vercel CLI)
     - **All Environments** - Apply to all (recommended for most variables)

4. **Import .env File**
   - Scroll down to find the **"Import .env"** button (with document icon)
   - Click **"Import .env"** button
   - A file picker dialog will open
   - Select your `.env` file from your project root
   - Click **"Open"** or **"Import"**

5. **Review Imported Variables**
   - Vercel will display all variables from your .env file
   - Review each variable to ensure values are correct
   - **Important:** Check that sensitive values (API keys, secrets) are properly imported

6. **Save Changes**
   - Click the **"Save"** button at the bottom right
   - Vercel will save all imported environment variables

### Step 4: Verify Environment Variables

1. **Check Variables List**
   - After importing, you should see all variables listed in the table
   - Each variable shows:
     - **Key** (variable name)
     - **Value** (masked for security - shows dots)
     - **Edit** and **Delete** buttons

2. **Verify Key Variables**
   - ✅ `SEPAY_API_KEY` - Should be present
   - ✅ `NEXT_PUBLIC_BASE_URL` - Should be present
   - ✅ `VITE_SUPABASE_URL` - Should be present
   - ✅ `VITE_SUPABASE_ANON_KEY` - Should be present
   - ✅ `SUPABASE_URL` - Should be present
   - ✅ `SUPABASE_SERVICE_ROLE_KEY` - Should be present

3. **Test Environment Variables**
   - After saving, trigger a new deployment
   - Or redeploy your latest deployment
   - Check deployment logs to verify variables are loaded correctly

### Step 5: Alternative - Manual Entry

If you prefer to add variables manually instead of importing:

1. **Click "Add Another"** button
2. **Enter Key:** `SEPAY_API_KEY`
3. **Enter Value:** Your Sepay API token
4. **Select Environment:** Choose where to apply
5. **Click "Save"**
6. **Repeat** for each variable

## Complete .env Template for Sepay.vn Bank Transfer

**For Nobleco Project (app.nobleco.vn):**

See `ENV_SETUP_COMPLETE.md` for your complete configuration with actual values.

**Generic Template:**

```env
# ============================================
# Sepay.vn Bank Transfer Payment Integration
# ============================================
# Payment Method: Bank Transfer Only
# Get API Token from: https://my.sepay.vn → Cấu hình Công ty → API Access
SEPAY_API_KEY=

# ============================================
# Application Configuration
# ============================================
# Your production domain or Vercel deployment URL
NEXT_PUBLIC_BASE_URL=

# ============================================
# Supabase Database Configuration
# ============================================
# Frontend (Client-side) - Exposed to browser
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Backend (Server-side) - Keep secret!
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

## Environment-Specific Setup

### For Production

```env
SEPAY_API_KEY=your_production_sepay_api_token
NEXT_PUBLIC_BASE_URL=https://app.noblecovn.com
# ... other production values
```

### For Preview/Development

You can set different values for Preview environments:

1. In Vercel Environment Variables page
2. Select **"Preview"** from the environment dropdown
3. Add variables with test/sandbox values:
   ```env
   SEPAY_API_KEY=your_sandbox_sepay_api_token
   NEXT_PUBLIC_BASE_URL=https://your-project.vercel.app
   ```

### For Local Development

Keep your local `.env` file (don't commit it to Git):

```env
# Local development values
SEPAY_API_KEY=your_sandbox_sepay_api_token
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Local Supabase (same as production or use local Supabase)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Important Notes

### ⚠️ Security Best Practices

1. **Never Commit .env to Git**
   - `.env` files are already in `.gitignore`
   - Never commit sensitive credentials to version control

2. **Use Different Values for Different Environments**
   - Production: Use production Sepay API token
   - Preview/Dev: Use sandbox/test Sepay API token
   - Local: Use sandbox/test values

3. **Mask Sensitive Values**
   - Vercel automatically masks values in the dashboard
   - Values show as dots (••••••) for security

4. **Rotate API Keys Regularly**
   - Update Sepay API tokens periodically
   - Update in Vercel when you rotate keys

### ✅ After Setting Environment Variables

1. **Redeploy Your Application**
   - Environment variables are loaded at build time
   - You need to redeploy for changes to take effect
   - Go to **"Deployments"** → Click **"..."** → **"Redeploy"**

2. **Verify in Logs**
   - Check deployment logs for any environment variable errors
   - Verify API calls are using correct credentials

3. **Test Payment Flow**
   - Test Sepay webhook integration
   - Verify bank transfer payments work correctly

## Troubleshooting

### Issue: Variables Not Loading

**Solution:**
- Ensure you clicked **"Save"** after importing
- Redeploy your application
- Check variable names are exactly correct (case-sensitive)
- Verify environment selection (Production/Preview/All)

### Issue: Wrong Values After Import

**Solution:**
- Click the **Edit** button (pencil icon) next to the variable
- Update the value manually
- Click **"Save"**

### Issue: Variables Missing in Deployment

**Solution:**
- Check which environment the deployment is using
- Ensure variables are set for that environment
- Redeploy after adding variables

### Issue: API Calls Failing

**Solution:**
- Verify `SEPAY_API_KEY` is correct
- Check Sepay dashboard to ensure API token is active
- Verify webhook URL matches your deployment URL
- Check deployment logs for authentication errors

## Quick Reference

**Vercel Environment Variables Page:**
- Settings → Environment Variables
- Use **"Import .env"** button to bulk import variables

**Sepay API Token:**
- Production: https://my.sepay.vn → Cấu hình Công ty → API Access
- Sandbox: https://my.dev.sepay.vn → Cấu hình Công ty → API Access

**Supabase Credentials:**
- https://app.supabase.com → Your Project → Settings → API

**Required Variables for Bank Transfer Payment:**
- ✅ `SEPAY_API_KEY` (Required - Only credential needed for Sepay)
- ✅ `NEXT_PUBLIC_BASE_URL` (Required - Your domain)
- ✅ `VITE_SUPABASE_URL` (Required - Supabase project URL)
- ✅ `VITE_SUPABASE_ANON_KEY` (Required - Supabase anon key)
- ✅ `SUPABASE_URL` (Required - Supabase project URL)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (Required - Supabase service role key)

**Template File:**
- Use `.env.example` as a template (already in project)
- Copy to `.env` and fill in your values

---

**Last Updated:** Based on Vercel dashboard interface and Sepay.vn integration requirements

