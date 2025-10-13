import { getSupabase } from './_db.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  try {
    const supabase = getSupabase();

    if (req.method === 'GET') {
      let { data, error } = await supabase
        .from('users')
        .select('id, email, username, role')
        .limit(50);
      if (error && /column\s+"?role"?\s+does not exist/i.test(error.message)) {
        const resp = await supabase
          .from('users')
          .select('id, email, username')
          .limit(50);
        if (resp.error) return res.status(500).json({ error: resp.error.message });
        data = (resp.data || []).map((u) => ({ ...u, role: 'user' }));
        return res.status(200).json(data);
      }
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      const { email, username, password, role } = body || {};
      if (!email || !username) {
        return res.status(400).json({ error: 'email and username are required' });
      }
      const hashed = password ? await bcrypt.hash(password, 10) : null;
      const payload = { email, username, password: hashed, role: role === 'admin' ? 'admin' : 'user' };
      let { data, error } = await supabase
        .from('users')
        .insert(payload)
        .select('id, email, username, role')
        .single();
      if (error && /column\s+"?role"?\s+does not exist/i.test(error.message)) {
        const resp = await supabase
          .from('users')
          .insert({ email, username, password: hashed })
          .select('id, email, username')
          .single();
        if (resp.error) return res.status(500).json({ error: resp.error.message });
        return res.status(201).json({ ...resp.data, role: 'user' });
      }
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
