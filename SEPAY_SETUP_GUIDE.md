# Sepay.vn Integration Setup Guide

This guide will walk you through setting up Sepay.vn payment gateway integration with your Nobleco project.

## Overview

**IMPORTANT:** Based on the [official Sepay.vn documentation](https://docs.sepay.vn/tich-hop-webhooks.html), Sepay.vn is **NOT** a traditional payment gateway API. It's a **bank transaction monitoring service** that:

- Monitors your bank accounts for incoming/outgoing transactions
- Sends webhooks when transactions occur
- Auto-detects payment codes from transaction content
- Does **NOT** create payment orders or generate QR codes via API

**Your integration needs:**
- **QR Code Generation**: Generate QR codes locally (with payment code embedded)
- **Webhook Processing**: Receive and process Sepay webhooks when payments occur
- **Payment Code Matching**: Match payment codes from webhooks to orders
- **Commission Processing**: Automatically process commissions when payment is confirmed

**See `SEPAY_INTEGRATION_REVISED.md` for the complete revised integration plan.**

## ✅ Localhost Testing is Fully Supported!

**You can test the entire payment flow on localhost before deploying to Vercel!**

Your project is configured to work locally:
- ✅ API routes work on localhost (dev server on port 3001)
- ✅ Frontend works on localhost (Vite dev server on port 3000)
- ✅ Webhooks work via ngrok (tunnels to localhost)
- ✅ Payment creation, status polling, and webhook processing all work locally

**Quick Localhost Setup:**
1. Get Sepay API credentials (sandbox/test credentials recommended)
2. Set up `.env` file with credentials
3. Start dev servers: `npm run dev:api` and `npm run dev`
4. Start ngrok: `ngrok http 3000`
5. Configure webhook URL in Sepay dashboard (use ngrok URL)
6. Test payment flow!

See **"Step 4: Configure Environment Variables → For Local Development"** for detailed instructions.

## Step-by-Step Setup Instructions

### Step 1: Register/Login to Sepay.vn

1. Go to **https://sepay.vn** (or the Sepay.vn merchant portal)
2. Register a new merchant account or login to your existing account
3. Complete the merchant verification process (if required)
   - Business registration documents
   - Bank account information
   - Identity verification

### Step 2: Create API Token

**According to [Sepay documentation](https://docs.sepay.vn/tao-api-token.html):**

1. **Login to Sepay Dashboard**
   - Production: https://my.sepay.vn
   - Sandbox (for testing): https://my.dev.sepay.vn

2. **Navigate to API Access:**
   - Go to **"Cấu hình Công ty"** (Company Configuration)
   - Click **"API Access"**
   - Click **"+ Thêm API"** (Add API) button (top right)

3. **Create API Token:**
   - **Tên (Name):** Enter any name (e.g., "Nobleco Integration")
   - **Trạng thái (Status):** Select **"Hoạt động"** (Active)
   - Click **"Thêm"** (Add)

4. **Copy API Token:**
   - After creation, the API Token appears in the list
   - **Copy this token** - this is your `SEPAY_API_KEY`
   - **Note:** Currently, Sepay API tokens have full access (no permission restrictions)

5. **Important Notes:**
   - Sepay uses **API Key authentication**, not API Secret
   - Webhook authentication uses the same API Key: `Authorization: Apikey YOUR_API_KEY`
   - No separate "Merchant ID" or "API Secret" needed
   - Store the API token securely - never commit to Git

### Step 3: Connect Bank Account

**Before setting up webhooks, you need to connect your bank account to Sepay.**

1. **Navigate to Bank Settings:**
   - Go to **"Ngân hàng"** (Bank) menu in Sepay dashboard
   - Click **"+ Kết nối tài khoản"** (Connect Account)

2. **Choose Connection Method:**
   
   **Option A: Via Bank API (Recommended - Real-time)**
   - SePay partners with: ACB, MSB, VietinBank, TPBank
   - If you have account at these banks, connect via API for instant notifications
   - See: https://sepay.vn/acb.html
   
   **Option B: Via SMS Balance Notifications**
   - For banks without API support
   - SePay receives SMS notifications from your bank
   - Processes transactions from SMS content

3. **Complete Setup:**
   - Follow Sepay's instructions for your chosen method
   - Verify account is connected and active

### Step 4: Configure Payment Code Recognition

**CRITICAL:** Sepay needs to match transactions to your orders using payment codes.

1. **Navigate to Payment Code Configuration:**
   - Go to **"Công ty"** (Company) → **"Cấu hình chung"** (General Configuration)
   - Find **"Cấu trúc mã thanh toán"** (Payment Code Structure)

2. **Configure Code Pattern:**
   - Set up pattern that Sepay will recognize in transaction content
   - Example: If your order numbers are "ORD-2024-123456", configure Sepay to recognize this
   - Or use simpler format (e.g., just numbers: "123456")

3. **Test Code Recognition:**
   - Use Sepay's test transaction: **"Giao dịch"** → **"Giả lập giao dịch"** (Simulate Transaction)
   - Create test transaction with your payment code
   - Verify Sepay detects the code correctly

### Step 5: Configure Webhook Endpoint

**According to [Sepay webhook documentation](https://docs.sepay.vn/tich-hop-webhooks.html):**

1. **Navigate to Webhooks:**
   - Go to **"WebHooks"** menu in Sepay dashboard
   - Click **"+ Thêm webhooks"** (Add Webhook) button (top right)

2. **Configure Webhook Details:**
   
   **Basic Information:**
   - **Đặt tên (Name):** Any name (e.g., "Nobleco Payment Webhook")
   
   **Chọn sự kiện (Select Event):**
   - Choose **"Có tiền vào"** (Money In) - for customer payments
   - Or **"Cả hai"** (Both) - if you want both in/out transactions
   
   **Chọn điều kiện (Select Conditions):**
   - **Khi tài khoản ngân hàng là:** Select your bank account(s)
   - **Lọc theo tài khoản ảo:** (Optional) Filter by virtual accounts
   - **Bỏ qua nếu nội dung giao dịch không có Code thanh toán?:**
     - Choose **"Có"** (Yes) - only transactions with payment codes
     - Choose **"Không"** (No) - all transactions
   
   **Thuộc tính WebHooks (Webhook Properties):**
   - **Gọi đến URL:** Your webhook endpoint
     - **Production (Nobleco):** `https://app.nobleco.vn/api/sepay/webhook`
     - Localhost: `https://your-ngrok-url.ngrok.io/api/sepay/webhook`
   - **Là WebHooks xác thực thanh toán?:** Choose **"Đúng"** (Yes)
   - **Gọi lại WebHooks khi?:** Select **"HTTP Status Code không nằm trong phạm vi từ 200 đến 299"**
   
   **Cấu hình chứng thực WebHooks (Authentication):**
   - **Kiểu chứng thực:** Choose **"API Key"** (Recommended)
   - **Request Content type:** Choose **"application/json"**
   - Sepay will send: `Authorization: Apikey YOUR_API_KEY`
   - Use the API Token from Step 2

3. **Save Webhook:**
   - Click **"Thêm"** (Add) to save
   - Webhook appears in your webhooks list

4. **Test Webhook:**
   - Use **"Giao dịch"** → **"Giả lập giao dịch"** (Simulate Transaction) to test
   - Check **"Nhật ký"** → **"Nhật ký webhooks"** (Webhook Logs) to see webhook calls

### Step 4: Configure Environment Variables

#### For Vercel (Production)

1. **Go to Vercel Dashboard**
   - Navigate to: https://vercel.com/dashboard
   - Select your **Nobleco** project

2. **Go to Settings → Environment Variables**

3. **Add the Following Variables:**

   ```env
   # Sepay API Configuration
   # Only API_KEY is needed (from Step 2)
   SEPAY_API_KEY=your_api_token_from_sepay_dashboard
   
   # Note: Sepay uses API Key authentication, not API Secret
   # Webhook authentication uses: Authorization: Apikey YOUR_API_KEY
   ```

   **Important Notes:**
   - Replace all placeholder values with your actual credentials from Step 2
   - Set **Environment** to **Production** (or **All** if you want to use in preview/dev)
   - Click **Save** after adding each variable

4. **Also Set Base URL** (if not already set):
   ```env
   NEXT_PUBLIC_BASE_URL=https://yourdomain.com
   ```
   Replace with your actual production domain

#### For Local Development (Localhost Testing)

**✅ GOOD NEWS: You CAN test payment integration fully on localhost!**

Your project is already configured to work locally. Here's how to set it up:

1. **Create/Update `.env` file** in project root:
   ```env
   # Sepay API Configuration
   # Use sandbox/test credentials for local testing
   SEPAY_API_KEY=your_sepay_api_key_here
   SEPAY_API_SECRET=your_sepay_api_secret_here
   SEPAY_MERCHANT_ID=your_merchant_id_here
   SEPAY_WEBHOOK_SECRET=your_webhook_secret_here
   
   # Use Sepay sandbox/test API URL for local testing
   # Check Sepay documentation for the correct sandbox URL
   # Common options:
   # - https://sandbox.sepay.vn/v1
   # - https://api.sepay.vn/v1 (if they use same URL with test credentials)
   # - https://my.sepay.vn/userapi (check Sepay docs)
   SEPAY_API_URL=https://api.sepay.vn/v1
   
   # Base URL - will be updated when using ngrok
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   
   # Supabase (required for local development)
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Start Your Local Development Servers:**
   
   **Option A: Run Both Servers Together (Recommended):**
   ```bash
   npm run dev:full
   # This starts both API server (port 3001) and frontend (port 3000) together
   ```
   
   **Option B: Run Servers Separately:**
   
   **Terminal 1 - Start API Server:**
   ```bash
   npm run dev:api
   # This starts the API server on http://localhost:3001
   ```
   
   **Terminal 2 - Start Frontend Dev Server:**
   ```bash
   npm run dev
   # This starts Vite dev server on http://localhost:3000
   # It automatically proxies /api requests to localhost:3001
   ```

3. **Set Up ngrok for Webhook Testing:**
   
   Webhooks require a public URL, so we'll use ngrok to expose your localhost:
   
   **Install ngrok:**
   ```bash
   # Option 1: Using npm (recommended)
   npm install -g ngrok
   
   # Option 2: Download from https://ngrok.com/download
   ```
   
   **Start ngrok (Terminal 3):**
   ```bash
   ngrok http 3000
   ```
   
   **Copy the HTTPS URL** ngrok provides (e.g., `https://abc123.ngrok.io`)
   
   **Update `.env` file:**
   ```env
   NEXT_PUBLIC_BASE_URL=https://abc123.ngrok.io
   ```
   
   **Restart your dev servers** after updating `.env`

4. **Configure Webhook in Sepay Dashboard:**
   
   - Go to Sepay Dashboard → Webhooks section
   - Add new webhook URL: `https://your-ngrok-url.ngrok.io/api/sepay/webhook`
   - Subscribe to events: `payment.success`, `payment.paid`, `payment.failed`
   - Save the webhook secret (use it for `SEPAY_WEBHOOK_SECRET`)

5. **Important Notes for Localhost Testing:**
   
   - ✅ **API Routes Work Locally**: Your dev server handles `/api/*` routes
   - ✅ **Webhooks Work**: ngrok tunnels webhooks to your localhost
   - ✅ **Payment Creation Works**: Can create payment orders from localhost
   - ✅ **QR Codes Display**: QR codes from Sepay will display correctly
   - ⚠️ **ngrok URL Changes**: Free ngrok URLs change each time you restart. For testing, you can:
     - Use ngrok's paid plan for fixed URLs
     - Or update webhook URL in Sepay dashboard each time
   - ⚠️ **Keep ngrok Running**: Don't close the ngrok terminal while testing

6. **Testing Flow on Localhost:**
   
   ```
   1. Start API server (port 3001)
   2. Start frontend dev server (port 3000)
   3. Start ngrok (tunnels to port 3000)
   4. Update Sepay webhook URL with ngrok URL
   5. Create test order in your app (localhost:3000)
   6. Payment page creates Sepay order via API
   7. QR code displays (from Sepay)
   8. Complete payment in banking app
   9. Sepay sends webhook → ngrok → localhost:3000/api/sepay/webhook
   10. Your API processes webhook → Updates order status
   11. Frontend polls payment status → Shows success
   ```

### Step 5: Verify API Integration

1. **Check API Endpoints in Your Code:**
   - Payment creation: `/api/orders/[id]/create-payment` ✅ (works on localhost)
   - Payment status: `/api/orders/[id]/payment-status` ✅ (works on localhost)
   - Webhook: `/api/sepay/webhook` ✅ (works on localhost with ngrok)

2. **Verify API URL Format:**
   - Your code uses: `https://api.sepay.vn/v1`
   - **Important:** Verify this is correct with Sepay documentation
   - **For Localhost Testing:** Use Sepay's sandbox/test environment:
     - Check Sepay Dashboard for sandbox/test API URL
     - Common options:
       - `https://sandbox.sepay.vn/v1` (if available)
       - `https://api.sepay.vn/v1` (same URL, different credentials)
       - `https://my.sepay.vn/userapi` (check Sepay docs)
     - Use test/sandbox credentials in `.env` for localhost
   - **For Production:** Use production API URL and credentials

3. **Sepay API Documentation:**
   - Official docs: https://developer.sepay.vn/
   - Check for:
     - Sandbox/test environment URL
     - Test credentials
     - API endpoint structure
     - Request/response formats

3. **Verify Signature Algorithm:**
   - Your code uses **HMAC-SHA256** for signatures
   - Verify with Sepay documentation that this is correct
   - Some payment gateways use:
     - HMAC-SHA256 (your current implementation)
     - HMAC-SHA512
     - MD5 hash
     - Different signature formats

### Step 6: Test the Integration

#### Test 1: Create Payment Order (Localhost)

1. **Ensure all servers are running:**
   - ✅ API server: `npm run dev:api` (port 3001)
   - ✅ Frontend server: `npm run dev` (port 3000)
   - ✅ ngrok: `ngrok http 3000` (for webhooks)

2. **Create a test order** in your application:
   - Go to `http://localhost:3000`
   - Add products to cart
   - Proceed to checkout
   - Complete order creation

3. **Navigate to payment page:**
   - Should automatically redirect to payment page
   - Payment page will call `/api/orders/[id]/create-payment`

4. **Check browser console** (F12 → Console tab) for any errors

5. **Verify:**
   - ✅ QR code is displayed (from Sepay API)
   - ✅ Bank account info is shown (if provided by Sepay)
   - ✅ No API errors in console
   - ✅ Payment status shows "pending" or "waiting for payment"

6. **Check API server logs** (Terminal 1) for:
   - Successful API call to Sepay
   - Response from Sepay with QR code URL
   - Any error messages

#### Test 2: Webhook Delivery (Localhost)

1. **Ensure ngrok is running** and webhook URL is configured in Sepay dashboard

2. **Make a test payment:**
   - Scan QR code with your banking app (or use Sepay's test payment method)
   - Complete the payment
   - **Note:** Use Sepay's sandbox/test mode for testing (no real money)

3. **Monitor webhook reception:**
   
   **Option A: Check API server logs (Terminal 1):**
   - Look for: `"Sepay webhook received:"` log message
   - Check for any error messages
   
   **Option B: Check webhook logs in database:**
   - Your code logs webhooks to `webhook_logs` table in Supabase
   - Query the table:
     ```sql
     SELECT * FROM webhook_logs 
     ORDER BY created_at DESC 
     LIMIT 10;
     ```
   - Check `processed` column (should be `true` if successful)
   - Check `processing_error` column (should be `null` if successful)

4. **Verify webhook processing:**
   - ✅ Order status updated to "completed" in database
   - ✅ Payment status updated to "paid"
   - ✅ Commissions were processed (check user points/wallet)
   - ✅ Frontend automatically detects payment completion (polling)

5. **Troubleshooting webhook issues:**
   - Check ngrok is still running (URL might have changed)
   - Verify webhook URL in Sepay dashboard matches ngrok URL
   - Check API server is running and receiving requests
   - Verify `SEPAY_WEBHOOK_SECRET` matches Sepay dashboard

#### Test 3: Payment Status Polling (Localhost)

1. **Start a payment** (don't complete it yet):
   - Create order and go to payment page
   - QR code should be displayed
   - Payment status should show "pending"

2. **Check browser console** (F12 → Network tab):
   - Should see requests to `/api/orders/[id]/payment-status` every 5 seconds
   - Filter by "payment-status" to see polling requests
   - Check response status (should be 200)

3. **Complete payment** in banking app (or Sepay test mode)

4. **Verify frontend detects payment completion:**
   - ✅ Polling should detect status change to "paid"
   - ✅ Page should show success message
   - ✅ Should redirect to success page or show completion UI
   - ✅ Polling should stop automatically

5. **Check API server logs** for polling requests:
   - Should see multiple `GET /api/orders/[id]/payment-status` requests
   - Final request should show `status: "paid"`

### Step 7: Verify Database Schema

Ensure your database has the required fields:

1. **Orders Table:**
   ```sql
   -- Check if these columns exist
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'orders' 
   AND column_name IN ('sepay_order_id', 'sepay_transaction_id', 'webhook_received_at', 'payment_confirmed_by');
   ```

2. **Webhook Logs Table:**
   ```sql
   -- Check if table exists
   SELECT * FROM webhook_logs LIMIT 1;
   ```

3. **If Missing, Run Migrations:**
   - Check `db/migrations/add_sepay_fields.sql`
   - Check `db/migrations/create_webhook_logs_table.sql`
   - Run them in Supabase SQL Editor if needed

## Common Issues and Solutions

### Issue 1: "Sepay API credentials not configured"

**Solution:**
- **For Localhost:** Verify all environment variables are set in `.env` file
- **For Vercel:** Verify all environment variables are set in Vercel dashboard
- Ensure variable names are exactly: `SEPAY_API_KEY`, `SEPAY_API_SECRET`, `SEPAY_MERCHANT_ID`
- **For Localhost:** Restart both API server and frontend dev server after updating `.env`
- **For Vercel:** Redeploy your application after adding variables

### Issue 2: "Invalid signature" error

**Solution:**
- Verify `SEPAY_API_SECRET` matches your Sepay dashboard
- Check that signature algorithm matches Sepay's requirements (HMAC-SHA256)
- Ensure payload format matches Sepay's expected format
- Check Sepay API documentation for exact signature generation method

### Issue 3: Webhook not received (Localhost)

**Solution:**
- ✅ **Check ngrok is running:** `ngrok http 3000` must be active
- ✅ **Verify ngrok URL matches Sepay dashboard:** Webhook URL must be exact
- ✅ **Check API server is running:** `npm run dev:api` on port 3001
- ✅ **Test webhook endpoint manually:**
  ```bash
  curl -X POST https://your-ngrok-url.ngrok.io/api/sepay/webhook \
    -H "Content-Type: application/json" \
    -d '{"test": "data"}'
  ```
- ✅ **Check webhook is enabled in Sepay dashboard**
- ✅ **Verify webhook events are subscribed correctly**
- ✅ **Check `webhook_logs` table** for any received webhooks
- ✅ **Restart ngrok if URL changed:** Update Sepay dashboard with new URL
- ✅ **Check API server logs** for incoming webhook requests

### Issue 4: API endpoint returns 404 or wrong URL

**Solution:**
- Verify `SEPAY_API_URL` is correct (check Sepay documentation)
- Common URLs:
  - `https://api.sepay.vn/v1`
  - `https://api.sepay.vn/api/v1`
  - `https://sandbox.sepay.vn/v1` (for testing)
- Check Sepay API documentation for correct base URL

### Issue 5: Payment created but QR code not displayed (Localhost)

**Solution:**
- ✅ **Check browser console** (F12) for API errors
- ✅ **Check API server logs** for Sepay API response
- ✅ **Verify API response structure** matches expected format:
  - Expected: `qr_code_url` or `qr_code` in response
  - Check `api/sepay/orders.js` line 69-70 for expected field names
- ✅ **Verify `SEPAY_API_URL`** is correct (check Sepay docs)
- ✅ **Check Sepay API credentials** are correct
- ✅ **Verify network request** in browser DevTools → Network tab
- ✅ **Check if Sepay returns QR code** in test/sandbox mode

## Sepay API Documentation Reference

**Important:** You should refer to Sepay.vn's official API documentation for:
- Exact API endpoint URLs
- Request/response formats
- Signature generation method
- Webhook payload structure
- Error codes and handling

**Common Documentation Locations:**
- Sepay Dashboard → **Developer** → **API Documentation**
- Sepay Dashboard → **Help** → **Integration Guide**
- Email Sepay support for API documentation

## Security Checklist

- ✅ API credentials stored in environment variables (not in code)
- ✅ Webhook signature verification enabled
- ✅ HTTPS used for all API calls and webhooks
- ✅ Webhook secret different from API secret (if possible)
- ✅ Environment variables not committed to Git
- ✅ Production and test credentials separated

## Next Steps

1. ✅ Complete Sepay account setup
2. ✅ Configure webhook endpoint
3. ✅ Set environment variables
4. ✅ Test payment creation
5. ✅ Test webhook delivery
6. ✅ Monitor webhook logs for issues
7. ✅ Go live with real payments

## Support

If you encounter issues:
1. Check Sepay dashboard for API status
2. Review webhook logs in `webhook_logs` table
3. Check Vercel function logs for errors
4. Contact Sepay.vn support for API-related issues
5. Review your code's error handling and logging

---

**Last Updated:** Based on current codebase integration
**Integration Status:** Ready for configuration and testing

