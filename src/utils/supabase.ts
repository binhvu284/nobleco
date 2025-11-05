import { createClient } from '@supabase/supabase-js';

/**
 * Get Supabase client for frontend use
 * Uses VITE_ prefixed environment variables
 */
export function getSupabaseClient() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
    const errorMessage = isVercel
      ? 'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel Project Settings > Environment Variables, then redeploy.'
      : 'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file or Vercel environment variables.';
    throw new Error(errorMessage);
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

