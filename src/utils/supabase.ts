import { createClient } from '@supabase/supabase-js';

// Cache for Supabase client
let cachedClient: ReturnType<typeof createClient> | null = null;
let initPromise: Promise<ReturnType<typeof createClient>> | null = null;

/**
 * Get Supabase client for frontend use
 * Works for both localhost (build-time env vars) and Vercel (runtime API)
 */
export async function getSupabaseClient(): Promise<ReturnType<typeof createClient>> {
  // Return cached client if available
  if (cachedClient) {
    return cachedClient;
  }

  // If initialization is in progress, wait for it
  if (initPromise) {
    return initPromise;
  }

  // Start initialization
  initPromise = (async () => {
    try {
      // First, try build-time environment variables (for localhost/dev)
      const buildTimeUrl = import.meta.env.VITE_SUPABASE_URL;
      const buildTimeKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (buildTimeUrl && buildTimeKey) {
        console.log('Using build-time Supabase config');
        cachedClient = createClient(buildTimeUrl, buildTimeKey);
        return cachedClient;
      }

      // If build-time vars not available, fetch from API endpoint (for Vercel)
      console.log('Fetching Supabase config from API...');
      const response = await fetch('/api/supabase-config', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: response.statusText,
          error: 'Unknown error'
        }));
        
        console.error('Supabase config API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });

        const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
        const errorMessage = isVercel
          ? `Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel Project Settings > Environment Variables, then redeploy. (API returned ${response.status})`
          : `Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file. (API returned ${response.status})`;
        
        throw new Error(`${errorMessage}\n\nAPI Error: ${errorData.message || errorData.error || response.statusText}`);
      }

      const config = await response.json();
      
      if (!config.url || !config.anonKey) {
        console.error('Invalid config received from API:', config);
        throw new Error('Invalid Supabase configuration received from API. Missing url or anonKey.');
      }

      console.log('Using runtime Supabase config from API');
      cachedClient = createClient(config.url, config.anonKey);
      return cachedClient;

    } catch (error) {
      initPromise = null; // Reset promise on error so we can retry
      console.error('Failed to initialize Supabase client:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
      
      throw new Error(
        isVercel
          ? `Failed to initialize Supabase client. Please verify SUPABASE_URL and SUPABASE_ANON_KEY are set in Vercel environment variables and redeploy.\n\nError: ${errorMessage}`
          : `Failed to initialize Supabase client. Please verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.\n\nError: ${errorMessage}`
      );
    }
  })();

  return initPromise;
}

