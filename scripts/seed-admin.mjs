import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  const [, , argUser, argPass] = process.argv;
  const username = argUser || process.env.SEED_USERNAME || 'admin';
  const password = argPass || process.env.SEED_PASSWORD || '';

  if (!url) throw new Error('Missing SUPABASE_URL');
  if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)');
  if (!username || !password) throw new Error('Missing username/password (args or SEED_USERNAME/SEED_PASSWORD)');

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data: existing, error: findErr } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle();
  if (findErr) throw new Error(findErr.message);
  if (existing) {
    console.log(`[seed-admin] User '${username}' already exists. Skipping.`);
    return;
  }

  const password_hash = await bcrypt.hash(password, 10);
  const { data, error: insertErr } = await supabase
    .from('users')
    .insert({ username, password_hash, role: 'admin' })
    .select('id')
    .single();
  if (insertErr) throw new Error(insertErr.message);
  console.log(`[seed-admin] Created user '${username}' with id=${data.id}`);
}

main().catch((e) => {
  console.error('[seed-admin] ERROR:', e?.message || e);
  process.exit(1);
});
