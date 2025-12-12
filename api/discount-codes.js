import { getSupabase } from './_db.js';
import {
  getAllDiscountCodes,
  getDiscountCodeById,
  getDiscountCodeByCode,
  createDiscountCode,
  updateDiscountCode,
  deleteDiscountCode,
  toggleDiscountCodeStatus,
  validateDiscountCode,
  incrementDiscountCodeUsage
} from './_repo/discountCodes.js';

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
 * Read request body
 */
function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Check authentication (admin only for most operations)
    const currentUser = await getCurrentUser(req);
    
    // GET requests can be public (for validation), but admin operations require auth
    if (req.method !== 'GET' && !currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check admin role for write operations (except increment which is allowed for authenticated users)
    if (['PUT', 'PATCH', 'DELETE'].includes(req.method) && currentUser?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    
    // POST operations: increment is allowed for authenticated users, create requires admin
    if (req.method === 'POST' && currentUser?.role !== 'admin') {
      const body = req.body || await readBody(req);
      const { action } = body;
      // Allow increment for authenticated users
      if (action !== 'increment') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
      }
    }

    const { id, code, action } = req.query;

    // GET - Get all discount codes, a specific one, or validate a code
    if (req.method === 'GET') {
      try {
        // Validate discount code endpoint
        if (action === 'validate' && code) {
          const validation = await validateDiscountCode(code.toUpperCase().trim());
          if (!validation.valid) {
            return res.status(400).json({ 
              valid: false, 
              error: validation.error 
            });
          }
          return res.status(200).json({
            valid: true,
            discount: {
              code: validation.discount.code,
              discount_rate: validation.discount.discount_rate,
              description: validation.discount.description
            }
          });
        }
        
        if (id) {
          const discount = await getDiscountCodeById(parseInt(id));
          if (!discount) {
            return res.status(404).json({ error: 'Discount code not found' });
          }
          return res.status(200).json(discount);
        } else {
          const discounts = await getAllDiscountCodes();
          return res.status(200).json(discounts);
        }
      } catch (error) {
        console.error('Error in GET /api/discount-codes:', error);
        return res.status(500).json({ 
          error: error.message || 'Failed to fetch discount codes',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
    }

    // POST - Create new discount code or increment usage
    if (req.method === 'POST') {
      const body = req.body || await readBody(req);
      const { action, code: bodyCode } = body;
      
      // Handle increment action (allowed for authenticated users)
      if (action === 'increment' && bodyCode) {
        if (!currentUser) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        try {
          const updatedDiscount = await incrementDiscountCodeUsage(bodyCode.toUpperCase().trim());
          return res.status(200).json({
            success: true,
            discount: updatedDiscount
          });
        } catch (error) {
          return res.status(400).json({ error: error.message });
        }
      }
      
      // Handle create discount code (admin only)
      const { code, discount_rate, description, max_usage, valid_from, valid_until, status } = body;
      if (!code || discount_rate === undefined) {
        return res.status(400).json({ error: 'Code and discount_rate are required' });
      }

      try {
        const discount = await createDiscountCode({
          code,
          discount_rate,
          description,
          max_usage,
          valid_from,
          valid_until,
          status
        });
        return res.status(201).json(discount);
      } catch (error) {
        if (error.message.includes('already exists')) {
          return res.status(409).json({ error: error.message });
        }
        return res.status(400).json({ error: error.message });
      }
    }

    // PUT - Update discount code
    if (req.method === 'PUT') {
      if (!id) {
        return res.status(400).json({ error: 'Discount code ID is required' });
      }

      const body = req.body || await readBody(req);
      const { code, discount_rate, description, max_usage, valid_from, valid_until, status } = body;

      try {
        const discount = await updateDiscountCode(parseInt(id), {
          code,
          discount_rate,
          description,
          max_usage,
          valid_from,
          valid_until,
          status
        });
        return res.status(200).json(discount);
      } catch (error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({ error: error.message });
        }
        if (error.message.includes('already exists')) {
          return res.status(409).json({ error: error.message });
        }
        return res.status(400).json({ error: error.message });
      }
    }

    // PATCH - Toggle status or partial update
    if (req.method === 'PATCH') {
      if (!id) {
        return res.status(400).json({ error: 'Discount code ID is required' });
      }

      const body = req.body || await readBody(req);
      const { action, ...updateData } = body;

      // Handle toggle status action
      if (action === 'toggle-status') {
        try {
          const discount = await toggleDiscountCodeStatus(parseInt(id));
          return res.status(200).json(discount);
        } catch (error) {
          if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
          }
          return res.status(400).json({ error: error.message });
        }
      }

      // Handle partial update
      try {
        const discount = await updateDiscountCode(parseInt(id), updateData);
        return res.status(200).json(discount);
      } catch (error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({ error: error.message });
        }
        if (error.message.includes('already exists')) {
          return res.status(409).json({ error: error.message });
        }
        return res.status(400).json({ error: error.message });
      }
    }

    // DELETE - Delete discount code
    if (req.method === 'DELETE') {
      if (!id) {
        return res.status(400).json({ error: 'Discount code ID is required' });
      }

      try {
        await deleteDiscountCode(parseInt(id));
        return res.status(200).json({ success: true, message: 'Discount code deleted successfully' });
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Discount codes API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

