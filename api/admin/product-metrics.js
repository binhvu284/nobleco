import { getSupabase } from '../_db.js';

/**
 * Extract user from auth token
 */
async function getCurrentUser(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization || req.headers['x-auth-token'];
  if (!authHeader) return null;
  
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token.startsWith('ok.')) return null;
  
  const userId = parseInt(token.replace('ok.', ''), 10);
  if (isNaN(userId)) return null;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, role, status')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return data;
}

/**
 * Check if user is admin or coworker
 */
function isAdminOrCoworker(user) {
  return user && (user.role === 'admin' || user.role === 'coworker');
}

/**
 * Get Product Sales Metrics
 */
async function getProductMetrics(supabase) {
  // Get all completed orders with their items
  const { data: completedOrders, error: ordersError } = await supabase
    .from('orders')
    .select('id, status')
    .eq('status', 'completed');

  if (ordersError) throw ordersError;

  const completedOrderIds = completedOrders.map(o => o.id);

  if (completedOrderIds.length === 0) {
    return {
      totalProductsWithOrders: 0,
      totalCompletedOrders: 0,
      bestSellers: [],
      productsWithOrders: []
    };
  }

  // Get order items for completed orders
  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select('order_id, product_id, product_name, quantity, line_total')
    .in('order_id', completedOrderIds);

  if (itemsError) throw itemsError;

  // Group by product_id to count distinct orders and quantities
  const productMap = new Map();

  orderItems.forEach(item => {
    const productId = item.product_id;
    if (!productId) return; // Skip if product_id is null (deleted product)

    if (!productMap.has(productId)) {
      productMap.set(productId, {
        product_id: productId,
        product_name: item.product_name || 'Unknown Product',
        order_ids: new Set(), // Track unique order IDs
        total_quantity: 0,
        total_revenue: 0
      });
    }

    const product = productMap.get(productId);
    product.order_ids.add(item.order_id); // Track unique orders
    product.total_quantity += item.quantity || 0;
    product.total_revenue += item.line_total || 0;
  });

  // Convert Set to count and add order_count
  productMap.forEach((product, productId) => {
    product.order_count = product.order_ids.size;
    delete product.order_ids; // Remove Set from final data
  });

  // Convert to array and sort by order_count (descending)
  const productsWithOrders = Array.from(productMap.values())
    .sort((a, b) => b.order_count - a.order_count);

  // Get product details for products with orders
  const productIds = productsWithOrders.map(p => p.product_id);
  
  if (productIds.length > 0) {
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, sku, price, status, images:product_images(url, is_featured, sort_order)')
      .in('id', productIds);

    if (!productsError && products) {
      // Merge product details with sales data
      productsWithOrders.forEach(product => {
        const productDetail = products.find(p => p.id === product.product_id);
        if (productDetail) {
          product.name = productDetail.name;
          product.sku = productDetail.sku;
          product.price = productDetail.price;
          product.status = productDetail.status;
          product.images = productDetail.images || [];
        }
      });
    }
  }

  // Identify best sellers (top 10 products by order count)
  const bestSellers = productsWithOrders.slice(0, 10).map(p => p.product_id);

  return {
    totalProductsWithOrders: productsWithOrders.length,
    totalCompletedOrders: completedOrderIds.length,
    bestSellers,
    productsWithOrders: productsWithOrders.slice(0, 50) // Limit to top 50 for table display
  };
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
    // Check authentication
    const user = await getCurrentUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is admin or coworker
    if (!isAdminOrCoworker(user)) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const supabase = getSupabase();
    const metrics = await getProductMetrics(supabase);

    // Cache for 60 seconds
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');

    return res.status(200).json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Product metrics error:', error);
    return res.status(500).json({
      error: 'Failed to fetch product metrics',
      message: error.message
    });
  }
}

