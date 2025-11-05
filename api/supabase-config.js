/**
 * API endpoint to provide Supabase client configuration
 * This allows the frontend to get Supabase credentials at runtime
 * instead of relying on build-time environment variables
 */
export default async function handler(req, res) {
  try {
    // Set CORS headers first
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get Supabase URL and anon key from environment
    // Check multiple possible variable names
    const supabaseUrl = 
      process.env.VITE_SUPABASE_URL || 
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    const supabaseAnonKey = 
      process.env.VITE_SUPABASE_ANON_KEY || 
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Log available env vars for debugging (without exposing sensitive data)
    const hasUrl = !!supabaseUrl;
    const hasKey = !!supabaseAnonKey;
    const envVarsPresent = {
      VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: !!process.env.VITE_SUPABASE_ANON_KEY,
      SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY
    };

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase config missing:', {
        hasUrl,
        hasKey,
        envVarsPresent,
        allEnvKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
      });
      
      return res.status(500).json({ 
        error: 'Supabase configuration not available',
        message: 'Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables',
        debug: {
          hasUrl,
          hasKey,
          envVarsPresent,
          hint: 'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or SUPABASE_URL and SUPABASE_ANON_KEY) in Vercel environment variables'
        }
      });
    }

    // Return the configuration (safe to expose anon key to client)
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    return res.status(200).json({
      url: supabaseUrl,
      anonKey: supabaseAnonKey
    });
  } catch (error) {
    console.error('Error in supabase-config endpoint:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

