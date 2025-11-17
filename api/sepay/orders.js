/**
 * Sepay API Integration
 * Handles creating payment orders and retrieving QR codes from Sepay
 */

const SEPAY_API_URL = process.env.SEPAY_API_URL || 'https://api.sepay.vn/v1';
const SEPAY_API_KEY = process.env.SEPAY_API_KEY;
const SEPAY_API_SECRET = process.env.SEPAY_API_SECRET;
const SEPAY_MERCHANT_ID = process.env.SEPAY_MERCHANT_ID;

// Create payment order in Sepay
export async function createSepayOrder(orderData) {
  if (!SEPAY_API_KEY || !SEPAY_API_SECRET || !SEPAY_MERCHANT_ID) {
    throw new Error('Sepay API credentials not configured');
  }

  const {
    orderId,
    orderNumber,
    amount,
    description,
    customerName,
    customerPhone,
    customerEmail,
    returnUrl,
    cancelUrl
  } = orderData;

  try {
    // Prepare request payload according to Sepay API documentation
    // Note: Adjust this based on actual Sepay API requirements
    const payload = {
      merchant_id: SEPAY_MERCHANT_ID,
      order_id: orderId.toString(),
      order_number: orderNumber,
      amount: Math.round(amount), // Amount in VND (smallest currency unit)
      currency: 'VND',
      description: description || `Order ${orderNumber}`,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/success`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/cancel`,
      payment_method: 'bank_transfer' // Only bank transfer
    };

    // Generate signature (adjust based on Sepay's signature algorithm)
    const signature = await generateSepaySignature(payload);

    const response = await fetch(`${SEPAY_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SEPAY_API_KEY}`,
        'X-Merchant-Id': SEPAY_MERCHANT_ID,
        'X-Signature': signature
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Sepay API error: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    
    return {
      sepay_order_id: data.order_id || data.id,
      qr_code_url: data.qr_code_url || data.qr_code,
      payment_url: data.payment_url,
      virtual_account: data.virtual_account,
      bank_account: data.bank_account,
      expires_at: data.expires_at
    };
  } catch (error) {
    console.error('Error creating Sepay order:', error);
    throw error;
  }
}

// Get payment status from Sepay
export async function getSepayPaymentStatus(sepayOrderId) {
  if (!SEPAY_API_KEY || !SEPAY_API_SECRET || !SEPAY_MERCHANT_ID) {
    throw new Error('Sepay API credentials not configured');
  }

  try {
    const signature = await generateSepaySignature({ order_id: sepayOrderId });

    const response = await fetch(`${SEPAY_API_URL}/orders/${sepayOrderId}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SEPAY_API_KEY}`,
        'X-Merchant-Id': SEPAY_MERCHANT_ID,
        'X-Signature': signature
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Sepay API error: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    
    return {
      status: data.status, // 'pending', 'paid', 'failed', 'expired'
      paid_at: data.paid_at,
      transaction_id: data.transaction_id,
      amount: data.amount
    };
  } catch (error) {
    console.error('Error getting Sepay payment status:', error);
    throw error;
  }
}

// Generate Sepay signature for API requests
// Note: Adjust this based on Sepay's actual signature algorithm
async function generateSepaySignature(payload) {
  // Common signature methods:
  // 1. HMAC-SHA256 with secret key
  // 2. MD5 hash with secret key
  // 3. Simple concatenation and hash
  
  // Sort payload keys and create query string
  const sortedKeys = Object.keys(payload).sort();
  const queryString = sortedKeys
    .map(key => `${key}=${payload[key]}`)
    .join('&');
  
  // Create signature using Web Crypto API (works in serverless environments)
  const encoder = new TextEncoder();
  const keyData = encoder.encode(SEPAY_API_SECRET);
  const messageData = encoder.encode(queryString);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return signature;
}

// Verify webhook signature from Sepay
export async function verifySepayWebhookSignature(payload, signature) {
  if (!SEPAY_API_SECRET) {
    throw new Error('Sepay webhook secret not configured');
  }

  // Generate expected signature using Web Crypto API
  const encoder = new TextEncoder();
  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const keyData = encoder.encode(process.env.SEPAY_WEBHOOK_SECRET || SEPAY_API_SECRET);
  const messageData = encoder.encode(payloadString);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const expectedSignature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Compare signatures (simple comparison - in production, use constant-time comparison)
  return signature.toLowerCase() === expectedSignature.toLowerCase();
}

