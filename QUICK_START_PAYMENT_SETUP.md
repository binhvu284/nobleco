# Quick Start: Nobleco Payment System Setup

## Your Configuration

- **Domain:** `app.nobleco.vn`
- **Sepay API Key:** `your_sepay_api_key_here` ⚠️ **NEVER commit real API keys to git!**
- **Payment Method:** Bank Transfer Only

## Quick Setup Steps

### 1. Set Up Environment Variables in Vercel

**Option A: Import .env File (Recommended)**

1. Create `.env` file with this content:
```env
# ⚠️ SECURITY: Replace with your actual API key from Sepay Dashboard
# NEVER commit real API keys to git!
SEPAY_API_KEY=your_sepay_api_key_here
NEXT_PUBLIC_BASE_URL=https://app.nobleco.vn
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

2. In Vercel: **Settings** → **Environment Variables** → **"Import .env"** → Select file → **Save**

**Option B: Manual Entry**

Add each variable manually in Vercel Dashboard:
- `SEPAY_API_KEY` = `your_sepay_api_key_here` (Get from Sepay Dashboard)
- `NEXT_PUBLIC_BASE_URL` = `https://app.nobleco.vn`
- (Add Supabase variables)

### 2. Configure Sepay Webhook

1. **Login to Sepay Dashboard:**
   - https://my.sepay.vn

2. **Go to WebHooks:**
   - Click **"WebHooks"** menu
   - Click **"+ Thêm webhooks"** (Add Webhook)

3. **Configure Webhook:**
   - **Đặt tên:** Nobleco Payment Webhook
   - **Chọn sự kiện:** "Có tiền vào" (Money In)
   - **Gọi đến URL:** `https://app.nobleco.vn/api/sepay/webhook`
   - **Kiểu chứng thực:** API Key
   - **Request Content type:** application/json
   - **API Key:** `your_sepay_api_key_here` (Use the same key as in environment variables)

4. **Save Webhook**

### 3. Redeploy Application

1. Go to Vercel → **Deployments**
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**

### 4. Test Payment Flow

1. Create a test order in your app
2. Go to payment page
3. Complete bank transfer
4. Verify webhook is received
5. Check order status updates

## Webhook URL

```
https://app.nobleco.vn/api/sepay/webhook
```

## Complete Documentation

- **Environment Setup:** `ENV_SETUP_COMPLETE.md`
- **Sepay Integration:** `SEPAY_INTEGRATION_REVISED.md`
- **Vercel Setup:** `VERCEL_ENV_SETUP.md`

## Status Checklist

- [x] Domain configured: `app.nobleco.vn`
- [x] Sepay API Key: Configured
- [ ] Environment variables set in Vercel
- [ ] Supabase credentials added
- [ ] Sepay webhook configured
- [ ] Application redeployed
- [ ] Payment flow tested

---

**Ready to complete:** Fill in Supabase credentials and configure Sepay webhook!

