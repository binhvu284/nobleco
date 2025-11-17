import { getOrderById } from '../../_repo/orders.js';
import { getSepayPaymentStatus } from '../../sepay/orders.js';
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const currentUser = await getCurrentUser(req);
    
    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const orderId = typeof req.query.id === 'string' ? parseInt(req.query.id, 10) : req.query.id;

    // Get order
    const order = await getOrderById(orderId);
    
    // Check permissions
    const isAdmin = currentUser.role === 'admin';
    const userId = typeof currentUser.id === 'string' ? parseInt(currentUser.id, 10) : currentUser.id;
    
    if (!isAdmin && order.created_by !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Check if Sepay order exists
    if (!order.sepay_order_id) {
      return res.status(400).json({ 
        error: 'Sepay payment order not created yet',
        status: 'not_created'
      });
    }

    // Get payment status from Sepay
    try {
      const paymentStatus = await getSepayPaymentStatus(order.sepay_order_id);
      
      return res.status(200).json({
        order_id: order.id,
        sepay_order_id: order.sepay_order_id,
        status: paymentStatus.status, // 'pending', 'paid', 'failed', 'expired'
        paid_at: paymentStatus.paid_at,
        transaction_id: paymentStatus.transaction_id,
        amount: paymentStatus.amount,
        order_status: order.status,
        payment_status: order.payment_status
      });
    } catch (sepayError) {
      console.error('Error fetching Sepay payment status:', sepayError);
      // Return order status as fallback
      return res.status(200).json({
        order_id: order.id,
        sepay_order_id: order.sepay_order_id,
        status: 'unknown',
        order_status: order.status,
        payment_status: order.payment_status,
        error: 'Failed to fetch Sepay status'
      });
    }

  } catch (error) {
    console.error('Error checking payment status:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

