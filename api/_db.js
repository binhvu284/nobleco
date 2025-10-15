import { createClient } from '@supabase/supabase-js';
import { getSupabaseEnv } from './_config.js';

let supabase;

/**
 * Returns a cached Supabase client using server-side credentials.
 * Required env vars:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (preferred on server) or SUPABASE_ANON_KEY (dev fallback)
 */
export function getSupabase() {
  if (supabase) return supabase;
  const { url, key } = getSupabaseEnv();
  if (!url) throw new Error('Missing SUPABASE_URL (or NEXT_PUBLIC_/VITE_ fallback) env var');
  if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) env var');
  supabase = createClient(url, key, {
    auth: { persistSession: false },
  });
  return supabase;
}
