/**
 * Sepay API Integration
 * Handles creating payment orders and retrieving QR codes from Sepay
 */

const SEPAY_API_URL = process.env.SEPAY_API_URL || 'https://api.sepay.vn/v1';
const SEPAY_API_KEY = process.env.SEPAY_API_KEY;

// Create payment order for Sepay bank transfer
// Note: Sepay doesn't have a payment order API - we generate QR codes locally
// This function returns order info needed for QR code generation
export async function createSepayOrder(orderData) {
  if (!SEPAY_API_KEY) {
    throw new Error('Sepay API credentials not configured');
  }

  const {
    orderId,
    orderNumber,
    amount,
    description
  } = orderData;

  // Sepay doesn't create payment orders via API
  // We'll generate QR codes locally with the order number as payment code
  // The webhook will match transactions using the order number
  
  return {
    sepay_order_id: `order_${orderId}`, // Internal reference
    order_number: orderNumber, // This is the payment code Sepay will detect
    amount: Math.round(amount),
    qr_code_url: null, // Will be generated on frontend
    payment_url: null,
    virtual_account: null,
    bank_account: null,
    expires_at: null
  };
}

// Get payment status - Sepay doesn't have status API
// Payment status comes via webhooks only
export async function getSepayPaymentStatus(sepayOrderId) {
  // Sepay doesn't provide payment status API
  // Status is determined by webhook events
  // Return pending status - frontend will poll until webhook updates order
  return {
    status: 'pending',
    paid_at: null,
    transaction_id: null,
    amount: null
  };
}

// Note: Sepay doesn't use API signatures for payment orders
// Webhook authentication uses API Key in header: Authorization: Apikey API_KEY

// Verify webhook authentication from Sepay
// Sepay uses API Key authentication: Authorization: Apikey API_KEY
export async function verifySepayWebhookSignature(payload, signature) {
  // Webhook authentication is handled in webhook.js via Authorization header
  // This function is kept for compatibility but not used
  return true;
}

