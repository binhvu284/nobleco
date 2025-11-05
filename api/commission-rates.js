import { listCommissionRates, updateCommissionRates } from './_repo/commissionRates.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method } = req;

  try {
    if (method === 'GET') {
      // GET /api/commission-rates - List all commission rates
      try {
        const rates = await listCommissionRates();
        return res.status(200).json(rates);
      } catch (error) {
        console.error('GET commission-rates error:', error);
        return res.status(500).json({ error: error.message || 'Failed to fetch commission rates' });
      }
    }

    if (method === 'PATCH') {
      // PATCH /api/commission-rates - Update commission rates
      const body = req.body || await readBody(req);
      const { rates } = body || {};

      if (!rates || !Array.isArray(rates) || rates.length === 0) {
        return res.status(400).json({ error: 'Commission rates array is required' });
      }

      // Validate each rate
      for (const rate of rates) {
        if (!rate.user_level) {
          return res.status(400).json({ error: 'user_level is required for each rate' });
        }
        if (typeof rate.self_commission !== 'number' || rate.self_commission < 0 || rate.self_commission > 100) {
          return res.status(400).json({ error: 'self_commission must be a number between 0 and 100' });
        }
        if (typeof rate.level_1_down !== 'number' || rate.level_1_down < 0 || rate.level_1_down > 100) {
          return res.status(400).json({ error: 'level_1_down must be a number between 0 and 100' });
        }
        if (typeof rate.level_2_down !== 'number' || rate.level_2_down < 0 || rate.level_2_down > 100) {
          return res.status(400).json({ error: 'level_2_down must be a number between 0 and 100' });
        }
      }

      const updatedRates = await updateCommissionRates(rates);
      return res.status(200).json({
        success: true,
        rates: updatedRates
      });
    }

    res.setHeader('Allow', 'GET, PATCH, OPTIONS');
    return res.status(405).end('Method Not Allowed');
  } catch (e) {
    console.error('API Error:', e);
    return res.status(500).json({ 
      error: e.message || 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

