import bcrypt from 'bcryptjs';
import { findUserByUsername, updateUserPasswordHashed } from '../_repo/users.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).end('Method Not Allowed');
    }

    const body = await readBody(req);
    const username = body?.username?.trim();
    const password = body?.password ?? '';
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }

    const user = await findUserByUsername(username);
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
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
  return res.status(200).json({ ok: true, token, user: { id: user.id, email: user.email, username: user.username, role: user.role ?? 'user' } });
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
