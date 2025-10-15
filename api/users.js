import bcrypt from 'bcryptjs';
import { listUsers, createUser } from './_repo/users.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      try {
        const users = await listUsers();
        // public response without password
        return res.status(200).json(users.map(({ password, ...rest }) => rest));
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      const { email, username, password, role } = body || {};
      if (!email || !username) {
        return res.status(400).json({ error: 'email and username are required' });
      }
      try {
        const created = await createUser({ email, username, password, role });
        const { password: _pw, ...safe } = created;
        return res.status(201).json(safe);
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
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
