# Test Payment Guide

## Overview
This guide explains how to test payment functionality **without using real money**. This is essential for development and testing order flows, commissions, and payment processing.

## 🧪 Test Payment Feature

### What It Does
The test payment feature allows admins to simulate a completed payment for any order. It:
- ✅ Marks the order as `completed` and `paid`
- ✅ Processes commissions automatically
- ✅ Updates payment dates and status
- ✅ Works exactly like a real payment (without the money transfer)

### How to Use

#### Method 1: Admin Order Detail Modal (Recommended)
1. Go to **Admin Dashboard** → **Orders**
2. Click on any order that is **not yet completed/paid**
3. In the order detail modal, scroll to the **Order Summary** section
4. Click the **🧪 Test Payment** button
5. Confirm the action
6. The order will be marked as completed and commissions will be processed

#### Method 2: API Endpoint (For Advanced Users)
```bash
POST /api/orders/{orderId}/test-payment
Authorization: Bearer {admin_token}
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/orders/123/test-payment \
  -H "Authorization: Bearer ok.1" \
  -H "Content-Type: application/json"
```

### Requirements
- ✅ Must be logged in as **admin** (not regular user or coworker)
- ✅ Order must not already be completed/paid
- ✅ Order must exist in the database

### What Happens After Test Payment
1. Order status changes to `completed`
2. Payment status changes to `paid`
3. Payment date is set to current timestamp
4. Commissions are calculated and distributed
5. Order completion date is recorded

## 🔄 Testing Full Payment Flow

### Step-by-Step Testing Process

1. **Create a Test Order**
   - Go to Admin → Orders → Create New Order
   - Add products and set total amount
   - Save the order

2. **Test Payment Processing**
   - Open the order detail modal
   - Click "🧪 Test Payment"
   - Confirm the action
   - Verify order status changed to "Completed"

3. **Verify Commissions**
   - Check Admin → Commission page
   - Verify commissions were calculated correctly
   - Check user wallet balances

4. **Test Multiple Scenarios**
   - Test with different order amounts
   - Test with different commission structures
   - Test with orders that have discounts
   - Test with orders that have multiple products

## 🚫 Important Notes

### ⚠️ Test Payment vs Real Payment
- **Test Payment**: Simulates payment instantly, no real money involved
- **Real Payment**: Requires actual bank transfer via Sepay.vn webhook

### 🔒 Security
- Test payment is **admin-only** - regular users cannot use it
- Test payment endpoint requires authentication
- Test payment cannot be used on already-completed orders

### 📝 Best Practices
1. **Use Test Payment for Development**
   - Test order flows locally
   - Verify commission calculations
   - Test UI updates after payment

2. **Use Real Payment for Production Testing**
   - Test Sepay webhook integration
   - Verify QR code generation
   - Test payment confirmation flow

3. **Keep Test Data Separate**
   - Use test orders with clear naming (e.g., "TEST-ORDER-001")
   - Document which orders are test vs real
   - Clean up test orders periodically

## 🐛 Troubleshooting

### "Forbidden - Admin only" Error
- **Cause**: You're not logged in as admin
- **Solution**: Log in with an admin account

### "Order already completed" Error
- **Cause**: Order is already marked as paid/completed
- **Solution**: Create a new test order or reset the order status in database

### "Order not found" Error
- **Cause**: Order ID doesn't exist
- **Solution**: Verify the order ID is correct

### Commissions Not Processing
- **Cause**: Commission processing failed (check server logs)
- **Solution**: Check commission rates are configured correctly

## 📚 Related Documentation
- [Sepay Integration Guide](./SEPAY_SETUP_GUIDE.md) - Real payment setup
- [Payment Setup Simple](./PAYMENT_SETUP_SIMPLE.md) - Quick payment reference
- [Admin Orders Page](./src/admin/pages/AdminOrders.tsx) - Order management UI

## 💡 Tips

1. **Create Test Orders Quickly**
   - Use the admin order creation page
   - Set simple amounts (e.g., 100,000 VND)
   - Use test products

2. **Monitor Server Logs**
   - Watch for commission processing logs
   - Check for any errors during test payment

3. **Test Edge Cases**
   - Orders with 0 amount
   - Orders with maximum discounts
   - Orders with multiple commission levels

4. **Reset Test Orders**
   - If you need to test the same order multiple times, you can manually reset its status in the database:
   ```sql
   UPDATE orders 
   SET status = 'pending', 
       payment_status = 'pending', 
       payment_date = NULL,
       completed_at = NULL
   WHERE order_number = 'ORD-2025-XXXXXX';
   ```

---

**Remember**: Test payment is for development/testing only. Always use real payment flow for production verification!

