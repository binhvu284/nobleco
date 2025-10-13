import { getDb } from './_db.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).end('Method Not Allowed');
    }
    const body = await readBody(req);
    const { account, password } = body || {};
    if (!account || !password) {
      return res.status(400).json({ error: 'account and password required' });
    }
    const db = await getDb();
    const users = db.collection('users');
    const existing = await users.findOne({ username: account });
    if (existing) {
      return res.status(200).json({ ok: true, message: 'User already exists' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await users.insertOne({ username: account, passwordHash, role: 'admin', createdAt: new Date() });
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
