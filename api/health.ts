import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    res.status(200).json({ ok: true, db: db.databaseName });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
