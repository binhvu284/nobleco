import { getSupabase } from './_db.js';

function redact(value) {
  if (!value) return null;
  if (typeof value !== 'string') return null;
  if (value.length <= 8) return '***';
  return `${value.slice(0, 4)}***${value.slice(-4)}`;
}

export default async function handler(req, res) {
  try {
    const hasUrl = Boolean(process.env.SUPABASE_URL);
    const hasKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);
    const sanitizedUrl = redact(process.env.SUPABASE_URL || '');
    const sanitizedKey = redact(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '');

    let ping = null;
    let error = null;
    try {
      const supabase = getSupabase();
      // Minimal check: query a trivial expression from any table; prefer rpc if available
      const { error: testError } = await supabase.from('users').select('id').limit(1);
      if (testError) throw testError;
      ping = { ok: true };
    } catch (e) {
      error = e?.message || String(e);
    }

    return res.status(error ? 500 : 200).json({
      env: { hasUrl, hasKey, url: sanitizedUrl, key: sanitizedKey },
      ping,
      error,
    });
  } catch (e) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
