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
    // Get webhook signature from headers
    const signature = req.headers['x-signature'] || req.headers['x-sepay-signature'];
    
    // Parse webhook payload
    let payload = req.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON payload' });
      }
    }

    // Log webhook event (before processing)
    const webhookLog = await logWebhookEvent({
      webhook_type: 'sepay_payment',
      event_type: payload.event_type || payload.type || 'unknown',
      order_id: payload.order_id ? parseInt(payload.order_id, 10) : null,
      payload: payload,
      signature: signature || null,
      processed: false
    });

    webhookLogId = webhookLog.id;

    // Verify webhook signature
    if (signature) {
      try {
        const isValid = await verifySepayWebhookSignature(JSON.stringify(payload), signature);
        if (!isValid) {
          await updateWebhookLogStatus(webhookLogId, {
            processed: false,
            processing_error: 'Invalid webhook signature'
          });
          return res.status(401).json({ error: 'Invalid signature' });
        }
      } catch (sigError) {
        console.error('Error verifying webhook signature:', sigError);
        await updateWebhookLogStatus(webhookLogId, {
          processed: false,
          processing_error: `Signature verification error: ${sigError.message}`
        });
        return res.status(401).json({ error: 'Signature verification failed' });
      }
    }

    // Extract event type and order information
    const eventType = payload.event_type || payload.type || 'unknown';
    const sepayOrderId = payload.order_id || payload.sepay_order_id;
    const transactionId = payload.transaction_id || payload.id;
    const orderId = payload.metadata?.order_id || payload.order_id;

    console.log('Sepay webhook received:', {
      eventType,
      sepayOrderId,
      transactionId,
      orderId
    });

    // Handle different event types
    if (eventType === 'payment.success' || eventType === 'payment.paid') {
      await handlePaymentSuccess({
        orderId: orderId ? parseInt(orderId, 10) : null,
        sepayOrderId,
        transactionId,
        payload,
        webhookLogId
      });
    } else if (eventType === 'payment.failed' || eventType === 'payment.failure') {
      await handlePaymentFailed({
        orderId: orderId ? parseInt(orderId, 10) : null,
        sepayOrderId,
        transactionId,
        payload,
        webhookLogId
      });
    } else {
      console.log(`Unhandled webhook event type: ${eventType}`);
    }

    // Mark webhook as processed
    await updateWebhookLogStatus(webhookLogId, {
      processed: true,
      response_data: { status: 'success' }
    });

    // Return success response to Sepay
    return res.status(200).json({ 
      success: true,
      message: 'Webhook processed successfully'
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
async function handlePaymentSuccess({ orderId, sepayOrderId, transactionId, payload, webhookLogId }) {
  const supabase = getSupabase();

  try {
    // Find order by sepay_order_id if orderId not provided
    let order = null;
    if (orderId) {
      order = await getOrderById(orderId);
    } else if (sepayOrderId) {
      // Find order by sepay_order_id
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id')
        .eq('sepay_order_id', sepayOrderId)
        .limit(1);
      
      if (!error && orders && orders.length > 0) {
        order = await getOrderById(orders[0].id);
        orderId = orders[0].id;
      }
    }

    if (!order) {
      throw new Error(`Order not found for sepay_order_id: ${sepayOrderId}`);
    }

    // Check if order is already completed (idempotency)
    if (order.status === 'completed' && order.payment_status === 'paid') {
      console.log(`Order ${orderId} already completed, skipping webhook processing`);
      return;
    }

    // Update order status
    const updateData = {
      status: 'completed',
      payment_status: 'paid',
      payment_method: 'bank_transfer',
      payment_date: payload.paid_at || new Date().toISOString(),
      sepay_transaction_id: transactionId,
      webhook_received_at: new Date().toISOString(),
      payment_confirmed_by: 'webhook',
      completed_at: new Date().toISOString()
    };

    await updateOrder(orderId, updateData);

    // Process commissions
    try {
      await processOrderCommissions(orderId, order.created_by, order.total_amount);
      console.log(`Commissions processed for order ${orderId}`);
    } catch (commissionError) {
      console.error(`Error processing commissions for order ${orderId}:`, commissionError);
      // Don't fail the webhook if commission processing fails
      // This can be handled manually later
    }

    console.log(`Order ${orderId} completed successfully via webhook`);
  } catch (error) {
    console.error('Error handling payment success:', error);
    throw error;
  }
}

// Handle failed payment
async function handlePaymentFailed({ orderId, sepayOrderId, transactionId, payload, webhookLogId }) {
  const supabase = getSupabase();

  try {
    // Find order
    let order = null;
    if (orderId) {
      order = await getOrderById(orderId);
    } else if (sepayOrderId) {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id')
        .eq('sepay_order_id', sepayOrderId)
        .limit(1);
      
      if (!error && orders && orders.length > 0) {
        order = await getOrderById(orders[0].id);
        orderId = orders[0].id;
      }
    }

    if (!order) {
      console.warn(`Order not found for failed payment: sepay_order_id=${sepayOrderId}`);
      return;
    }

    // Update order payment status to failed
    await updateOrder(orderId, {
      payment_status: 'failed',
      webhook_received_at: new Date().toISOString()
    });

    console.log(`Order ${orderId} payment marked as failed`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
    throw error;
  }
}

