import { getSupabase } from '../_db.js';

/**
 * List all third-party integrations
 */
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getSupabase();

    // Get all integrations
    const { data: integrations, error } = await supabase
      .from('third_party_integrations')
      .select('id, name, display_name, is_default, is_active, last_sync_at')
      .order('is_default', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching integrations:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch integrations',
        message: error.message 
      });
    }

    return res.status(200).json({
      success: true,
      integrations: integrations || []
    });

  } catch (error) {
    console.error('Error in list integrations handler:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

