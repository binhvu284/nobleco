import { getSupabase } from './_db.js';
import { getDBConfig, getSupabaseEnv } from './_config.js';

function redact(value) {
  if (!value) return null;
  if (typeof value !== 'string') return null;
  if (value.length <= 8) return '***';
  return `${value.slice(0, 4)}***${value.slice(-4)}`;
}

export default async function handler(req, res) {
  try {
    const { url, key } = getSupabaseEnv();
    const hasUrl = Boolean(url);
    const hasKey = Boolean(key);
    const sanitizedUrl = redact(url || '');
    const sanitizedKey = redact(key || '');
    const config = getDBConfig();

    let ping = null;
    let error = null;
    if (hasUrl && hasKey) {
      try {
        const supabase = getSupabase();
        const { error: testError } = await supabase.from(config.table).select(config.col.id).limit(1);
        if (testError) throw testError;
        ping = { ok: true };
      } catch (e) {
        error = e?.message || String(e);
      }
    } else {
      error = 'Missing Supabase env variables';
    }

    return res.status(error ? 500 : 200).json({
      env: { hasUrl, hasKey, url: sanitizedUrl, key: sanitizedKey },
      db: { table: config.table, columns: config.col },
      ping,
      error,
    });
  } catch (e) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
