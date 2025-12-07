# Sepay.vn Integration - Revised Plan

Based on the [official Sepay.vn webhook documentation](https://docs.sepay.vn/tich-hop-webhooks.html), this is the correct integration approach.

## Understanding Sepay.vn

**Important:** Sepay.vn is **NOT** a traditional payment gateway API. It's a **bank transaction monitoring service** that:
- Monitors your bank accounts for incoming/outgoing transactions
- Sends webhooks when transactions occur
- Auto-detects payment codes from transaction content
- Does **NOT** create payment orders or generate QR codes via API

## How Sepay.vn Works

1. **You configure bank accounts** in Sepay dashboard
2. **You configure payment code recognition** (so Sepay can match transactions to orders)
3. **You generate QR codes locally** (with payment code embedded)
4. **Customer transfers money** to your bank account
5. **Sepay monitors** the transaction and detects the payment code
6. **Sepay sends webhook** to your system with transaction details
7. **Your system matches** payment code to order and completes it

## Step-by-Step Setup

### Step 1: Register Sepay Account

1. **Production Account:**
   - Go to **https://sepay.vn** or **https://my.sepay.vn**
   - Register a merchant account
   - Complete verification (business docs, bank account info)

2. **Sandbox/Test Account (for localhost testing):**
   - Go to **https://my.dev.sepay.vn**
   - Register a test account
   - **Contact Sepay support** to activate your test account
   - Use this for localhost development and testing

### Step 2: Create API Token

1. **Login to Sepay Dashboard**
   - Production: https://my.sepay.vn
   - Sandbox: https://my.dev.sepay.vn

2. **Navigate to API Settings:**
   - Go to **"Cấu hình Công ty"** (Company Configuration)
   - Click **"API Access"**
   - Click **"+ Thêm API"** (Add API) button (top right)

3. **Create API Token:**
   - **Tên (Name):** Enter any name (e.g., "Nobleco Integration")
   - **Trạng thái (Status):** Select "Hoạt động" (Active)
   - Click **"Thêm"** (Add)

4. **Copy API Token:**
   - After creation, the API Token will appear in the list
   - **Copy this token** - you'll need it for `SEPAY_API_KEY`
   - **Note:** Currently, Sepay API tokens have full access (no permission restrictions)

### Step 3: Connect Bank Account

1. **Navigate to Bank Settings:**
   - Go to **"Ngân hàng"** (Bank) menu
   - Click **"+ Kết nối tài khoản"** (Connect Account)

2. **Choose Connection Method:**

   **Option A: Via Bank API (Recommended - Real-time)**
   - SePay partners with banks: ACB, MSB, VietinBank, TPBank
   - If you have account at these banks, connect via API for instant transaction notifications
   - See: https://sepay.vn/acb.html

   **Option B: Via SMS Balance Notifications**
   - For banks without API support
   - SePay receives SMS notifications from your bank
   - Processes transactions from SMS content

3. **Complete Bank Account Setup:**
   - Follow Sepay's instructions for your chosen method
   - Verify account is connected and active

### Step 4: Configure Payment Code Recognition

**This is CRITICAL** - Sepay needs to match transactions to your orders!

1. **Navigate to Payment Code Configuration:**
   - Go to **"Công ty"** (Company) → **"Cấu hình chung"** (General Configuration)
   - Find **"Cấu trúc mã thanh toán"** (Payment Code Structure)

2. **Configure Code Pattern:**
   - Set up pattern that Sepay will recognize in transaction content
   - Example: If your order numbers are "ORD-2024-123456", configure Sepay to recognize this pattern
   - Or use a simpler code format (e.g., just numbers: "123456")

3. **Test Code Recognition:**
   - Use Sepay's test transaction feature to verify code detection
   - Go to **"Giao dịch"** (Transactions) → **"Giả lập giao dịch"** (Simulate Transaction)

### Step 5: Configure Webhook

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
   - **Lọc theo tài khoản ảo:** (Optional) Filter by virtual accounts if using VA
   - **Bỏ qua nếu nội dung giao dịch không có Code thanh toán?:** 
     - Choose **"Có"** (Yes) if you only want transactions with payment codes
     - Choose **"Không"** (No) if you want all transactions
   
   **Thuộc tính WebHooks (Webhook Properties):**
   - **Gọi đến URL:** Your webhook endpoint URL
     - Production: `https://yourdomain.com/api/sepay/webhook`
     - Localhost (with ngrok): `https://your-ngrok-url.ngrok.io/api/sepay/webhook`
   - **Là WebHooks xác thực thanh toán?:** Choose **"Đúng"** (Yes) - this is for payment verification
   - **Gọi lại WebHooks khi?:** 
     - Select: **"HTTP Status Code không nằm trong phạm vi từ 200 đến 299"**
     - This enables automatic retry on failures
   
   **Cấu hình chứng thực WebHooks (Authentication Configuration):**
   - **Kiểu chứng thực (Authentication Type):** Choose one:
     - **API Key** (Recommended) - Simple and secure
     - **OAuth 2.0** - If you need OAuth
     - **Không cần chứng thực** (No Authentication) - Not recommended for production
   
   - **If using API Key:**
     - **Request Content type:** Choose **"application/json"**
     - Sepay will send header: `Authorization: Apikey YOUR_API_KEY`
     - Use the API Token you created in Step 2
   
   - **If using OAuth 2.0:**
     - Fill in OAuth 2.0 Access Token URL
     - Fill in OAuth 2.0 Client Id
     - Fill in OAuth 2.0 Client Secret

3. **Save Webhook:**
   - Click **"Thêm"** (Add) to save
   - Webhook will appear in your webhooks list

### Step 6: Generate QR Codes Locally

**Sepay.vn does NOT provide QR code generation API.** You need to generate QR codes yourself.

1. **Install QR Code Library** (if not already installed):
   ```bash
   npm install qrcode @types/qrcode
   ```

2. **Generate QR Code with Payment Information:**
   - Include: Bank account number, amount, payment code (order number)
   - Format: Vietnam bank transfer QR code format (VietQR standard)
   - Or simple text format with payment instructions

3. **Payment Code Format:**
   - Use your order number (e.g., "ORD-2024-123456")
   - Or generate a shorter code (e.g., "123456")
   - Must match the pattern configured in Sepay (Step 4)

### Step 7: Update Code to Handle Sepay Webhooks

The webhook payload structure from Sepay is:

```json
{
  "id": 92704,                              // Transaction ID on Sepay
  "gateway": "Vietcombank",                  // Bank name
  "transactionDate": "2023-03-25 14:02:37", // Transaction time
  "accountNumber": "0123499999",             // Bank account number
  "code": "ORD-2024-123456",                // Payment code (auto-detected)
  "content": "chuyen tien mua iphone",      // Transfer content
  "transferType": "in",                      // "in" = money in, "out" = money out
  "transferAmount": 2277000,                 // Transaction amount (VND)
  "accumulated": 19077000,                   // Account balance
  "subAccount": null,                        // Sub-account (if any)
  "referenceCode": "MBVCB.3278907687",       // SMS reference code
  "description": ""                          // Full SMS content
}
```

**Key Fields:**
- `code`: Payment code that matches your order number
- `transferType`: "in" for customer payments
- `transferAmount`: Amount in VND
- `id`: Unique transaction ID (use for duplicate detection)

### Step 8: Environment Variables

**For Localhost (.env file):**
```env
# Sepay API Configuration
SEPAY_API_KEY=your_api_token_from_step_2
# Note: Sepay uses API Key authentication, not API Secret
# The API Key is sent as: Authorization: Apikey YOUR_API_KEY

# Webhook URL (for localhost with ngrok)
NEXT_PUBLIC_BASE_URL=https://your-ngrok-url.ngrok.io

# Sepay API URL (if Sepay has any API endpoints)
# Check Sepay documentation for API endpoints
SEPAY_API_URL=https://api.sepay.vn  # or check docs

# Supabase (required)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**For Vercel (Production):**
Set the same variables in Vercel dashboard → Environment Variables

### Step 9: Update Webhook Handler

Your webhook handler needs to:

1. **Verify Authentication** (if using API Key):
   ```javascript
   const authHeader = req.headers.authorization;
   if (authHeader !== `Apikey ${process.env.SEPAY_API_KEY}`) {
     return res.status(401).json({ error: 'Unauthorized' });
   }
   ```

2. **Parse Webhook Payload:**
   ```javascript
   const {
     id,              // Transaction ID
     code,            // Payment code (order number)
     transferType,    // "in" or "out"
     transferAmount,  // Amount in VND
     transactionDate, // Transaction date
     accountNumber,   // Bank account
     content          // Transfer content
   } = req.body;
   ```

3. **Match Payment Code to Order:**
   ```javascript
   // Find order by payment code (order number)
   const order = await findOrderByOrderNumber(code);
   ```

4. **Verify Transaction:**
   - Check `transferType === "in"` (money in)
   - Check `transferAmount` matches order total
   - Check transaction not already processed (using `id`)

5. **Complete Order:**
   - Update order status to "completed"
   - Update payment status to "paid"
   - Process commissions

6. **Return Success Response:**
   ```javascript
   // Sepay requires: {"success": true} with HTTP 200 or 201
   return res.status(200).json({ success: true });
   ```

### Step 10: Testing

**Using Sandbox Account (my.dev.sepay.vn):**

1. **Start Local Development:**
   ```bash
   # Terminal 1: API Server
   npm run dev:api
   
   # Terminal 2: Frontend
   npm run dev
   
   # Terminal 3: ngrok
   ngrok http 3000
   ```

2. **Configure Webhook in Sandbox:**
   - Use ngrok URL: `https://your-ngrok-url.ngrok.io/api/sepay/webhook`
   - Set authentication to API Key
   - Use your sandbox API token

3. **Simulate Transaction:**
   - Go to **"Giao dịch"** (Transactions) → **"Giả lập giao dịch"** (Simulate Transaction)
   - Create test transaction with your payment code
   - Check webhook logs in Sepay dashboard
   - Verify order completion in your system

4. **Check Webhook Logs:**
   - In Sepay: **"Nhật ký"** (Logs) → **"Nhật ký webhooks"** (Webhook Logs)
   - In your system: Check `webhook_logs` table in Supabase

## Important Notes

1. **No Payment Order API:** Sepay doesn't create payment orders. You create orders in your system, generate QR codes locally, and wait for webhooks.

2. **Payment Code is Critical:** The payment code in the QR/transfer must match what Sepay expects. Configure this carefully in Step 4.

3. **Duplicate Prevention:** Use the `id` field from webhook to prevent processing the same transaction twice.

4. **Webhook Retry:** Sepay automatically retries failed webhooks (up to 7 times, max 5 hours). Your handler must be idempotent.

5. **Response Format:** Always return `{"success": true}` with HTTP 200/201 for successful processing.

6. **QR Code Generation:** You need to generate QR codes yourself. Use libraries like `qrcode` for Node.js or generate VietQR format QR codes.

## Next Steps

1. ✅ Register Sepay account (production + sandbox)
2. ✅ Create API token
3. ✅ Connect bank account
4. ✅ Configure payment code recognition
5. ✅ Set up webhook
6. ✅ Update webhook handler code
7. ✅ Generate QR codes locally
8. ✅ Test with sandbox account
9. ✅ Deploy to production

## References

- [Sepay Webhook Integration Guide](https://docs.sepay.vn/tich-hop-webhooks.html)
- [Create API Token](https://docs.sepay.vn/tao-api-token.html)
- [Add Bank Account](https://docs.sepay.vn/them-tai-khoan-ngan-hang.html)
- [Webhook Programming Guide](https://docs.sepay.vn/lap-trinh-webhooks.html)

