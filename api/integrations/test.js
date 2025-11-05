import { getSupabase } from '../_db.js';

/**
 * Test connection to third-party integration API
 */
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const integrationId = req.query.integrationId || req.body.integrationId;
    
    if (!integrationId) {
      return res.status(400).json({ error: 'integrationId is required' });
    }

    const supabase = getSupabase();

    // Get integration configuration
    const { data: integration, error: integrationError } = await supabase
      .from('third_party_integrations')
      .select('*')
      .eq('id', integrationId)
      .single();

    if (integrationError || !integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    if (!integration.is_active) {
      return res.status(400).json({ error: 'Integration is not active' });
    }

    // Test connection by getting access token
    try {
      const accessToken = await getKiotVietAccessToken(integration);
      
      // Try to make a simple API call to verify connection
      const testResponse = await fetch(`${integration.api_url}/products?pageSize=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Retailer': integration.retailer,
          'Content-Type': 'application/json'
        }
      });

      if (testResponse.ok) {
        return res.status(200).json({
          success: true,
          message: 'Connection successful! API is ready to sync data.'
        });
      } else {
        throw new Error(`API returned status ${testResponse.status}`);
      }
    } catch (error) {
      console.error('Connection test error:', error);
      return res.status(500).json({
        success: false,
        error: 'Connection failed',
        message: error.message || 'Failed to connect to API. Please check your credentials and try again.'
      });
    }

  } catch (error) {
    console.error('Error in test handler:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

/**
 * Get access token from KiotViet
 */
async function getKiotVietAccessToken(integration) {
  // Check if token is still valid
  if (integration.access_token && integration.token_expires_at) {
    const expiresAt = new Date(integration.token_expires_at);
    const now = new Date();
    if (expiresAt > now) {
      return integration.access_token;
    }
  }

  // Get new token
  const response = await fetch(integration.token_url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: integration.client_id,
      client_secret: integration.client_secret,
      scopes: 'PublicApi.Access'
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Update token in database
  const supabase = getSupabase();
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + (data.expires_in || 3600));
  
  await supabase
    .from('third_party_integrations')
    .update({
      access_token: data.access_token,
      token_expires_at: expiresAt.toISOString()
    })
    .eq('id', integration.id);

  return data.access_token;
}

