import { getOrderById, updateOrder } from '../../_repo/orders.js';
import { createSepayOrder } from '../../sepay/orders.js';
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

    const orderId = typeof req.query.id === 'string' ? parseInt(req.query.id, 10) : req.query.id;

    // Get order
    const order = await getOrderById(orderId);
    
    // Check permissions
    const isAdmin = currentUser.role === 'admin';
    const userId = typeof currentUser.id === 'string' ? parseInt(currentUser.id, 10) : currentUser.id;
    
    if (!isAdmin && order.created_by !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Check if payment already created
    if (order.sepay_order_id) {
      return res.status(400).json({ 
        error: 'Payment order already created',
        sepay_order_id: order.sepay_order_id
      });
    }

    // Get client information
    const supabase = getSupabase();
    let clientName = 'Customer';
    let clientPhone = '';
    let clientEmail = '';

    if (order.client_id) {
      const { data: client } = await supabase
        .from('clients')
        .select('name, phone, email')
        .eq('id', order.client_id)
        .single();
      
      if (client) {
        clientName = client.name || 'Customer';
        clientPhone = client.phone || '';
        clientEmail = client.email || '';
      }
    }

    // Create Sepay payment order
    const sepayData = await createSepayOrder({
      orderId: order.id,
      orderNumber: order.order_number,
      amount: order.total_amount,
      description: `Order ${order.order_number}`,
      customerName: clientName,
      customerPhone: clientPhone,
      customerEmail: clientEmail,
      returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/success?orderId=${order.id}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/cancel?orderId=${order.id}`
    });

    // Update order with Sepay order ID
    await updateOrder(orderId, {
      sepay_order_id: sepayData.sepay_order_id,
      payment_method: 'bank_transfer'
    });

    return res.status(200).json({
      success: true,
      sepay_order_id: sepayData.sepay_order_id,
      order_number: order.order_number, // Return order number for QR code generation
      amount: order.total_amount,
      qr_code_url: sepayData.qr_code_url,
      payment_url: sepayData.payment_url,
      virtual_account: sepayData.virtual_account,
      bank_account: sepayData.bank_account,
      expires_at: sepayData.expires_at
    });

  } catch (error) {
    console.error('Error creating Sepay payment:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

