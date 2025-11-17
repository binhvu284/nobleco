# Sepay.vn Webhook Integration Plan - Auto Confirm Payment System

## Overview
This plan outlines the implementation of an automated payment confirmation system using Sepay.vn webhooks. The system will automatically confirm orders and transfer commissions when payments are verified through Sepay's webhook notifications.

## Expected Flow
1. Customer reaches payment page → QR code displayed
2. Customer scans QR code with banking app
3. Customer completes payment in banking app
4. Sepay sends webhook notification to our backend
5. Backend verifies webhook → Updates order status to "completed"
6. Backend calculates and transfers commissions to user wallet
7. Frontend polls/updates to show order completion

---

## 1. BACKEND LOGIC CHANGES

### 1.1 Create Sepay Webhook Endpoint
**File:** `api/sepay/webhook.js` (NEW)

**Responsibilities:**
- Receive POST requests from Sepay webhook
- Verify webhook signature/authentication
- Parse payment notification data
- Update order status to "completed"
- Trigger commission calculation and transfer
- Log webhook events for audit

**Key Functions:**
```javascript
// Verify webhook signature
function verifySepaySignature(payload, signature, secret)

// Process payment webhook
async function processPaymentWebhook(webhookData)

// Update order status
async function completeOrder(orderId, paymentData)

// Calculate and transfer commissions
async function processCommissions(orderId, userId)
```

### 1.2 Create Sepay API Integration
**File:** `api/sepay/orders.js` (NEW)

**Responsibilities:**
- Create payment order in Sepay
- Generate QR code for payment
- Retrieve payment status
- Handle Sepay API authentication

**Key Functions:**
```javascript
// Create payment order in Sepay
async function createSepayOrder(orderData)

// Get QR code from Sepay
async function getQRCode(orderId)

// Check payment status
async function checkPaymentStatus(sepayOrderId)
```

### 1.3 Update Order API
**File:** `api/orders.js` (MODIFY)

**Changes:**
- Add endpoint to create Sepay payment order
- Store `sepay_order_id` when creating payment
- Add endpoint to check payment status
- Remove manual "Confirm Order Complete" logic (will be handled by webhook)

**New Endpoints:**
- `POST /api/orders/:id/create-payment` - Create Sepay payment order
- `GET /api/orders/:id/payment-status` - Check payment status

### 1.4 Update Order Repository
**File:** `api/_repo/orders.js` (MODIFY)

**Changes:**
- Add `sepay_order_id` field to order creation/update
- Add `sepay_transaction_id` field for tracking
- Add `webhook_received_at` timestamp
- Update `normalizeOrder` to include Sepay fields

### 1.5 Commission Processing Logic
**File:** `api/_repo/commissions.js` (NEW)

**Responsibilities:**
- Calculate commissions based on user level
- Transfer commissions to user wallets (points)
- Handle multi-level commission distribution
- Create commission transaction records

**Key Functions:**
```javascript
// Calculate commissions for an order
async function calculateOrderCommissions(orderId, userId, orderAmount)

// Transfer commission to user wallet
async function transferCommission(userId, amount, orderId, commissionType)

// Process multi-level commissions
async function processMultiLevelCommissions(orderId, userId, orderAmount)
```

### 1.6 Webhook Event Logging
**File:** `api/_repo/webhook_logs.js` (NEW)

**Responsibilities:**
- Log all webhook events for debugging and audit
- Store webhook payload, response, and status
- Track failed webhook processing

---

## 2. FRONTEND UI CHANGES

### 2.1 Payment Page Refactoring
**File:** `src/user/pages/Payment.tsx` (MAJOR MODIFY)

**Changes:**
- **Remove payment method selection** (only bank transfer)
- **Remove cash payment form** completely
- **Remove "Confirm Order Complete" button**
- **Add QR code display** (from Sepay API)
- **Add payment status polling** to check if payment completed
- **Add loading state** while waiting for payment
- **Add success notification** when payment confirmed via webhook

**New UI Flow:**
1. Page loads → Automatically creates Sepay payment order
2. Display QR code (from Sepay)
3. Display bank account info (from Sepay or config)
4. Show "Waiting for payment..." status
5. Poll payment status every 5-10 seconds
6. Auto-redirect to success page when payment confirmed

**New State Variables:**
```typescript
const [sepayOrderId, setSepayOrderId] = useState<string | null>(null);
const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'failed'>('pending');
const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
```

**New Functions:**
```typescript
// Create Sepay payment order
async function createSepayPayment()

// Start polling payment status
function startPaymentPolling()

// Stop polling
function stopPaymentPolling()

// Handle payment success
function handlePaymentSuccess()
```

### 2.2 Remove Payment Method Selection UI
**Changes:**
- Remove entire payment method selection section
- Remove cash payment form section
- Simplify UI to show only QR code and bank info

### 2.3 Add Payment Status Component
**File:** `src/user/components/PaymentStatus.tsx` (NEW)

**Features:**
- Real-time payment status display
- Loading animation while waiting
- Success/error messages
- Auto-refresh status

### 2.4 Update Order Detail Modal
**File:** `src/user/components/OrderDetailModal.tsx` (MODIFY)

**Changes:**
- Remove payment method display (if not needed)
- Add Sepay transaction ID display (if available)
- Update payment status display logic

---

## 3. SEPAY SETUP

### 3.1 Sepay Account Configuration
**Steps:**
1. Register/Login to Sepay.vn account
2. Navigate to Developer/API section
3. Generate API credentials:
   - API Key
   - API Secret
   - Webhook Secret Key

### 3.2 Webhook Endpoint Configuration
**In Sepay Dashboard:**
1. Go to Webhooks section
2. Add new webhook endpoint:
   - URL: `https://yourdomain.com/api/sepay/webhook`
   - Events to subscribe:
     - `payment.success` - Payment completed successfully
     - `payment.failed` - Payment failed
     - `payment.pending` - Payment pending (optional)
3. Save webhook secret key securely

### 3.3 Sepay API Integration Setup
**Required Settings:**
- Merchant ID
- API Key
- API Secret
- Webhook Secret
- Bank account information for QR code generation
- Return URL (for redirect after payment)

### 3.4 Testing Configuration
**Test Environment:**
- Use Sepay sandbox/test environment
- Test webhook delivery
- Verify signature verification
- Test payment flow end-to-end

---

## 4. DATABASE CHANGES

### 4.1 Orders Table Modifications
**File:** `db/migrations/add_sepay_fields.sql` (NEW)

**SQL Changes:**
```sql
-- Add Sepay-related fields to orders table
ALTER TABLE public.orders 
ADD COLUMN sepay_order_id text UNIQUE,
ADD COLUMN sepay_transaction_id text,
ADD COLUMN webhook_received_at timestamp with time zone,
ADD COLUMN payment_confirmed_by text DEFAULT 'manual' CHECK (payment_confirmed_by IN ('manual', 'webhook', 'polling'));

-- Add index for faster lookups
CREATE INDEX idx_orders_sepay_order_id ON public.orders(sepay_order_id);
CREATE INDEX idx_orders_sepay_transaction_id ON public.orders(sepay_transaction_id);
```

### 4.2 Webhook Logs Table
**File:** `db/migrations/create_webhook_logs_table.sql` (NEW)

**SQL:**
```sql
CREATE TABLE public.webhook_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  webhook_type text NOT NULL, -- 'sepay_payment', etc.
  event_type text NOT NULL, -- 'payment.success', 'payment.failed', etc.
  order_id bigint REFERENCES public.orders(id),
  payload jsonb NOT NULL, -- Full webhook payload
  signature text, -- Webhook signature for verification
  processed boolean DEFAULT false,
  processing_error text,
  response_data jsonb, -- Response sent back to webhook sender
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone
);

CREATE INDEX idx_webhook_logs_order_id ON public.webhook_logs(order_id);
CREATE INDEX idx_webhook_logs_processed ON public.webhook_logs(processed);
CREATE INDEX idx_webhook_logs_created_at ON public.webhook_logs(created_at);
```

### 4.3 Commission Transactions Table
**File:** `db/migrations/create_commission_transactions_table.sql` (NEW)

**SQL:**
```sql
CREATE TABLE public.commission_transactions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES public.users(id),
  order_id bigint NOT NULL REFERENCES public.orders(id),
  commission_type text NOT NULL CHECK (commission_type IN ('self', 'level1', 'level2')),
  order_amount numeric NOT NULL CHECK (order_amount >= 0),
  commission_rate numeric NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 100),
  commission_amount numeric NOT NULL CHECK (commission_amount >= 0),
  points_before integer NOT NULL DEFAULT 0,
  points_after integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

CREATE INDEX idx_commission_transactions_user_id ON public.commission_transactions(user_id);
CREATE INDEX idx_commission_transactions_order_id ON public.commission_transactions(order_id);
CREATE INDEX idx_commission_transactions_status ON public.commission_transactions(status);
```

### 4.4 Update Users Table (if needed)
**Check if `points` field exists and is sufficient:**
- Verify `points` field type (should be integer or numeric)
- Ensure it can handle commission amounts
- Add constraint if needed: `CHECK (points >= 0)`

---

## 5. ENVIRONMENT VARIABLES

**File:** `.env` or Vercel Environment Variables

**New Variables:**
```env
# Sepay API Configuration
SEPAY_API_KEY=your_sepay_api_key
SEPAY_API_SECRET=your_sepay_api_secret
SEPAY_MERCHANT_ID=your_merchant_id
SEPAY_WEBHOOK_SECRET=your_webhook_secret_key
SEPAY_API_URL=https://api.sepay.vn/v1  # or sandbox URL for testing
SEPAY_WEBHOOK_URL=https://yourdomain.com/api/sepay/webhook
```

---

## 6. IMPLEMENTATION STEPS

### Phase 1: Database Setup
1. ✅ Create migration files for new tables/columns
2. ✅ Run migrations in Supabase
3. ✅ Verify schema changes

### Phase 2: Backend API Development
1. ✅ Create Sepay API integration module
2. ✅ Create webhook endpoint
3. ✅ Implement webhook signature verification
4. ✅ Create commission processing logic
5. ✅ Add webhook logging
6. ✅ Test webhook endpoint locally (use ngrok or similar)

### Phase 3: Sepay Configuration
1. ✅ Set up Sepay account
2. ✅ Configure webhook endpoint in Sepay dashboard
3. ✅ Test webhook delivery
4. ✅ Verify API credentials

### Phase 4: Frontend Updates
1. ✅ Refactor Payment.tsx to remove payment method selection
2. ✅ Integrate Sepay QR code display
3. ✅ Implement payment status polling
4. ✅ Add success/error handling
5. ✅ Update order detail modals

### Phase 5: Testing
1. ✅ Test payment flow end-to-end
2. ✅ Test webhook processing
3. ✅ Test commission calculation and transfer
4. ✅ Test error scenarios
5. ✅ Load testing

### Phase 6: Deployment
1. ✅ Deploy backend changes
2. ✅ Update environment variables
3. ✅ Configure production webhook URL
4. ✅ Monitor webhook logs
5. ✅ Gradual rollout

---

## 7. SECURITY CONSIDERATIONS

### 7.1 Webhook Security
- ✅ Always verify webhook signature
- ✅ Use HTTPS for webhook endpoint
- ✅ Implement rate limiting
- ✅ Validate webhook payload structure
- ✅ Check for duplicate webhook processing (idempotency)

### 7.2 API Security
- ✅ Store Sepay credentials securely (environment variables)
- ✅ Never expose API keys in frontend
- ✅ Use server-side API calls only
- ✅ Implement request timeout
- ✅ Add retry logic with exponential backoff

### 7.3 Commission Security
- ✅ Validate commission calculations server-side
- ✅ Prevent double commission processing
- ✅ Log all commission transactions
- ✅ Implement audit trail

---

## 8. ERROR HANDLING

### 8.1 Webhook Processing Errors
- Log all errors to `webhook_logs` table
- Send alert notifications for critical errors
- Implement retry mechanism for failed webhooks
- Manual review queue for failed payments

### 8.2 Payment Status Polling
- Handle network errors gracefully
- Implement exponential backoff for polling
- Show user-friendly error messages
- Allow manual refresh

### 8.3 Commission Processing Errors
- Rollback order status if commission fails
- Log commission errors
- Manual commission processing fallback
- Notification system for admins

---

## 9. MONITORING & LOGGING

### 9.1 Webhook Monitoring
- Track webhook delivery success rate
- Monitor webhook processing time
- Alert on webhook failures
- Dashboard for webhook statistics

### 9.2 Payment Monitoring
- Track payment completion rate
- Monitor average payment time
- Alert on payment failures
- Payment analytics dashboard

### 9.3 Commission Monitoring
- Track commission distribution
- Monitor commission calculation accuracy
- Alert on commission processing failures
- Commission reports

---

## 10. ROLLBACK PLAN

If issues occur:
1. **Immediate:** Disable webhook processing, revert to manual confirmation
2. **Short-term:** Fix issues in staging, test thoroughly
3. **Long-term:** Implement feature flags for gradual rollout

---

## 11. DOCUMENTATION NEEDED

1. ✅ Sepay API integration guide
2. ✅ Webhook setup instructions
3. ✅ Commission calculation documentation
4. ✅ Error handling procedures
5. ✅ Testing guide
6. ✅ Deployment checklist

---

## 12. ESTIMATED TIMELINE

- **Database Setup:** 1-2 hours
- **Backend Development:** 2-3 days
- **Sepay Configuration:** 1-2 hours
- **Frontend Updates:** 1-2 days
- **Testing:** 1-2 days
- **Deployment:** 0.5 day

**Total:** ~1 week

---

## NOTES

- Ensure backward compatibility with existing orders
- Consider migration path for orders in "processing" status
- Plan for Sepay API rate limits
- Consider implementing payment timeout (e.g., 30 minutes)
- Add admin interface to manually trigger commission processing if needed

