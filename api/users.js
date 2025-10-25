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
      const { email, username, password, role, inferiorId } = body || {};
      
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
