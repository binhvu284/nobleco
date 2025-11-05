/**
 * API endpoint to provide Supabase client configuration
 * This allows the frontend to get Supabase credentials at runtime
 * instead of relying on build-time environment variables
 */
export default async function handler(req, res) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get Supabase URL and anon key from environment
  // These are safe to expose to the client
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ 
      error: 'Supabase configuration not available',
      message: 'Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables'
    });
  }

  // Return the configuration (safe to expose anon key to client)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
  
  return res.status(200).json({
    url: supabaseUrl,
    anonKey: supabaseAnonKey
  });
}

