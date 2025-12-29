import { getSupabase } from './_db.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getSupabase();

    // Get total users count
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .in('role', ['admin', 'coworker', 'user']);

    if (usersError) throw usersError;

    // Get total products count (jewelry only, not centerstones)
    const { count: totalProducts, error: productsError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (productsError) throw productsError;

    // Get total completed orders count
    const { count: totalOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    if (ordersError) throw ordersError;

    // Cache for 60 seconds
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');

    return res.status(200).json({
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        totalProducts: totalProducts || 0,
        totalOrders: totalOrders || 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Stats error:', error);
    return res.status(500).json({
      error: 'Failed to fetch stats',
      message: error.message,
      data: {
        totalUsers: 0,
        totalProducts: 0,
        totalOrders: 0
      }
    });
  }
}

