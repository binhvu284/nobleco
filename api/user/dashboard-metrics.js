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
 * Calculate percentage change
 */
function calculatePercentageChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Get Orders Metrics for User
 */
async function getOrdersMetrics(supabase, userId) {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const startOfThisYear = new Date(now.getFullYear(), 0, 1).toISOString();
  const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1).toISOString();

  // Get all orders for this user
  const { data: allOrders, error: ordersError } = await supabase
    .from('orders')
    .select('total_amount, created_at, status')
    .eq('created_by', userId);

  if (ordersError) throw ordersError;

  const totalOrders = allOrders.length;
  const completedOrders = allOrders.filter(o => o.status === 'completed').length;

  // Orders this month
  const ordersThisMonth = allOrders.filter(o => {
    const date = new Date(o.created_at);
    return date >= new Date(startOfThisMonth);
  }).length;

  const ordersLastMonth = allOrders.filter(o => {
    const date = new Date(o.created_at);
    return date >= new Date(startOfLastMonth) && date < new Date(startOfThisMonth);
  }).length;

  const ordersMonthChange = calculatePercentageChange(ordersThisMonth, ordersLastMonth);

  // Orders this year
  const ordersThisYear = allOrders.filter(o => {
    const date = new Date(o.created_at);
    return date >= new Date(startOfThisYear);
  }).length;

  const ordersLastYear = allOrders.filter(o => {
    const date = new Date(o.created_at);
    return date >= new Date(startOfLastYear) && date < new Date(startOfThisYear);
  }).length;

  const ordersYearChange = calculatePercentageChange(ordersThisYear, ordersLastYear);

  // Orders by status
  const statusMap = new Map();
  statusMap.set('processing', 0);
  statusMap.set('completed', 0);
  statusMap.set('pending', 0);
  statusMap.set('cancelled', 0);

  allOrders.forEach(order => {
    const status = order.status || 'pending';
    statusMap.set(status, (statusMap.get(status) || 0) + 1);
  });

  const ordersByStatus = Array.from(statusMap.entries())
    .filter(([status, count]) => count > 0)
    .map(([status, count]) => ({
      status,
      count,
      percentage: totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0
    }));

  // Revenue trend (last 30 days)
  const revenueTrend = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();
    
    const dayRevenue = allOrders
      .filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= new Date(startOfDay) && orderDate < new Date(endOfDay) && o.status === 'completed';
      })
      .reduce((sum, order) => sum + (order.total_amount || 0), 0);

    revenueTrend.push({
      date: date.toISOString().split('T')[0],
      revenue: dayRevenue
    });
  }

  return {
    totalOrders,
    ordersThisMonth,
    ordersLastMonth,
    ordersMonthChange,
    ordersMonthTrend: ordersMonthChange > 0 ? 'up' : ordersMonthChange < 0 ? 'down' : 'neutral',
    ordersThisYear,
    ordersLastYear,
    ordersYearChange,
    ordersYearTrend: ordersYearChange > 0 ? 'up' : ordersYearChange < 0 ? 'down' : 'neutral',
    completedOrders,
    ordersByStatus,
    revenueTrend
  };
}

/**
 * Get Clients Metrics for User
 */
async function getClientsMetrics(supabase, userId) {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const startOfThisYear = new Date(now.getFullYear(), 0, 1).toISOString();
  const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1).toISOString();

  // Get all clients for this user
  const { data: allClients, error: clientsError } = await supabase
    .from('clients')
    .select('created_at')
    .eq('created_by', userId);

  if (clientsError) throw clientsError;

  const totalClients = allClients.length;

  // New clients this month
  const newClientsThisMonth = allClients.filter(c => {
    const date = new Date(c.created_at);
    return date >= new Date(startOfThisMonth);
  }).length;

  const newClientsLastMonth = allClients.filter(c => {
    const date = new Date(c.created_at);
    return date >= new Date(startOfLastMonth) && date < new Date(startOfThisMonth);
  }).length;

  const clientsMonthChange = calculatePercentageChange(newClientsThisMonth, newClientsLastMonth);

  // New clients this year
  const newClientsThisYear = allClients.filter(c => {
    const date = new Date(c.created_at);
    return date >= new Date(startOfThisYear);
  }).length;

  const newClientsLastYear = allClients.filter(c => {
    const date = new Date(c.created_at);
    return date >= new Date(startOfLastYear) && date < new Date(startOfThisYear);
  }).length;

  const clientsYearChange = calculatePercentageChange(newClientsThisYear, newClientsLastYear);

  // Client growth trend (last 12 months)
  const growthTrend = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1).toISOString();
    
    const monthClients = allClients.filter(c => {
      const clientDate = new Date(c.created_at);
      return clientDate >= new Date(startOfMonth) && clientDate < new Date(endOfMonth);
    }).length;

    growthTrend.push({
      month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      count: monthClients
    });
  }

  return {
    totalClients,
    newClientsThisMonth,
    newClientsLastMonth,
    clientsMonthChange,
    clientsMonthTrend: clientsMonthChange > 0 ? 'up' : clientsMonthChange < 0 ? 'down' : 'neutral',
    newClientsThisYear,
    newClientsLastYear,
    clientsYearChange,
    clientsYearTrend: clientsYearChange > 0 ? 'up' : clientsYearChange < 0 ? 'down' : 'neutral',
    growthTrend
  };
}

/**
 * Get Products Metrics for User
 */
async function getProductsMetrics(supabase, userId) {
  // Get all completed orders for this user
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, status')
    .eq('created_by', userId)
    .eq('status', 'completed');

  if (ordersError) throw ordersError;

  const orderIds = orders.map(o => o.id);
  if (orderIds.length === 0) {
    return {
      totalProductsSold: 0,
      bestSellers: [],
      productsWithOrders: []
    };
  }

  // Get order items for these orders
  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select('order_id, product_id, product_name, quantity, line_total')
    .in('order_id', orderIds);

  if (itemsError) throw itemsError;

  // Get product details
  const productIds = [...new Set(orderItems.map(item => item.product_id).filter(id => id !== null))];
  
  let products = [];
  if (productIds.length > 0) {
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, name, sku, price, status, images:product_images(url, is_featured, sort_order)')
      .in('id', productIds);

    if (productsError) {
      console.warn('Error fetching product details:', productsError);
      // Continue without product details
    } else {
      products = productsData || [];
    }
  }

  // Aggregate product sales
  const productMap = new Map();
  const orderIdSet = new Map(); // Track unique order IDs per product
  
  orderItems.forEach(item => {
    const productId = item.product_id;
    if (!productId) return; // Skip if product_id is null (deleted product)
    
    if (!productMap.has(productId)) {
      productMap.set(productId, {
        product_id: productId,
        order_ids: new Set(), // Track unique order IDs
        total_quantity: 0,
        total_revenue: 0
      });
    }
    const data = productMap.get(productId);
    data.order_ids.add(item.order_id); // Track unique orders
    data.total_quantity += item.quantity || 0;
    data.total_revenue += item.line_total || 0;
  });

  // Convert Set to count and add order_count
  productMap.forEach((product, productId) => {
    product.order_count = product.order_ids.size;
    delete product.order_ids; // Remove Set from final data
  });

  // Merge with product details
  const productsWithOrders = Array.from(productMap.values())
    .map(productData => {
      const product = products.find(p => p.id === productData.product_id);
      // Get product name from order_items if product not found (for deleted products)
      const orderItem = orderItems.find(item => item.product_id === productData.product_id);
      const productName = product?.name || orderItem?.product_name || 'Unknown Product';
      
      return {
        ...productData,
        product_name: productName,
        name: productName,
        sku: product?.sku || null,
        price: product?.price || 0,
        status: product?.status || 'active',
        images: product?.images || []
      };
    })
    .sort((a, b) => b.order_count - a.order_count);

  // Get best sellers (top 10 by order count)
  const bestSellers = productsWithOrders
    .slice(0, 10)
    .map(p => p.product_id);

  return {
    totalProductsSold: productsWithOrders.length,
    bestSellers,
    productsWithOrders: productsWithOrders.slice(0, 50) // Limit to top 50
  };
}

/**
 * Get Revenue Metrics for User
 */
async function getRevenueMetrics(supabase, userId) {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const startOfThisYear = new Date(now.getFullYear(), 0, 1).toISOString();
  const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1).toISOString();

  // Get all completed orders for this user
  const { data: allOrders, error: ordersError } = await supabase
    .from('orders')
    .select('total_amount, created_at, status')
    .eq('created_by', userId)
    .eq('status', 'completed');

  if (ordersError) throw ordersError;

  const totalRevenue = allOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

  // Revenue this month
  const revenueThisMonth = allOrders
    .filter(o => new Date(o.created_at) >= new Date(startOfThisMonth))
    .reduce((sum, order) => sum + (order.total_amount || 0), 0);

  const revenueLastMonth = allOrders
    .filter(o => {
      const date = new Date(o.created_at);
      return date >= new Date(startOfLastMonth) && date < new Date(startOfThisMonth);
    })
    .reduce((sum, order) => sum + (order.total_amount || 0), 0);

  const revenueMonthChange = calculatePercentageChange(revenueThisMonth, revenueLastMonth);

  // Revenue this year
  const revenueThisYear = allOrders
    .filter(o => new Date(o.created_at) >= new Date(startOfThisYear))
    .reduce((sum, order) => sum + (order.total_amount || 0), 0);

  const revenueLastYear = allOrders
    .filter(o => {
      const date = new Date(o.created_at);
      return date >= new Date(startOfLastYear) && date < new Date(startOfThisYear);
    })
    .reduce((sum, order) => sum + (order.total_amount || 0), 0);

  const revenueYearChange = calculatePercentageChange(revenueThisYear, revenueLastYear);

  return {
    totalRevenue,
    revenueThisMonth,
    revenueLastMonth,
    revenueMonthChange,
    revenueMonthTrend: revenueMonthChange > 0 ? 'up' : revenueMonthChange < 0 ? 'down' : 'neutral',
    revenueThisYear,
    revenueLastYear,
    revenueYearChange,
    revenueYearTrend: revenueYearChange > 0 ? 'up' : revenueYearChange < 0 ? 'down' : 'neutral'
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

    const supabase = getSupabase();
    const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;

    // Fetch all metrics
    const [orders, clients, products, revenue] = await Promise.all([
      getOrdersMetrics(supabase, userId),
      getClientsMetrics(supabase, userId),
      getProductsMetrics(supabase, userId),
      getRevenueMetrics(supabase, userId)
    ]);

    // Cache for 60 seconds
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');

    return res.status(200).json({
      success: true,
      data: {
        orders,
        clients,
        products,
        revenue
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('User dashboard metrics error:', error);
    return res.status(500).json({
      error: 'Failed to fetch dashboard metrics',
      message: error.message
    });
  }
}

