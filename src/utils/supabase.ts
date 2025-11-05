import { createClient } from '@supabase/supabase-js';

// Cache for Supabase config and client
let cachedConfig: { url: string; anonKey: string } | null = null;
let cachedClient: ReturnType<typeof createClient> | null = null;
let configPromise: Promise<{ url: string; anonKey: string }> | null = null;

/**
 * Fetch Supabase configuration from API endpoint (runtime)
 * Falls back to build-time environment variables if available
 */
async function getSupabaseConfig(): Promise<{ url: string; anonKey: string }> {
  // If we have cached config, return it
  if (cachedConfig) {
    return cachedConfig;
  }

  // If a fetch is already in progress, wait for it
  if (configPromise) {
    return configPromise;
  }

  // Try build-time environment variables first (for localhost/dev)
  const buildTimeUrl = import.meta.env.VITE_SUPABASE_URL;
  const buildTimeKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (buildTimeUrl && buildTimeKey) {
    cachedConfig = { url: buildTimeUrl, anonKey: buildTimeKey };
    return cachedConfig;
  }

  // Fetch from API endpoint (for Vercel production)
  configPromise = fetch('/api/supabase-config', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        console.error('Supabase config API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`Failed to fetch Supabase config (${response.status}): ${errorData.message || errorData.error || response.statusText}`);
      }
      const config = await response.json();
      if (!config.url || !config.anonKey) {
        console.error('Invalid config received:', config);
        throw new Error('Invalid Supabase configuration received from API');
      }
      cachedConfig = { url: config.url, anonKey: config.anonKey };
      return cachedConfig;
    })
    .catch((error) => {
      configPromise = null; // Reset promise on error so we can retry
      console.error('Error fetching Supabase config:', error);
      const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
      const errorMessage = isVercel
        ? 'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or SUPABASE_URL and SUPABASE_ANON_KEY) in Vercel Project Settings > Environment Variables, then redeploy.'
        : 'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file or Vercel environment variables.';
      throw new Error(`${errorMessage}\n\nOriginal error: ${error.message}`);
    });

  return configPromise;
}

/**
 * Get Supabase client for frontend use
 * Uses runtime API endpoint for Vercel, falls back to build-time env vars for localhost
 */
export async function getSupabaseClient(): Promise<ReturnType<typeof createClient>> {
  // Return cached client if available and config hasn't changed
  if (cachedClient) {
    return cachedClient;
  }

  const config = await getSupabaseConfig();
  cachedClient = createClient(config.url, config.anonKey);
  return cachedClient;
}

/**
 * Synchronous version that returns a client immediately if config is available
 * Falls back to async version if needed
 */
export function getSupabaseClientSync(): ReturnType<typeof createClient> {
  const buildTimeUrl = import.meta.env.VITE_SUPABASE_URL;
  const buildTimeKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (buildTimeUrl && buildTimeKey) {
    if (!cachedClient) {
      cachedClient = createClient(buildTimeUrl, buildTimeKey);
    }
    return cachedClient;
  }

  // If build-time vars not available, we need async initialization
  // Return a temporary client that will be replaced on first async call
  // This allows immediate return for localhost/dev scenarios
  throw new Error('Supabase client requires async initialization. Use getSupabaseClient() instead.');
}

