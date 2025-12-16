import { getSupabase } from '../_db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  // Get all orders (for counting processing + completed)
  const { data: allOrders, error: allOrdersError } = await supabase
    .from('orders')
    .select('total_amount, created_at, payment_status, status, shipping_address');

  if (allOrdersError) throw allOrdersError;

  // Total orders (both processing and completed)
  const totalOrders = allOrders.filter(o => o.status === 'processing' || o.status === 'completed').length;

  // Get completed orders only (for revenue calculations)
  const completedOrders = allOrders.filter(o => o.status === 'completed');

  // Total revenue (sum of completed orders only)
  const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

  // Revenue this month (completed orders only)
  const revenueThisMonth = completedOrders
    .filter(o => new Date(o.created_at) >= new Date(startOfThisMonth))
    .reduce((sum, order) => sum + (order.total_amount || 0), 0);

  const revenueLastMonth = completedOrders
    .filter(o => {
      const date = new Date(o.created_at);
      return date >= new Date(startOfLastMonth) && date < new Date(startOfThisMonth);
    })
    .reduce((sum, order) => sum + (order.total_amount || 0), 0);

  const revenueMonthChange = calculatePercentageChange(revenueThisMonth, revenueLastMonth);

  // Revenue this year (completed orders only)
  const revenueThisYear = completedOrders
    .filter(o => new Date(o.created_at) >= new Date(startOfThisYear))
    .reduce((sum, order) => sum + (order.total_amount || 0), 0);

  const revenueLastYear = completedOrders
    .filter(o => {
      const date = new Date(o.created_at);
      return date >= new Date(startOfLastYear) && date < new Date(startOfThisYear);
    })
    .reduce((sum, order) => sum + (order.total_amount || 0), 0);

  const revenueYearChange = calculatePercentageChange(revenueThisYear, revenueLastYear);

  // Orders this month (processing + completed)
  const ordersThisMonth = allOrders.filter(o => {
    const date = new Date(o.created_at);
    return date >= new Date(startOfThisMonth) && (o.status === 'processing' || o.status === 'completed');
  }).length;

  const ordersLastMonth = allOrders.filter(o => {
    const date = new Date(o.created_at);
    return date >= new Date(startOfLastMonth) && date < new Date(startOfThisMonth) && (o.status === 'processing' || o.status === 'completed');
  }).length;

  const ordersMonthChange = calculatePercentageChange(ordersThisMonth, ordersLastMonth);

  // Orders this year (processing + completed)
  const ordersThisYear = allOrders.filter(o => {
    const date = new Date(o.created_at);
    return date >= new Date(startOfThisYear) && (o.status === 'processing' || o.status === 'completed');
  }).length;

  const ordersLastYear = allOrders.filter(o => {
    const date = new Date(o.created_at);
    return date >= new Date(startOfLastYear) && date < new Date(startOfThisYear) && (o.status === 'processing' || o.status === 'completed');
  }).length;

  const ordersYearChange = calculatePercentageChange(ordersThisYear, ordersLastYear);

  // Average order value (from completed orders only)
  const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

  // Orders by country (from all orders: processing + completed)
  // Extract country from shipping_address (might be full address or just country name)
  const countryMap = new Map();
  const countryList = [
    'Vietnam', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France',
    'Japan', 'China', 'India', 'South Korea', 'Singapore', 'Thailand', 'Malaysia', 'Indonesia',
    'Philippines', 'Other'
  ];
  
  const ordersForCountry = allOrders.filter(o => o.status === 'processing' || o.status === 'completed');
  
  ordersForCountry.forEach(order => {
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
    // Only count revenue from completed orders
    if (order.status === 'completed') {
      data.revenue += order.total_amount || 0;
    }
  });

  const ordersByCountry = Array.from(countryMap.entries())
    .map(([country, data]) => ({
      country,
      orderCount: data.count,
      revenue: data.revenue,
      percentage: totalOrders > 0 ? parseFloat(((data.count / totalOrders) * 100).toFixed(2)) : 0,
      revenuePercentage: totalRevenue > 0 ? parseFloat(((data.revenue / totalRevenue) * 100).toFixed(2)) : 0
    }))
    .sort((a, b) => b.orderCount - a.orderCount);

  // Orders by status (only processing and completed)
  // Use allOrders directly, not ordersForCountry, to get accurate status counts
  const statusMap = new Map();
  // Initialize both statuses to ensure they appear even if count is 0
  statusMap.set('processing', 0);
  statusMap.set('completed', 0);
  
  allOrders.forEach(order => {
    const status = order.status || 'unknown';
    if (status === 'processing' || status === 'completed') {
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    }
  });

  // Always include both statuses, even if count is 0
  const ordersByStatus = [
    {
      status: 'completed',
      count: statusMap.get('completed') || 0,
      percentage: totalOrders > 0 ? Math.round(((statusMap.get('completed') || 0) / totalOrders) * 100) : 0
    },
    {
      status: 'processing',
      count: statusMap.get('processing') || 0,
      percentage: totalOrders > 0 ? Math.round(((statusMap.get('processing') || 0) / totalOrders) * 100) : 0
    }
  ];

  // Revenue trend (last 30 days for chart - completed orders only)
  const revenueTrend = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();
    
    const dayRevenue = completedOrders
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
    ordersThisYear,
    ordersLastYear,
    ordersYearChange,
    ordersYearTrend: ordersYearChange > 0 ? 'up' : ordersYearChange < 0 ? 'down' : 'neutral',
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
  // #region agent log
  const logPath = path.join(__dirname, '..', '..', '.cursor', 'debug.log');
  // #endregion
  
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
    .map(([level, count]) => {
      // Capitalize properly: "unit manager" -> "Unit Manager", "brand manager" -> "Brand Manager"
      const capitalized = level.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
      return {
        level: capitalized,
        count,
        percentage: totalUsers > 0 ? parseFloat(((count / totalUsers) * 100).toFixed(2)) : 0
      };
    })
    .sort((a, b) => {
      // Sort order: Guest, Member, Unit Manager, Brand Manager
      const order = { 'Guest': 0, 'Member': 1, 'Unit Manager': 2, 'Brand Manager': 3 };
      return (order[a.level] ?? 99) - (order[b.level] ?? 99);
    });
  
  // #region agent log
  const levelDistLogEntry = {
    location: 'dashboard-metrics.js:375',
    message: 'Level distribution calculated',
    data: { totalUsers, levelDistribution },
    timestamp: Date.now(),
    sessionId: 'debug-session',
    runId: 'run1',
    hypothesisId: 'C'
  };
  try {
    fs.appendFileSync(logPath, JSON.stringify(levelDistLogEntry) + '\n');
  } catch (e) {}
  // #endregion

  // Top users by points (exclude admin and coworker)
  // #region agent log
  const logUser = (u, msg) => {
    const logEntry = {
      location: 'dashboard-metrics.js:377',
      message: msg,
      data: { userId: u.id, name: u.name, level: u.level, levelLower: (u.level || 'guest').toLowerCase(), points: u.points },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'B'
    };
    try {
      fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
    } catch (e) {}
  };
  // #endregion
  const topUsersByPoints = allUsers
    .filter(u => {
      const level = (u.level || 'guest').toLowerCase();
      // #region agent log
      logUser(u, 'Filtering user for top users by points');
      // #endregion
      const shouldInclude = level !== 'admin' && level !== 'coworker';
      // #region agent log
      const filterResultLogEntry = {
        location: 'dashboard-metrics.js:385',
        message: 'Filter result',
        data: { userId: u.id, name: u.name, level, shouldInclude },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'B'
      };
      try {
        fs.appendFileSync(logPath, JSON.stringify(filterResultLogEntry) + '\n');
      } catch (e) {}
      // #endregion
      return shouldInclude;
    })
    .map(u => ({
      id: u.id,
      name: u.name || 'Unknown',
      points: u.points || 0,
      level: u.level || 'guest'
    }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 10);
  // #region agent log
  const topUsersLogEntry = {
    location: 'dashboard-metrics.js:400',
    message: 'Final topUsersByPoints result',
    data: { count: topUsersByPoints.length, users: topUsersByPoints.map(u => ({ id: u.id, name: u.name, level: u.level })) },
    timestamp: Date.now(),
    sessionId: 'debug-session',
    runId: 'run1',
    hypothesisId: 'B'
  };
  try {
    fs.appendFileSync(logPath, JSON.stringify(topUsersLogEntry) + '\n');
  } catch (e) {}
  // #endregion

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

  // #region agent log
  const finalLogEntry = {
    location: 'dashboard-metrics.js:520',
    message: 'getUserMetrics completed',
    data: { 
      levelDistributionCount: levelDistribution.length,
      topUsersByPointsCount: topUsersByPoints.length,
      topUsersByOrdersCount: topUsersByOrders.length,
      topUsersByValueCount: topUsersByValue.length,
      growthTrendCount: growthTrend.length
    },
    timestamp: Date.now(),
    sessionId: 'debug-session',
    runId: 'run1',
    hypothesisId: 'C'
  };
  try {
    fs.appendFileSync(logPath, JSON.stringify(finalLogEntry) + '\n');
  } catch (e) {}
  // #endregion

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
      try {
        result.users = await getUserMetrics(supabase);
        // #region agent log
        const getUserMetricsSuccessLogEntry = {
          location: 'dashboard-metrics.js:562',
          message: 'getUserMetrics success',
          data: { hasUsers: !!result.users },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'C'
        };
        try {
          fs.appendFileSync(path.join(__dirname, '..', '..', '.cursor', 'debug.log'), JSON.stringify(getUserMetricsSuccessLogEntry) + '\n');
        } catch (e) {}
        // #endregion
      } catch (error) {
        // #region agent log
        const getUserMetricsErrorLogEntry = {
          location: 'dashboard-metrics.js:572',
          message: 'getUserMetrics error',
          data: { error: error.message, stack: error.stack },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'C'
        };
        try {
          fs.appendFileSync(path.join(__dirname, '..', '..', '.cursor', 'debug.log'), JSON.stringify(getUserMetricsErrorLogEntry) + '\n');
        } catch (e) {}
        // #endregion
        throw error;
      }
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

