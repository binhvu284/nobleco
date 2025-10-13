import { getSupabase } from './_db.js';

export default async function handler(req, res) {
  try {
    const supabase = getSupabase();

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, role, created_at')
        .limit(50);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      if (!body || !body.username) {
        return res.status(400).json({ error: 'username is required' });
      }
      const payload = { username: body.username };
      const { data, error } = await supabase
        .from('users')
        .insert(payload)
        .select('id, username, role, created_at')
        .single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).end('Method Not Allowed');
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); }
      catch { resolve(null); }
    });
  });
}
