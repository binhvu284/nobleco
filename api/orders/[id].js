import { getOrderById, updateOrder, updateOrderItems, deleteOrder, getOrderItems } from '../_repo/orders.js';
import { getSupabase } from '../_db.js';

// Extract user from auth token and fetch role
async function getCurrentUser(req) {
  const authHeader = req.headers.authorization || req.headers['x-auth-token'];
  if (!authHeader) return null;
  
  // Token format: "ok.{userId}" or just the token
  const token = authHeader.replace('Bearer ', '').trim();
  if (token.startsWith('ok.')) {
    const userId = parseInt(token.split('.')[1], 10);
    
    // Fetch user role from database
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', userId)
        .single();
      
      if (error || !data) {
        return { id: userId, role: 'user' }; // Default fallback
      }
      
      return { id: userId, role: data.role || 'user' };
    } catch (error) {
      return { id: userId, role: 'user' }; // Default fallback on error
    }
  }
  
  return null;
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const currentUser = await getCurrentUser(req);
    
    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const orderId = typeof req.query.id === 'string' ? parseInt(req.query.id, 10) : req.query.id;

    if (req.method === 'GET') {
      const order = await getOrderById(orderId);
      
      // Check permissions
      const isAdmin = currentUser.role === 'admin';
      const userId = typeof currentUser.id === 'string' ? parseInt(currentUser.id, 10) : currentUser.id;
      
      if (!isAdmin && order.created_by !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Get order items
      const items = await getOrderItems(orderId);
      
      return res.status(200).json({
        ...order,
        items
      });
    }

    if (req.method === 'PUT') {
      const order = await getOrderById(orderId);
      
      // Check permissions
      const isAdmin = currentUser.role === 'admin';
      const userId = typeof currentUser.id === 'string' ? parseInt(currentUser.id, 10) : currentUser.id;
      
      if (!isAdmin && order.created_by !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Parse body if needed (for serverless environments)
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          return res.status(400).json({ error: 'Invalid JSON in request body' });
        }
      }

      const {
        status,
        payment_method,
        payment_status,
        payment_date,
        notes,
        shipping_address,
        client_id,
        subtotal_amount,
        discount_amount,
        tax_amount,
        total_amount,
        discount_code,
        discount_rate,
        cartItems
      } = body;

      // Update order items if cartItems is provided
      if (cartItems && Array.isArray(cartItems) && cartItems.length > 0) {
        try {
          await updateOrderItems(orderId, cartItems);
        } catch (error) {
          console.error('Error updating order items:', error);
          return res.status(500).json({ error: `Failed to update order items: ${error.message}` });
        }
      }

      const updates = {};
      if (status !== undefined) updates.status = status;
      if (payment_method !== undefined) updates.payment_method = payment_method;
      if (payment_status !== undefined) updates.payment_status = payment_status;
      if (payment_date !== undefined) updates.payment_date = payment_date;
      if (notes !== undefined) updates.notes = notes;
      if (shipping_address !== undefined) updates.shipping_address = shipping_address;
      if (client_id !== undefined) updates.client_id = client_id;
      if (subtotal_amount !== undefined) updates.subtotal_amount = parseFloat(subtotal_amount);
      if (discount_amount !== undefined) updates.discount_amount = parseFloat(discount_amount);
      if (tax_amount !== undefined) updates.tax_amount = parseFloat(tax_amount);
      if (total_amount !== undefined) updates.total_amount = parseFloat(total_amount);
      if (discount_code !== undefined) updates.discount_code = discount_code || null;
      if (discount_rate !== undefined) updates.discount_rate = discount_rate ? parseFloat(discount_rate) : null;

      const updatedOrder = await updateOrder(orderId, updates);
      
      // Get updated order items to return complete order data
      const items = await getOrderItems(orderId);
      
      return res.status(200).json({
        ...updatedOrder,
        items
      });
    }

    if (req.method === 'DELETE') {
      const order = await getOrderById(orderId);
      
      // Check permissions
      const isAdmin = currentUser.role === 'admin';
      const userId = typeof currentUser.id === 'string' ? parseInt(currentUser.id, 10) : currentUser.id;
      
      if (!isAdmin && order.created_by !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Only allow deleting processing orders
      if (order.status !== 'processing') {
        return res.status(400).json({ error: 'Can only delete orders with processing status' });
      }

      await deleteOrder(orderId);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Order API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

