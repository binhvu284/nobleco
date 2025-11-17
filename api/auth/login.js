import bcrypt from 'bcryptjs';
import { findUserByEmailOrPhone, updateUserPasswordHashed } from '../_repo/users.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).end('Method Not Allowed');
    }

    // Check if body is already parsed (Express) or needs to be read
    const body = req.body || await readBody(req);
    const identifier = body?.username?.trim() || body?.email?.trim() || body?.phone?.trim();
    const password = body?.password ?? '';
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/Phone and password are required' });
    }

    // Find user by email or phone
    const user = await findUserByEmailOrPhone(identifier);
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is inactive
    if (user.status === 'inactive') {
      return res.status(403).json({ error: 'Account is inactive. Please contact support.' });
    }

    let valid = false;
    try {
      valid = await bcrypt.compare(password, user.password);
    } catch {
      // Fall through to plaintext check if stored value isn't a bcrypt hash
      valid = false;
    }

    // Backward-compat: if password in DB is plaintext (not bcrypt), compare directly
    const looksHashed = typeof user.password === 'string' && user.password.startsWith('$2');
    if (!valid && !looksHashed) {
      if (password === user.password) {
        valid = true;
        // Opportunistically upgrade to bcrypt hash
        try {
          await updateUserPasswordHashed(user.id, password);
        } catch {
          // ignore hashing failures; user can still log in this time
        }
      }
    }

    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    // Simple session token: not a JWT, just a placeholder for demo
    const token = `ok.${user.id}`;
  return res.status(200).json({ 
    ok: true, 
    token, 
    user: { 
      id: user.id, 
      email: user.email, 
      name: user.name, 
      role: user.role ?? 'user',
      points: user.points ?? 0,
      level: user.level ?? 'guest',
      status: user.status ?? 'active',
      refer_code: user.refer_code,
      commission: user.commission ?? 0
    } 
  });
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
