import { getDb } from './_db.js';

export default async function handler(req, res) {
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    res.status(200).json({ ok: true, db: db.databaseName });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}
