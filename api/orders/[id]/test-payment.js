/**
 * Test Payment Endpoint
 * Simulates payment completion for testing (admin only)
 * This allows testing order flows without real money
 */

import { getOrderById, updateOrder } from '../../_repo/orders.js';
import { processOrderCommissions } from '../../_repo/commissions.js';
import { getSupabase } from '../../_db.js';

// Extract user from auth token
async function getCurrentUser(req) {
  const authHeader = req.headers.authorization || req.headers['x-auth-token'];
  if (!authHeader) return null;
  
  const token = authHeader.replace('Bearer ', '').trim();
  if (token.startsWith('ok.')) {
    const userId = parseInt(token.split('.')[1], 10);
    
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', userId)
        .single();
      
      if (error || !data) {
        return { id: userId, role: 'user' };
      }
      
      return { id: userId, role: data.role || 'user' };
    } catch (error) {
      return { id: userId, role: 'user' };
    }
  }
  
  return null;
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const currentUser = await getCurrentUser(req);
    
    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only admins can use test payment
    if (currentUser.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden - Admin only' });
    }

    const orderId = typeof req.query.id === 'string' ? parseInt(req.query.id, 10) : req.query.id;

    // Get order
    const order = await getOrderById(orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if already completed
    if (order.status === 'completed' && order.payment_status === 'paid') {
      return res.status(400).json({ 
        error: 'Order already completed',
        order_id: orderId
      });
    }

    // Simulate payment completion
    const updateData = {
      status: 'completed',
      payment_status: 'paid',
      payment_method: 'bank_transfer',
      payment_date: new Date().toISOString(),
      sepay_transaction_id: `TEST-${Date.now()}`,
      webhook_received_at: new Date().toISOString(),
      payment_confirmed_by: 'manual', // Must be one of: 'manual', 'webhook', 'polling'
      completed_at: new Date().toISOString()
    };

    await updateOrder(orderId, updateData);

    // Process commissions
    try {
      await processOrderCommissions(orderId, order.created_by, order.total_amount);
      console.log(`Test payment: Commissions processed for order ${orderId}`);
    } catch (commissionError) {
      console.error(`Test payment: Error processing commissions for order ${orderId}:`, commissionError);
      // Don't fail the test payment if commission processing fails
    }

    return res.status(200).json({
      success: true,
      message: 'Test payment completed successfully',
      order_id: orderId,
      order_number: order.order_number
    });

  } catch (error) {
    console.error('Error processing test payment:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

