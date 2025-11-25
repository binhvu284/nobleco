import { getSupabase } from './_db.js';
import { 
  getPendingWithdrawRequests, 
  createWithdrawRequest,
  getWithdrawRequestsByUserId,
  deleteWithdrawRequest,
  getWithdrawRequestById
} from './_repo/withdrawRequests.js';

/**
 * Extract user from auth token
 */
async function getCurrentUser(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization || req.headers['x-auth-token'];
  if (!authHeader) return null;
  
  // Token format: "ok.{userId}" or "Bearer ok.{userId}"
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

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check authentication
  const currentUser = await getCurrentUser(req);
  if (!currentUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // GET - Get pending withdraw requests for current user
    if (req.method === 'GET') {
      const { userId } = req.query;
      
      // Users can only see their own requests, admins can see any user's requests
      const targetUserId = userId && (currentUser.role === 'admin' || currentUser.role === 'coworker') 
        ? userId 
        : currentUser.id;

      const requests = await getPendingWithdrawRequests(targetUserId);
      return res.status(200).json(requests);
    }

    // POST - Create a new withdraw request
    if (req.method === 'POST') {
      const { amount, point, exchange_rate, bank_name, bank_owner_name, bank_number } = req.body;

      if (!amount || !point || !bank_name || !bank_owner_name || !bank_number) {
        return res.status(400).json({ 
          error: 'amount, point, bank_name, bank_owner_name, and bank_number are required' 
        });
      }

      // Validate amount and point are positive numbers
      if (Number(amount) <= 0 || Number(point) <= 0) {
        return res.status(400).json({ 
          error: 'amount and point must be positive numbers' 
        });
      }

      // Check if user has enough points
      const supabase = getSupabase();
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('points')
        .eq('id', currentUser.id)
        .single();

      if (userError || !user) {
        return res.status(500).json({ error: 'Failed to fetch user balance' });
      }

      if (Number(user.points) < Number(point)) {
        return res.status(400).json({ 
          error: 'Insufficient points balance' 
        });
      }

      const request = await createWithdrawRequest({
        user_id: currentUser.id,
        amount: Number(amount),
        point: Number(point),
        exchange_rate: exchange_rate ? Number(exchange_rate) : null,
        bank_name,
        bank_owner_name,
        bank_number
      });

      return res.status(201).json(request);
    }

    // DELETE - Delete withdraw request (only for pending requests by the owner)
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ 
          error: 'id is required' 
        });
      }

      // Get the request first to verify ownership and status
      const request = await getWithdrawRequestById(parseInt(id));
      if (!request) {
        return res.status(404).json({ error: 'Withdraw request not found' });
      }

      // Only allow deletion of own requests
      if (request.user_id !== currentUser.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Only allow deletion of pending requests
      if (request.status !== 'pending') {
        return res.status(400).json({ error: 'Only pending requests can be deleted' });
      }

      await deleteWithdrawRequest(parseInt(id));
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in withdraw-requests API:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

