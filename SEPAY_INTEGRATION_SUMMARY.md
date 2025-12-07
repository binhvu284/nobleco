# Sepay.vn Integration - Key Changes Summary

## Important Discovery

After reviewing the [official Sepay.vn webhook documentation](https://docs.sepay.vn/tich-hop-webhooks.html), I discovered that:

**Sepay.vn is NOT a traditional payment gateway API.** It's a **bank transaction monitoring service**.

## What Changed

### ❌ Previous Understanding (INCORRECT)
- Sepay has a payment order creation API
- Sepay generates QR codes via API
- Sepay uses API Secret + Merchant ID + API Key
- Sepay uses HMAC-SHA256 signature verification

### ✅ Actual Sepay.vn (CORRECT)
- **No payment order API** - You create orders in your system
- **No QR code API** - You generate QR codes locally
- **API Key only** - Single API token for authentication
- **Webhook-based** - Sepay monitors bank accounts and sends webhooks
- **Payment code matching** - Sepay auto-detects payment codes from transaction content

## What You Need to Do

### 1. Register Sepay Account
- Production: https://my.sepay.vn
- Sandbox (for testing): https://my.dev.sepay.vn (contact Sepay to activate)

### 2. Create API Token
- Go to **"Cấu hình Công ty"** → **"API Access"**
- Click **"+ Thêm API"**
- Copy the API token → This is your `SEPAY_API_KEY`

### 3. Connect Bank Account
- Go to **"Ngân hàng"** → **"+ Kết nối tài khoản"**
- Choose: Bank API (ACB, MSB, VietinBank, TPBank) or SMS notifications
- Complete setup

### 4. Configure Payment Code Recognition
- Go to **"Công ty"** → **"Cấu hình chung"** → **"Cấu trúc mã thanh toán"**
- Set up pattern for Sepay to recognize payment codes
- Test with **"Giao dịch"** → **"Giả lập giao dịch"**

### 5. Set Up Webhook
- Go to **"WebHooks"** → **"+ Thêm webhooks"**
- Configure:
  - Event: **"Có tiền vào"** (Money In)
  - URL: `https://yourdomain.com/api/sepay/webhook`
  - Authentication: **API Key** (use your API token)
  - Content type: **application/json**

### 6. Generate QR Codes Locally
- Sepay doesn't provide QR code API
- Use `qrcode` library (already installed)
- Include: Bank account, amount, payment code (order number)

### 7. Update Environment Variables
```env
# Only this is needed:
SEPAY_API_KEY=your_api_token_from_sepay_dashboard
```

## Code Changes Made

### ✅ Updated Webhook Handler (`api/sepay/webhook.js`)
- Changed authentication to API Key: `Authorization: Apikey API_KEY`
- Updated payload parsing to match Sepay's actual format:
  ```json
  {
    "id": 92704,
    "code": "ORDER_NUMBER",
    "transferType": "in",
    "transferAmount": 2277000,
    "transactionDate": "2023-03-25 14:02:37",
    ...
  }
  ```
- Changed order matching to use `code` field (payment code/order number)
- Added duplicate detection using transaction `id`
- Updated response format: `{"success": true}` with HTTP 200

### ⚠️ Payment Creation (`api/orders/[id]/create-payment.js`)
- **This endpoint currently tries to call Sepay API to create payment orders**
- **Sepay doesn't have this API!**
- **You need to:**
  1. Remove the `createSepayOrder()` call
  2. Generate QR code locally instead
  3. Store payment code (order number) for webhook matching

### ⚠️ Payment Status Polling (`api/orders/[id]/payment-status.js`)
- **This endpoint tries to check payment status via Sepay API**
- **Sepay doesn't have this API!**
- **You can:**
  1. Remove this endpoint (not needed)
  2. Or keep it but it won't work with Sepay
  3. Payment status comes via webhooks only

## Next Steps

1. ✅ **Read `SEPAY_INTEGRATION_REVISED.md`** - Complete revised integration plan
2. ✅ **Update payment creation flow** - Generate QR codes locally
3. ✅ **Remove payment status polling** - Not needed with Sepay
4. ✅ **Test webhook** - Use sandbox account with ngrok
5. ✅ **Configure payment codes** - Set up in Sepay dashboard

## Files Updated

- ✅ `api/sepay/webhook.js` - Updated to match Sepay's webhook format
- ✅ `SEPAY_SETUP_GUIDE.md` - Updated with correct Sepay setup steps
- ✅ `SEPAY_INTEGRATION_REVISED.md` - Complete revised integration plan (NEW)

## Files That Need Updates

- ⚠️ `api/orders/[id]/create-payment.js` - Remove Sepay API call, generate QR locally
- ⚠️ `api/orders/[id]/payment-status.js` - Remove or update (Sepay doesn't have status API)
- ⚠️ `api/sepay/orders.js` - May not be needed (Sepay doesn't have payment order API)
- ⚠️ `src/user/pages/Payment.tsx` - Update to generate QR codes locally

## References

- [Sepay Webhook Integration](https://docs.sepay.vn/tich-hop-webhooks.html)
- [Create API Token](https://docs.sepay.vn/tao-api-token.html)
- [Add Bank Account](https://docs.sepay.vn/them-tai-khoan-ngan-hang.html)

