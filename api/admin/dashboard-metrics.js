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
 * Calculate percentage change
 */
function calculatePercentageChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Get System Section Metrics
 */
async function getSystemMetrics(supabase) {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();
  const startOfThisYear = new Date(now.getFullYear(), 0, 1).toISOString();
  const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1).toISOString();
  const endOfLastYear = new Date(now.getFullYear(), 0, 0).toISOString();

  // Total users by role
  const { data: usersByRole, error: roleError } = await supabase
    .from('users')
    .select('role, status')
    .in('role', ['admin', 'coworker', 'user']);

  if (roleError) throw roleError;

  const roleCounts = {
    admin: 0,
    coworker: 0,
    user: 0,
    active: 0,
    inactive: 0
  };

  usersByRole.forEach(u => {
    if (u.role === 'admin') roleCounts.admin++;
    if (u.role === 'coworker') roleCounts.coworker++;
    if (u.role === 'user') roleCounts.user++;
    if (u.status === 'active') roleCounts.active++;
    if (u.status === 'inactive') roleCounts.inactive++;
  });

  const totalUsers = roleCounts.admin + roleCounts.coworker + roleCounts.user;

  // New users this month vs last month
  const { count: newUsersThisMonth } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfThisMonth);

  const { count: newUsersLastMonth } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfLastMonth)
    .lt('created_at', startOfThisMonth);

  const newUsersMonthChange = calculatePercentageChange(
    newUsersThisMonth || 0,
    newUsersLastMonth || 0
  );

  // New users this year vs last year
  const { count: newUsersThisYear } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfThisYear);

  const { count: newUsersLastYear } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfLastYear)
    .lt('created_at', startOfThisYear);

  const newUsersYearChange = calculatePercentageChange(
    newUsersThisYear || 0,
    newUsersLastYear || 0
  );

  return {
    totalUsers,
    adminUsers: roleCounts.admin,
    coworkerUsers: roleCounts.coworker,
    associateUsers: roleCounts.user,
    activeUsers: roleCounts.active,
    inactiveUsers: roleCounts.inactive,
    newUsersThisMonth: newUsersThisMonth || 0,
    newUsersLastMonth: newUsersLastMonth || 0,
    newUsersMonthChange,
    newUsersMonthTrend: newUsersMonthChange > 0 ? 'up' : newUsersMonthChange < 0 ? 'down' : 'neutral',
    newUsersThisYear: newUsersThisYear || 0,
    newUsersLastYear: newUsersLastYear || 0,
    newUsersYearChange,
    newUsersYearTrend: newUsersYearChange > 0 ? 'up' : newUsersYearChange < 0 ? 'down' : 'neutral'
  };
}

/**
 * Get Business Analytics Section Metrics
 */
async function getBusinessMetrics(supabase) {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();
  const startOfThisYear = new Date(now.getFullYear(), 0, 1).toISOString();
  const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1).toISOString();
  const endOfLastYear = new Date(now.getFullYear(), 0, 0).toISOString();

  // Total revenue (sum of paid orders)
  const { data: paidOrders, error: ordersError } = await supabase
    .from('orders')
    .select('total_amount, created_at, payment_status, status, shipping_address')
    .eq('payment_status', 'paid');

  if (ordersError) throw ordersError;

  const totalRevenue = paidOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  const totalOrders = paidOrders.length;

  // Revenue this month vs last month
  const revenueThisMonth = paidOrders
    .filter(o => new Date(o.created_at) >= new Date(startOfThisMonth))
    .reduce((sum, order) => sum + (order.total_amount || 0), 0);

  const revenueLastMonth = paidOrders
    .filter(o => {
      const date = new Date(o.created_at);
      return date >= new Date(startOfLastMonth) && date < new Date(startOfThisMonth);
    })
    .reduce((sum, order) => sum + (order.total_amount || 0), 0);

  const revenueMonthChange = calculatePercentageChange(revenueThisMonth, revenueLastMonth);

  // Revenue this year vs last year
  const revenueThisYear = paidOrders
    .filter(o => new Date(o.created_at) >= new Date(startOfThisYear))
    .reduce((sum, order) => sum + (order.total_amount || 0), 0);

  const revenueLastYear = paidOrders
    .filter(o => {
      const date = new Date(o.created_at);
      return date >= new Date(startOfLastYear) && date < new Date(startOfThisYear);
    })
    .reduce((sum, order) => sum + (order.total_amount || 0), 0);

  const revenueYearChange = calculatePercentageChange(revenueThisYear, revenueLastYear);

  // Orders this month vs last month
  const ordersThisMonth = paidOrders.filter(o => new Date(o.created_at) >= new Date(startOfThisMonth)).length;
  const ordersLastMonth = paidOrders.filter(o => {
    const date = new Date(o.created_at);
    return date >= new Date(startOfLastMonth) && date < new Date(startOfThisMonth);
  }).length;

  const ordersMonthChange = calculatePercentageChange(ordersThisMonth, ordersLastMonth);

  // Average order value
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Orders by country
  // Extract country from shipping_address (might be full address or just country name)
  const countryMap = new Map();
  const countryList = [
    'Vietnam', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France',
    'Japan', 'China', 'India', 'South Korea', 'Singapore', 'Thailand', 'Malaysia', 'Indonesia',
    'Philippines', 'Other'
  ];
  
  paidOrders.forEach(order => {
    let country = 'Unknown';
    const address = order.shipping_address || '';
    
    // Try to find country name in address
    if (address) {
      const foundCountry = countryList.find(c => 
        address.toLowerCase().includes(c.toLowerCase())
      );
      if (foundCountry) {
        country = foundCountry;
      } else if (address.trim()) {
        // If address exists but no country found, use first word or full address
        const parts = address.split(',').map(p => p.trim());
        country = parts[parts.length - 1] || address.substring(0, 30); // Use last part or truncate
      }
    }
    
    if (!countryMap.has(country)) {
      countryMap.set(country, { count: 0, revenue: 0 });
    }
    const data = countryMap.get(country);
    data.count++;
    data.revenue += order.total_amount || 0;
  });

  const ordersByCountry = Array.from(countryMap.entries())
    .map(([country, data]) => ({
      country,
      orderCount: data.count,
      revenue: data.revenue,
      percentage: totalOrders > 0 ? Math.round((data.count / totalOrders) * 100) : 0
    }))
    .sort((a, b) => b.orderCount - a.orderCount);

  // Orders by status
  const statusMap = new Map();
  paidOrders.forEach(order => {
    const status = order.status || 'unknown';
    if (!statusMap.has(status)) {
      statusMap.set(status, 0);
    }
    statusMap.set(status, statusMap.get(status) + 1);
  });

  const ordersByStatus = Array.from(statusMap.entries())
    .map(([status, count]) => ({
      status,
      count,
      percentage: totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);

  // Revenue trend (last 30 days for chart)
  const revenueTrend = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();
    
    const dayRevenue = paidOrders
      .filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= new Date(startOfDay) && orderDate < new Date(endOfDay);
      })
      .reduce((sum, order) => sum + (order.total_amount || 0), 0);

    revenueTrend.push({
      date: date.toISOString().split('T')[0],
      revenue: dayRevenue
    });
  }

  return {
    totalRevenue,
    revenueThisMonth,
    revenueLastMonth,
    revenueMonthChange,
    revenueMonthTrend: revenueMonthChange > 0 ? 'up' : revenueMonthChange < 0 ? 'down' : 'neutral',
    revenueThisYear,
    revenueLastYear,
    revenueYearChange,
    revenueYearTrend: revenueYearChange > 0 ? 'up' : revenueYearChange < 0 ? 'down' : 'neutral',
    totalOrders,
    ordersThisMonth,
    ordersLastMonth,
    ordersMonthChange,
    ordersMonthTrend: ordersMonthChange > 0 ? 'up' : ordersMonthChange < 0 ? 'down' : 'neutral',
    averageOrderValue,
    ordersByCountry,
    ordersByStatus,
    revenueTrend
  };
}

/**
 * Get User Analytics Section Metrics
 */
async function getUserMetrics(supabase) {
  // User level distribution
  const { data: allUsers, error: usersError } = await supabase
    .from('users')
    .select('level, points, id, name, created_at');

  if (usersError) throw usersError;

  const levelMap = new Map();
  allUsers.forEach(user => {
    const level = user.level || 'guest';
    if (!levelMap.has(level)) {
      levelMap.set(level, 0);
    }
    levelMap.set(level, levelMap.get(level) + 1);
  });

  const totalUsers = allUsers.length;
  const levelDistribution = Array.from(levelMap.entries())
    .map(([level, count]) => ({
      level: level.charAt(0).toUpperCase() + level.slice(1),
      count,
      percentage: totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);

  // Top users by points
  const topUsersByPoints = allUsers
    .map(u => ({
      id: u.id,
      name: u.name || 'Unknown',
      points: u.points || 0,
      level: u.level || 'guest'
    }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 10);

  // Top users by order count
  const { data: ordersByUser, error: ordersError } = await supabase
    .from('orders')
    .select('created_by, total_amount')
    .eq('payment_status', 'paid');

  if (ordersError) throw ordersError;

  const userOrderMap = new Map();
  ordersByUser.forEach(order => {
    const userId = order.created_by;
    if (!userOrderMap.has(userId)) {
      userOrderMap.set(userId, { count: 0, value: 0 });
    }
    const data = userOrderMap.get(userId);
    data.count++;
    data.value += order.total_amount || 0;
  });

  const topUsersByOrders = Array.from(userOrderMap.entries())
    .map(([userId, data]) => {
      const user = allUsers.find(u => u.id === userId);
      return {
        id: userId,
        name: user?.name || 'Unknown',
        orderCount: data.count,
        totalValue: data.value,
        level: user?.level || 'guest'
      };
    })
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 10);

  const topUsersByValue = Array.from(userOrderMap.entries())
    .map(([userId, data]) => {
      const user = allUsers.find(u => u.id === userId);
      return {
        id: userId,
        name: user?.name || 'Unknown',
        orderCount: data.count,
        totalValue: data.value,
        level: user?.level || 'guest'
      };
    })
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 10);

  // User growth trend (monthly for last 12 months)
  const now = new Date();
  const growthTrend = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString();
    
    const monthUsers = allUsers.filter(u => {
      const userDate = new Date(u.created_at);
      return userDate >= new Date(startOfMonth) && userDate <= new Date(endOfMonth);
    }).length;

    growthTrend.push({
      month: date.toISOString().split('T')[0].substring(0, 7),
      count: monthUsers
    });
  }

  return {
    levelDistribution,
    topUsersByPoints,
    topUsersByOrders,
    topUsersByValue,
    growthTrend
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
    const { section } = req.query || {};

    // Load metrics based on section parameter
    const result = {};

    if (!section || section === 'system') {
      result.system = await getSystemMetrics(supabase);
    }

    if (!section || section === 'business') {
      result.business = await getBusinessMetrics(supabase);
    }

    if (!section || section === 'users') {
      result.users = await getUserMetrics(supabase);
    }

    // Cache for 60 seconds
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');

    return res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    return res.status(500).json({
      error: 'Failed to fetch dashboard metrics',
      message: error.message
    });
  }
}

