import { getDb } from './_db.js';

function redact(uri) {
  if (!uri) return null;
  try {
    const u = new URL(uri);
    if (u.password) u.password = '***';
    if (u.username) u.username = '***';
    return `${u.protocol}//${u.username}:${u.password}@${u.host}${u.pathname}${u.search}`;
  } catch {
    return 'unparseable';
  }
}

export default async function handler(req, res) {
  try {
    const hasUri = Boolean(process.env.MONGODB_URI);
    const dbName = process.env.DB_NAME || null;
    const sanitized = redact(process.env.MONGODB_URI || '');

    let ping = null;
    let error = null;
    try {
      const db = await getDb();
      await db.command({ ping: 1 });
      ping = { ok: true, db: db.databaseName };
    } catch (e) {
      error = e?.message || String(e);
    }

    return res.status(error ? 500 : 200).json({
      env: { hasUri, dbName, uri: sanitized },
      ping,
      error,
    });
  } catch (e) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
