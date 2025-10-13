const { getDb } = require('./_db');

module.exports = async (req, res) => {
  try {
    const db = await getDb();
    const col = db.collection('users');

    if (req.method === 'GET') {
      const users = await col.find({}, { projection: { password: 0 } }).limit(50).toArray();
      return res.status(200).json(users);
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      if (!body || !body.username) {
        return res.status(400).json({ error: 'username is required' });
      }
      const payload = { username: body.username, createdAt: new Date() };
      const { insertedId } = await col.insertOne(payload);
      return res.status(201).json({ _id: insertedId, ...payload });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).end('Method Not Allowed');
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
