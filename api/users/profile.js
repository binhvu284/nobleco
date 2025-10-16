import { getSupabase } from '../_db.js';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = req.body || await readBody(req);
    const { id, name, phone, address } = body;

    // Validate required fields
    if (!id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Build update object with only provided fields
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const supabase = getSupabase();

    // Update users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select('id, email, name, role, points, level, status, refer_code, commission, phone, address')
      .single();

    if (userError) {
      console.error('Error updating user:', userError);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    // Return updated user data
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
      },
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
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

