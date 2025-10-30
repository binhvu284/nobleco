import bcrypt from 'bcryptjs';
import { listUsers, createUser, deleteUser, updateUserStatus, listAdminUsers, listCoworkers } from './_repo/users.js';
import { getSupabase } from './_db.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Handle user by ID endpoint
    if (req.method === 'GET' && req.query?.id && !req.query?.type && !req.query?.endpoint) {
      const userId = req.query.id;
      
      try {
        const supabase = getSupabase();
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, email, name, role, points, level, status, refer_code, commission, phone, address, created_at, referred_by')
          .eq('id', userId)
          .single();

        if (userError) {
          console.error('Error fetching user:', userError);
          return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({
          success: true,
          user: {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            points: userData.points,
            level: userData.level,
            status: userData.status,
            refer_code: userData.refer_code,
            commission: userData.commission,
            phone: userData.phone,
            address: userData.address,
            created_at: userData.created_at,
            referred_by: userData.referred_by,
          },
        });
      } catch (error) {
        console.error('Fetch user error:', error);
        return res.status(500).json({ error: 'Failed to fetch user' });
      }
    }

    // Handle hierarchy endpoint
    if (req.method === 'GET' && req.query?.endpoint === 'hierarchy') {
      const { getUserHierarchy, getIndirectInferiors, calculateCommissions } = await import('./_repo/users.js');
      const { userId, includeDetails } = req.query;
      
      const isDevelopment = process.env.NODE_ENV === 'development' || req.headers['x-no-cache'];
      
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      try {
        const hierarchyData = await getUserHierarchy(userId);
        
        if (includeDetails === 'true') {
          const inferiorsWithIndirect = await Promise.all(
            hierarchyData.inferiors.map(async (inferior) => {
              const indirectInferiors = await getIndirectInferiors(inferior.id);
              const commissions = await calculateCommissions(inferior.id);
              
              return {
                ...inferior,
                inferiors_list: indirectInferiors,
                direct_commission: commissions.direct_commission,
                indirect_commission: commissions.indirect_commission
              };
            })
          );

          if (isDevelopment) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          } else {
            res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=30');
          }
          return res.status(200).json({
            superior: hierarchyData.superior,
            inferiors: inferiorsWithIndirect
          });
        } else {
          if (isDevelopment) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          } else {
            res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=30');
          }
          return res.status(200).json({
            superior: hierarchyData.superior,
            inferiors: hierarchyData.inferiors
          });
        }
      } catch (e) {
        console.error('Error fetching hierarchy data:', e);
        return res.status(500).json({ error: e.message });
      }
    }

    // Handle wallet endpoint
    if (req.method === 'GET' && req.query?.endpoint === 'wallet') {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      try {
        const supabase = getSupabase();
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id, name, email, points, level, commission, created_at')
          .eq('id', userId)
          .single();

        if (userError) {
          console.error('Error fetching user data:', userError);
          return res.status(500).json({ error: 'Failed to fetch user data' });
        }

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        const commissionRates = getCommissionRates(user.level);
        const transactions = await getTransactionHistory(userId);

        res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
        
        return res.status(200).json({
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            balance: user.points || 0,
            level: user.level,
            commission: user.commission || 0,
            joinedDate: user.created_at
          },
          commissionRates,
          transactions
        });
      } catch (e) {
        console.error('Error fetching wallet data:', e);
        return res.status(500).json({ error: e.message });
      }
    }

    if (req.method === 'GET') {
      try {
        const { type } = req.query;
        
        let users;
        if (type === 'admin') {
          users = await listAdminUsers();
        } else if (type === 'coworkers') {
          users = await listCoworkers();
        } else {
          users = await listUsers();
        }
        
        // public response without password
        return res.status(200).json(users.map(({ password, ...rest }) => rest));
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }

    if (req.method === 'PATCH') {
      const body = req.body || await readBody(req);
      const { id, status, name, phone, address } = body || {};
      
      // Handle profile updates
      if (name !== undefined || phone !== undefined || address !== undefined) {
        if (!id) {
          return res.status(400).json({ error: 'User ID is required' });
        }

        // Build update object with only provided fields
        const updates = {};
        if (name !== undefined) updates.name = name || null;
        if (phone !== undefined) updates.phone = phone || null;
        if (address !== undefined) updates.address = address || null;

        if (Object.keys(updates).length === 0) {
          return res.status(400).json({ error: 'No fields to update' });
        }

        try {
          const supabase = getSupabase();
          const { data: userData, error: userError } = await supabase
            .from('users')
            .update(updates)
            .eq('id', id)
            .select('id, email, name, role, points, level, status, refer_code, commission, phone, address, created_at, referred_by')
            .single();

          if (userError) {
            console.error('Error updating user:', userError);
            return res.status(500).json({ error: 'Failed to update profile' });
          }

          return res.status(200).json({
            success: true,
            user: userData,
          });
        } catch (e) {
          return res.status(500).json({ error: e.message });
        }
      }
      
      // Handle status updates (legacy)
      if (!id || !status) {
        return res.status(400).json({ error: 'user id and status are required' });
      }
      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({ error: 'status must be either "active" or "inactive"' });
      }
      try {
        const updatedUser = await updateUserStatus(id, status);
        const { password: _pw, ...safe } = updatedUser;
        return res.status(200).json(safe);
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }

    if (req.method === 'POST') {
      const body = req.body || await readBody(req);
      const { email, username, password, role, inferiorId, account } = body || {};
      
      // Handle seed-admin endpoint (similar to signup but for admin seeding)
      const isSeedAdmin = req.query?.endpoint === 'seed-admin' || account !== undefined;
      if (isSeedAdmin) {
        const seedAccount = account || username;
        const seedEmail = email;
        const seedPassword = password;
        
        if (!seedAccount || !seedEmail || !seedPassword) {
          return res.status(400).json({ error: 'account, email and password required' });
        }

        try {
          const supabase = getSupabase();
          const { data: existing, error: findErr } = await supabase
            .from('users')
            .select('id')
            .or(`username.eq.${seedAccount},email.eq.${seedEmail}`)
            .maybeSingle();
          
          if (findErr) return res.status(500).json({ error: findErr.message });
          if (existing) {
            return res.status(200).json({ ok: true, message: 'User already exists' });
          }

          const bcrypt = await import('bcryptjs');
          const pw = await bcrypt.default.hash(seedPassword, 10);
          let { error: insertErr } = await supabase
            .from('users')
            .insert({ email: seedEmail, username: seedAccount, password: pw, role: 'admin' });
          
          if (insertErr && /column\s+"?role"?\s+does not exist/i.test(insertErr.message)) {
            const resp = await supabase
              .from('users')
              .insert({ email: seedEmail, username: seedAccount, password: pw });
            insertErr = resp.error || null;
          }
          
          if (insertErr) return res.status(500).json({ error: insertErr.message });
          return res.status(201).json({ ok: true });
        } catch (e) {
          return res.status(500).json({ error: e.message });
        }
      }
      
      // Handle remove inferior functionality
      if (inferiorId !== undefined) {
        if (!inferiorId) {
          return res.status(400).json({ error: 'inferiorId is required' });
        }

        try {
          const numericId = parseInt(inferiorId);
          if (isNaN(numericId)) {
            return res.status(400).json({ error: 'inferiorId must be a valid number' });
          }
          
          const supabase = getSupabase();
          const { data, error } = await supabase
            .from('users')
            .update({ referred_by: null })
            .eq('id', numericId)
            .select('id, name, email')
            .single();
          
          if (error) {
            throw new Error(error.message);
          }
          
          return res.status(200).json({
            success: true,
            message: 'Inferior removed successfully',
            removedInferior: data
          });
        } catch (e) {
          return res.status(500).json({ error: e.message });
        }
      }
      
      // Handle user creation
      if (!email || !username) {
        return res.status(400).json({ error: 'email and username are required' });
      }
      try {
        const created = await createUser({ email, username, password, role });
        const { password: _pw, ...safe } = created;
        return res.status(201).json(safe);
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }


    if (req.method === 'PUT') {
      const body = req.body || await readBody(req);
      const { userId, status } = body || {};
      
      // Validate input
      if (!userId || !status) {
        return res.status(400).json({ error: 'User ID and status are required' });
      }
      
      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({ error: 'Status must be either "active" or "inactive"' });
      }
      
      try {
        const result = await updateUserStatus(userId, status);
        return res.status(200).json({ 
          success: true, 
          message: 'User status updated successfully',
          user: result 
        });
      } catch (e) {
        console.error('Error updating user status:', e);
        return res.status(500).json({ error: e.message });
      }
    }

    if (req.method === 'DELETE') {
      const body = req.body || await readBody(req);
      const { id } = body || {};
      if (!id) {
        return res.status(400).json({ error: 'user id is required' });
      }
      try {
        await deleteUser(id);
        return res.status(200).json({ success: true, message: 'User deleted successfully' });
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }

    res.setHeader('Allow', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    return res.status(405).end('Method Not Allowed');
  } catch (e) {
    console.error('API Error:', e);
    return res.status(500).json({ 
      error: e.message || 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}

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

// Get commission rates based on user level
function getCommissionRates(level) {
  const rates = {
    'guest': {
      self: 0,
      level1: 0,
      level2: 0
    },
    'member': {
      self: 2,
      level1: 1,
      level2: 0
    },
    'unit manager': {
      self: 5,
      level1: 2,
      level2: 1
    },
    'brand manager': {
      self: 8,
      level1: 3,
      level2: 2
    }
  };

  return rates[level] || rates['guest'];
}

// Get transaction history (simplified version)
async function getTransactionHistory(userId) {
  const supabase = getSupabase();
  
  try {
    const { data: user } = await supabase
      .from('users')
      .select('points, created_at')
      .eq('id', userId)
      .single();

    if (!user) return [];

    const transactions = [];
    const currentBalance = user.points || 0;
    
    if (currentBalance > 0) {
      const commissionAmount = Math.min(currentBalance, 100);
      transactions.push({
        id: 1,
        type: 'commission',
        amount: commissionAmount,
        description: 'Commission from network sales',
        date: new Date().toISOString(),
        status: 'completed'
      });

      if (currentBalance > 200) {
        transactions.push({
          id: 2,
          type: 'withdrawal',
          amount: -Math.min(currentBalance - 100, 200),
          description: 'Withdrawal to bank account',
          date: new Date(Date.now() - 86400000).toISOString(),
          status: 'completed'
        });
      }
    }

    return transactions;
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return [];
  }
}
