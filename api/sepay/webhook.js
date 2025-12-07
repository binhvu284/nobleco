/**
 * Sepay Webhook Endpoint
 * Receives payment notifications from Sepay and processes them
 */

import { getSupabase } from '../_db.js';
import { getOrderById, updateOrder } from '../_repo/orders.js';
import { processOrderCommissions } from '../_repo/commissions.js';
import { logWebhookEvent, updateWebhookLogStatus } from '../_repo/webhook_logs.js';
import { verifySepayWebhookSignature } from './orders.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Signature');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let webhookLogId = null;

  try {
    // Verify API Key authentication (Sepay uses: Authorization: Apikey API_KEY)
    const authHeader = req.headers.authorization || req.headers['authorization'];
    const SEPAY_API_KEY = process.env.SEPAY_API_KEY;
    
    if (SEPAY_API_KEY && authHeader !== `Apikey ${SEPAY_API_KEY}`) {
      // If API key is configured but doesn't match, reject
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Parse webhook payload
    let payload = req.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON payload' });
      }
    }

    // Sepay webhook payload structure:
    // {
    //   id: transaction_id,
    //   gateway: "BankName",
    //   transactionDate: "2023-03-25 14:02:37",
    //   accountNumber: "0123499999",
    //   code: "ORDER_NUMBER",  // Payment code (order number)
    //   content: "transfer content",
    //   transferType: "in" | "out",
    //   transferAmount: 2277000,
    //   accumulated: 19077000,
    //   subAccount: null,
    //   referenceCode: "MBVCB.3278907687",
    //   description: ""
    // }

    // Extract transaction information
    const transactionId = payload.id;
    const paymentCode = payload.code; // This is the order number/payment code
    const transferType = payload.transferType; // "in" or "out"
    const transferAmount = payload.transferAmount;
    const transactionDate = payload.transactionDate;
    const accountNumber = payload.accountNumber;
    const content = payload.content;

    // Log webhook event (before processing)
    const webhookLog = await logWebhookEvent({
      webhook_type: 'sepay_payment',
      event_type: transferType === 'in' ? 'payment.paid' : transferType === 'out' ? 'payment.out' : 'unknown',
      order_id: null, // Will be set after finding order by payment code
      payload: payload,
      signature: authHeader || null,
      processed: false
    });

    webhookLogId = webhookLog.id;

    // Only process "money in" transactions (customer payments)
    if (transferType !== 'in') {
      console.log(`Skipping transaction ${transactionId}: transferType is "${transferType}" (only "in" is processed)`);
      await updateWebhookLogStatus(webhookLogId, {
        processed: true,
        response_data: { status: 'skipped', reason: 'not_money_in' }
      });
      return res.status(200).json({ success: true, message: 'Transaction skipped (not money in)' });
    }

    // Payment code is required to match transaction to order
    if (!paymentCode) {
      console.warn(`Transaction ${transactionId} has no payment code, skipping`);
      await updateWebhookLogStatus(webhookLogId, {
        processed: false,
        processing_error: 'No payment code in transaction'
      });
      return res.status(200).json({ success: true, message: 'Transaction skipped (no payment code)' });
    }

    console.log('Sepay webhook received:', {
      transactionId,
      paymentCode,
      transferType,
      transferAmount,
      transactionDate
    });

    // Process payment (money in transaction)
    await handlePaymentSuccess({
      paymentCode,
      transactionId,
      transferAmount,
      transactionDate,
      accountNumber,
      content,
      payload,
      webhookLogId
    });

    // Mark webhook as processed
    await updateWebhookLogStatus(webhookLogId, {
      processed: true,
      response_data: { status: 'success' }
    });

    // Return success response to Sepay
    // Sepay requires: {"success": true} with HTTP 200 or 201
    return res.status(200).json({ 
      success: true
    });

  } catch (error) {
    console.error('Error processing Sepay webhook:', error);
    
    // Update webhook log with error
    if (webhookLogId) {
      try {
        await updateWebhookLogStatus(webhookLogId, {
          processed: false,
          processing_error: error.message
        });
      } catch (logError) {
        console.error('Error updating webhook log:', logError);
      }
    }

    // Return error response (but don't expose internal errors)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Webhook processing failed'
    });
  }
}

// Handle successful payment
async function handlePaymentSuccess({ paymentCode, transactionId, transferAmount, transactionDate, accountNumber, content, payload, webhookLogId }) {
  const supabase = getSupabase();

  try {
    // Find order by payment code (order number)
    // The payment code should match the order_number field
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, order_number, total_amount, status, payment_status, created_by')
      .eq('order_number', paymentCode)
      .limit(1);
    
    if (error) {
      throw new Error(`Database error finding order: ${error.message}`);
    }

    if (!orders || orders.length === 0) {
      console.warn(`Order not found for payment code: ${paymentCode}`);
      await updateWebhookLogStatus(webhookLogId, {
        processed: false,
        processing_error: `Order not found for payment code: ${paymentCode}`
      });
      return; // Don't fail webhook, just log
    }

    const order = orders[0];
    const orderId = order.id;

    // Check if transaction already processed (idempotency)
    // Use transaction ID to prevent duplicate processing
    const { data: existingLogs } = await supabase
      .from('webhook_logs')
      .select('id')
      .eq('payload->>id', transactionId.toString())
      .eq('processed', true)
      .limit(1);

    if (existingLogs && existingLogs.length > 0) {
      console.log(`Transaction ${transactionId} already processed, skipping`);
      await updateWebhookLogStatus(webhookLogId, {
        processed: true,
        response_data: { status: 'duplicate', orderId }
      });
      return;
    }

    // Check if order is already completed
    if (order.status === 'completed' && order.payment_status === 'paid') {
      console.log(`Order ${orderId} already completed, skipping webhook processing`);
      await updateWebhookLogStatus(webhookLogId, {
        processed: true,
        response_data: { status: 'already_completed', orderId }
      });
      return;
    }

    // Verify amount matches (optional - you may want to allow partial payments)
    const amountDifference = Math.abs(transferAmount - order.total_amount);
    if (amountDifference > 1000) { // Allow 1000 VND difference for rounding
      console.warn(`Amount mismatch for order ${orderId}: expected ${order.total_amount}, received ${transferAmount}`);
      // You can choose to reject or accept with warning
      // For now, we'll accept but log the warning
    }

    // Update order status
    const updateData = {
      status: 'completed',
      payment_status: 'paid',
      payment_method: 'bank_transfer',
      payment_date: transactionDate ? new Date(transactionDate).toISOString() : new Date().toISOString(),
      sepay_transaction_id: transactionId.toString(),
      webhook_received_at: new Date().toISOString(),
      payment_confirmed_by: 'webhook',
      completed_at: new Date().toISOString()
    };

    await updateOrder(orderId, updateData);

    // Update webhook log with order ID
    await updateWebhookLogStatus(webhookLogId, {
      order_id: orderId,
      processed: true,
      response_data: { status: 'success', orderId, transferAmount }
    });

    // Process commissions
    try {
      await processOrderCommissions(orderId, order.created_by, order.total_amount);
      console.log(`Commissions processed for order ${orderId}`);
    } catch (commissionError) {
      console.error(`Error processing commissions for order ${orderId}:`, commissionError);
      // Don't fail the webhook if commission processing fails
      // This can be handled manually later
    }

    console.log(`Order ${orderId} (${paymentCode}) completed successfully via webhook. Transaction: ${transactionId}, Amount: ${transferAmount} VND`);
  } catch (error) {
    console.error('Error handling payment success:', error);
    throw error;
  }
}

// Note: Sepay webhooks only send "money in" (transferType: "in") transactions for payments
// Failed payments are not sent via webhook - they're just transactions that never happened
// This function is kept for compatibility but may not be used with Sepay
async function handlePaymentFailed({ orderId, sepayOrderId, transactionId, payload, webhookLogId }) {
  // Sepay doesn't send "failed" payment webhooks
  // Payments either succeed (money in) or don't happen
  console.log('Payment failed handler called, but Sepay only sends successful payment webhooks');
}

