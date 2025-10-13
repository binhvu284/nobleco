const { getDb } = require('../_db');
const bcrypt = require('bcryptjs');

module.exports = async (req, res) => {
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

    const db = await getDb();
    const users = db.collection('users');
    const user = await users.findOne({ username });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    // Simple session token: not a JWT, just a placeholder for demo
    const token = `ok.${user._id.toString()}`;
    return res.status(200).json({ ok: true, token, user: { username: user.username } });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

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
