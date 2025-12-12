import { getOrdersByUser, getAllOrders, createOrder } from '../_repo/orders.js';
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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

    if (req.method === 'GET') {
      const userId = req.query.created_by;
      const isAdmin = currentUser.role === 'admin';

      if (isAdmin) {
        // Admin can see all orders
        const orders = await getAllOrders();
        return res.status(200).json(orders);
      } else if (userId) {
        // User can only see their own orders
        const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
        if (userIdNum !== currentUser.id) {
          return res.status(403).json({ error: 'Forbidden' });
        }
        const orders = await getOrdersByUser(userIdNum);
        return res.status(200).json(orders);
      } else {
        // Default to current user's orders
        const userId = typeof currentUser.id === 'string' ? parseInt(currentUser.id, 10) : currentUser.id;
        const orders = await getOrdersByUser(userId);
        return res.status(200).json(orders);
      }
    }

    if (req.method === 'POST') {
      // Parse body if needed (for serverless environments)
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          console.error('Failed to parse request body:', e);
          return res.status(400).json({ error: 'Invalid JSON in request body' });
        }
      }

      console.log('=== ORDER CREATION REQUEST ===');
      console.log('Request body type:', typeof body);
      console.log('Request body:', JSON.stringify(body, null, 2));
      console.log('Current user:', currentUser);

      const {
        client_id,
        cartItems,
        subtotal_amount,
        discount_amount,
        tax_amount,
        total_amount,
        notes,
        shipping_address,
        discount_code,
        discount_rate
      } = body;

      console.log('Extracted fields:', {
        client_id,
        cartItems_count: cartItems?.length,
        cartItems_type: Array.isArray(cartItems),
        created_by: currentUser.id,
        subtotal_amount,
        total_amount
      });

      // client_id is optional (can be set later), but cartItems is required
      if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        console.error('=== VALIDATION FAILED ===');
        console.error('Missing required fields:', { 
          client_id, 
          has_cartItems: !!cartItems, 
          cartItems_type: typeof cartItems,
          cartItems_length: cartItems?.length,
          cartItems_isArray: Array.isArray(cartItems)
        });
        return res.status(400).json({ error: 'Missing required fields: cartItems' });
      }

      const userId = typeof currentUser.id === 'string' ? parseInt(currentUser.id, 10) : currentUser.id;

      try {
        console.log('=== CALLING createOrder ===');
        const order = await createOrder({
          client_id: typeof client_id === 'string' ? parseInt(client_id, 10) : client_id,
          created_by: userId,
          cartItems,
          subtotal_amount: parseFloat(subtotal_amount || 0),
          discount_amount: parseFloat(discount_amount || 0),
          tax_amount: parseFloat(tax_amount || 0),
          total_amount: parseFloat(total_amount || 0),
          notes,
          shipping_address,
          discount_code,
          discount_rate
        });

        console.log('=== ORDER CREATED SUCCESSFULLY ===');
        console.log('Order ID:', order.id);
        console.log('Order:', JSON.stringify(order, null, 2));
        return res.status(201).json(order);
      } catch (createError) {
        console.error('=== ERROR CREATING ORDER ===');
        console.error('Error message:', createError.message);
        console.error('Error stack:', createError.stack);
        console.error('Error object:', createError);
        return res.status(500).json({ error: createError.message || 'Failed to create order' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Orders API error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

