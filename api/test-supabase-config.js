/**
 * Test endpoint to verify Supabase environment variables are accessible
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const envVars = {
    VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: !!process.env.VITE_SUPABASE_ANON_KEY,
    SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
    // Show first few chars for verification (not full value for security)
    VITE_SUPABASE_URL_VALUE: process.env.VITE_SUPABASE_URL ? process.env.VITE_SUPABASE_URL.substring(0, 20) + '...' : null,
    SUPABASE_URL_VALUE: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 20) + '...' : null,
  };

  return res.status(200).json({
    message: 'Environment variables check',
    envVars,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV
  });
}

