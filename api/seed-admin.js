import { getSupabase } from './_db.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).end('Method Not Allowed');
    }
    const body = await readBody(req);
    const { account, email, password } = body || {};
    if (!account || !email || !password) {
      return res.status(400).json({ error: 'account, email and password required' });
    }
    const supabase = getSupabase();
    const { data: existing, error: findErr } = await supabase
      .from('users')
      .select('id')
      .or(`username.eq.${account},email.eq.${email}`)
      .maybeSingle();
    if (findErr) return res.status(500).json({ error: findErr.message });
    if (existing) {
      return res.status(200).json({ ok: true, message: 'User already exists' });
    }
    const pw = await bcrypt.hash(password, 10);
    const { error: insertErr } = await supabase
      .from('users')
      .insert({ email, username: account, password: pw, role: 'admin' });
    if (insertErr) return res.status(500).json({ error: insertErr.message });
    return res.status(201).json({ ok: true });
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
