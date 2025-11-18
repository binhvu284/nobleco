import { getCoworkerPermissions, hasCoworkerPermission, addCoworkerPermission, removeCoworkerPermission, setCoworkerPermissions } from './_repo/coworkerPermissions.js';

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); }
      catch { resolve(null); }
    });
  });
}

async function getCurrentUser(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.replace('Bearer ', '');
  if (!token.startsWith('ok.')) return null;
  const userId = parseInt(token.replace('ok.', ''), 10);
  if (isNaN(userId)) return null;

  const { getSupabase } = await import('./_db.js');
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, role, status')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return data;
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const { coworkerId, pagePath, available } = req.query;

      // Get all available pages - no auth required for this
      if (available === 'true') {
        const availablePages = [
          { page_path: '/admin-dashboard', page_name: 'Dashboard', section: null },
          { page_path: '/admin-users', page_name: 'Users', section: 'users' },
          { page_path: '/admin-clients', page_name: 'Clients', section: 'users' },
          { page_path: '/admin-products', page_name: 'Products', section: 'products' },
          { page_path: '/admin-categories', page_name: 'Categories', section: 'products' },
          { page_path: '/admin-orders', page_name: 'Orders', section: 'products' },
          { page_path: '/admin-commission', page_name: 'Commission', section: 'payment' },
          { page_path: '/admin-request', page_name: 'Withdraw Request', section: 'payment' },
          { page_path: '/admin-discount', page_name: 'Discount Code', section: 'payment' }
        ];
        return res.status(200).json(availablePages);
      }

      // For other GET requests, require authentication
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (coworkerId && pagePath) {
        // Check if coworker has access to specific page
        // Allow coworkers to check their own permissions, or admins to check any coworker's permissions
        const requestedCoworkerId = parseInt(coworkerId);
        if (currentUser.role === 'coworker' && currentUser.id !== requestedCoworkerId) {
          return res.status(403).json({ error: 'Forbidden: You can only check your own permissions' });
        }
        if (currentUser.role !== 'admin' && currentUser.role !== 'coworker') {
          return res.status(403).json({ error: 'Forbidden' });
        }
        const hasPermission = await hasCoworkerPermission(requestedCoworkerId, pagePath);
        return res.status(200).json({ hasPermission });
      } else if (coworkerId) {
        // Get all permissions for a coworker
        // Allow coworkers to get their own permissions, or admins to get any coworker's permissions
        const requestedCoworkerId = parseInt(coworkerId);
        if (currentUser.role === 'coworker' && currentUser.id !== requestedCoworkerId) {
          return res.status(403).json({ error: 'Forbidden: You can only get your own permissions' });
        }
        if (currentUser.role !== 'admin' && currentUser.role !== 'coworker') {
          return res.status(403).json({ error: 'Forbidden' });
        }
        const permissions = await getCoworkerPermissions(requestedCoworkerId);
        return res.status(200).json(permissions);
      } else {
        return res.status(400).json({ error: 'coworkerId is required' });
      }
    }

    // For POST, PUT, DELETE methods, require authentication
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
      const currentUser = await getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Only admin can manage permissions
      if (currentUser.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Only admins can manage permissions' });
      }
    }

    if (req.method === 'POST') {
      const body = req.body || await readBody(req);
      const { coworkerId, pagePath, pageName } = body;

      if (!coworkerId || !pagePath || !pageName) {
        return res.status(400).json({ error: 'coworkerId, pagePath, and pageName are required' });
      }

      const permission = await addCoworkerPermission(parseInt(coworkerId), pagePath, pageName);
      return res.status(201).json(permission);
    }

    if (req.method === 'PUT') {
      const body = req.body || await readBody(req);
      const { coworkerId, permissions } = body;

      if (!coworkerId || !Array.isArray(permissions)) {
        return res.status(400).json({ error: 'coworkerId and permissions array are required' });
      }

      const result = await setCoworkerPermissions(parseInt(coworkerId), permissions);
      return res.status(200).json(result);
    }

    if (req.method === 'DELETE') {
      const { coworkerId, pagePath } = req.query;

      if (!coworkerId || !pagePath) {
        return res.status(400).json({ error: 'coworkerId and pagePath are required' });
      }

      await removeCoworkerPermission(parseInt(coworkerId), pagePath);
      return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', 'GET, POST, PUT, DELETE, OPTIONS');
    return res.status(405).end('Method Not Allowed');
  } catch (e) {
    console.error('Coworker permissions API error:', e);
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}

