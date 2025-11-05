import { getSupabaseEnv } from './_config.js';

/**
 * API endpoint to provide Supabase client configuration
 * This allows the frontend to get Supabase credentials at runtime
 * Uses the same config pattern as other API endpoints
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

    // Use the same config pattern as other API endpoints
    // This handles all the fallback logic for different env var names
    const { url: supabaseUrl } = getSupabaseEnv();
    
    // For anon key, check ALL possible variations (including prefixed ones)
    const allEnvKeys = Object.keys(process.env);
    const allSupabaseKeys = allEnvKeys.filter(k => k.includes('SUPABASE'));
    const anonKeyCandidates = allSupabaseKeys.filter(k => 
      k.includes('ANON') && 
      !k.includes('SERVICE') && 
      !k.includes('JWT')
    );
    
    console.log('Available SUPABASE keys:', allSupabaseKeys);
    console.log('Anon key candidates:', anonKeyCandidates);
    
    // Try standard names first, then any candidate
    let supabaseAnonKey = 
      process.env.SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY || 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // If not found, try any candidate that contains ANON_KEY
    if (!supabaseAnonKey && anonKeyCandidates.length > 0) {
      // Try the first candidate
      supabaseAnonKey = process.env[anonKeyCandidates[0]];
      console.log(`Using prefixed anon key: ${anonKeyCandidates[0]}`);
    }

    // Check if we have both required values
    if (!supabaseUrl) {
      const allSupabaseKeys = Object.keys(process.env).filter(k => k.includes('SUPABASE'));
      console.error('Supabase URL missing. Available keys:', allSupabaseKeys);
      
      return res.status(500).json({ 
        error: 'Supabase URL not configured',
        message: 'Missing SUPABASE_URL environment variable',
        hint: 'Set SUPABASE_URL in Vercel Dashboard > Settings > Environment Variables',
        availableKeys: allSupabaseKeys
      });
    }

    if (!supabaseAnonKey) {
      const allSupabaseKeys = Object.keys(process.env).filter(k => k.includes('SUPABASE'));
      console.error('Supabase anon key missing. Available keys:', allSupabaseKeys);
      
      return res.status(500).json({ 
        error: 'Supabase anon key not configured',
        message: 'Missing SUPABASE_ANON_KEY environment variable',
        hint: 'Set SUPABASE_ANON_KEY in Vercel Dashboard > Settings > Environment Variables. Get the value from Supabase Dashboard > Settings > API > anon/public key',
        availableKeys: allSupabaseKeys,
        instructions: [
          '1. Go to https://app.supabase.com',
          '2. Select your project',
          '3. Go to Settings > API',
          '4. Copy the "anon public" key',
          '5. Add it as SUPABASE_ANON_KEY in Vercel',
          '6. Redeploy your project'
        ]
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

