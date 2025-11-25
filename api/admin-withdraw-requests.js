import { getSupabase } from './_db.js';
import { 
  getWithdrawRequestById,
  updateWithdrawRequestStatus,
  deleteWithdrawRequest
} from './_repo/withdrawRequests.js';
import {
  createWalletLog,
  updateUserPoints
} from './_repo/walletLog.js';

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

/**
 * Get all withdraw requests with user information (admin only)
 */
async function getAllWithdrawRequests() {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('withdraw_request')
    .select(`
      *,
      users!user_id (
        id,
        name,
        email,
        level,
        user_avatars (
          url
        )
      )
    `)
    .order('request_date', { ascending: false });

  if (error) {
    throw error;
  }

  // Transform data to flatten avatar_url
  const transformedData = (data || []).map(request => {
    if (request.users) {
      // Extract avatar URL from user_avatars array
      if (request.users.user_avatars && request.users.user_avatars.length > 0) {
        request.users.avatar_url = request.users.user_avatars[0].url;
      } else {
        request.users.avatar_url = null;
      }
      // Remove the user_avatars array
      delete request.users.user_avatars;
    }
    return request;
  });

  return transformedData;
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check authentication
  const currentUser = await getCurrentUser(req);
  if (!currentUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Only admin and coworker can access
  if (currentUser.role !== 'admin' && currentUser.role !== 'coworker') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    // GET - Get all withdraw requests
    if (req.method === 'GET') {
      const requests = await getAllWithdrawRequests();
      return res.status(200).json(requests);
    }

    // PUT - Update withdraw request status
    if (req.method === 'PUT') {
      const { id, status, admin_notes } = req.body;

      if (!id || !status) {
        return res.status(400).json({ 
          error: 'id and status are required' 
        });
      }

      // Get the request first to check current status and get user_id
      const request = await getWithdrawRequestById(id);
      if (!request) {
        return res.status(404).json({ error: 'Withdraw request not found' });
      }

      const updateData = {
        status,
        processed_by: currentUser.id,
        admin_notes: admin_notes || null,
        completed_date: (status === 'approve' || status === 'reject') ? new Date().toISOString() : null
      };

      const updatedRequest = await updateWithdrawRequestStatus(id, updateData);

      // If approved, deduct points and create wallet log
      if (status === 'approve' && request.status === 'pending') {
        // Get current user balance
        const supabase = getSupabase();
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('points')
          .eq('id', request.user_id)
          .single();

        if (userError) {
          console.error('Error fetching user balance:', userError);
        } else {
          const currentBalance = userData.points || 0;
          const newBalance = Math.max(0, currentBalance - request.point);

          // Update user balance
          await updateUserPoints(request.user_id, newBalance);

          // Create wallet log entry
          await createWalletLog({
            user_id: request.user_id,
            log_type: 'Withdraw',
            point_amount: -request.point, // Negative for withdrawal
            balance_after: newBalance,
            related_withdraw_request_id: id,
            description: `Withdrawal approved: ${request.point} points (${request.amount} VND)`
          });
        }
      }

      return res.status(200).json(updatedRequest);
    }

    // DELETE - Delete withdraw request
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ 
          error: 'id is required' 
        });
      }

      await deleteWithdrawRequest(parseInt(id));
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in admin-withdraw-requests API:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

