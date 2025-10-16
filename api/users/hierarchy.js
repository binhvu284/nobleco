import { getSupabase } from '../_db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const supabase = getSupabase();

    // Get current user data to find their superior
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, refer_code, referred_by')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return res.status(500).json({ error: 'Failed to fetch user data' });
    }

    let superior = null;
    
    // If user has a superior (referred_by contains a refer_code), fetch superior details
    if (currentUser.referred_by) {
      const { data: superiorData, error: superiorError } = await supabase
        .from('users')
        .select('id, name, email, level, refer_code, created_at')
        .eq('refer_code', currentUser.referred_by)
        .single();

      if (!superiorError && superiorData) {
        superior = {
          id: superiorData.id,
          name: superiorData.name,
          email: superiorData.email,
          level: superiorData.level,
          refer_code: superiorData.refer_code,
          joined_date: superiorData.created_at ? new Date(superiorData.created_at).toISOString().split('T')[0] : null
        };
      }
    }

    // Get all inferiors (users who were referred by this user using their refer_code)
    const { data: inferiorsData, error: inferiorsError } = await supabase
      .from('users')
      .select('id, name, email, level, refer_code, created_at, referred_by')
      .eq('referred_by', currentUser.refer_code)
      .order('created_at', { ascending: false });

    if (inferiorsError) {
      console.error('Error fetching inferiors:', inferiorsError);
      return res.status(500).json({ error: 'Failed to fetch inferiors data' });
    }

    // For each inferior, count how many people they referred (using their refer_code)
    const inferiors = await Promise.all((inferiorsData || []).map(async (inferior) => {
      const { count, error: countError } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('referred_by', inferior.refer_code);

      return {
        id: inferior.id,
        name: inferior.name,
        email: inferior.email,
        level: inferior.level,
        refer_code: inferior.refer_code,
        joined_date: inferior.created_at ? new Date(inferior.created_at).toISOString().split('T')[0] : null,
        inferiors_count: countError ? 0 : (count || 0)
      };
    }));

    return res.status(200).json({
      superior,
      inferiors
    });
  } catch (error) {
    console.error('Hierarchy API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

