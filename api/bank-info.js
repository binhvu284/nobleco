import { getSupabase } from './_db.js';
import { getBankInfo, upsertBankInfo, deleteBankInfo } from './_repo/bankInfo.js';

/**
 * Extract user ID from auth token
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

  try {
    // GET - Get bank info for current user
    if (req.method === 'GET') {
      const bankInfo = await getBankInfo(currentUser.id);
      return res.status(200).json(bankInfo || null);
    }

    // POST/PUT - Create or update bank info
    if (req.method === 'POST' || req.method === 'PUT') {
      const { bank_name, bank_owner_name, bank_number } = req.body;

      if (!bank_name || !bank_owner_name || !bank_number) {
        return res.status(400).json({ 
          error: 'bank_name, bank_owner_name, and bank_number are required' 
        });
      }

      const bankInfo = await upsertBankInfo(currentUser.id, {
        bank_name,
        bank_owner_name,
        bank_number
      });

      return res.status(200).json(bankInfo);
    }

    // DELETE - Delete bank info
    if (req.method === 'DELETE') {
      await deleteBankInfo(currentUser.id);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in bank-info API:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

