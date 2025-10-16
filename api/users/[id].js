import { getSupabase } from '../_db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Get user ID from query params or route params
    const userId = req.query.id || req.params?.id;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const supabase = getSupabase();

    // Fetch user from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, name, role, points, level, status, refer_code, commission, phone, address, created_at')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return res.status(404).json({ error: 'User not found' });
    }

    // Return user data
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
      },
    });
  } catch (error) {
    console.error('Fetch user error:', error);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
}

