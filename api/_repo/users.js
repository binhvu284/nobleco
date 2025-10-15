import { getSupabase } from '../_db.js';
import bcrypt from 'bcryptjs';

// Normalize user shape
function normalize(u) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    role: u.role ?? 'user',
    password: u.password, // keep internal for auth only; strip before returning to clients
  };
}

export async function listUsers() {
  const supabase = getSupabase();
  let { data, error } = await supabase
    .from('users')
    .select('id, email, username, role');
  if (error && /column\s+"?role"?\s+does not exist/i.test(error.message)) {
    const resp = await supabase
      .from('users')
      .select('id, email, username');
    if (resp.error) throw new Error(resp.error.message);
    return (resp.data || []).map((u) => normalize({ ...u, role: 'user' }));
  }
  if (error) throw new Error(error.message);
  return (data || []).map(normalize);
}

export async function findUserByUsername(username) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('users')
    .select('id, email, username, password, role')
    .eq('username', username)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return normalize(data);
}

export async function updateUserPasswordHashed(id, password) {
  const supabase = getSupabase();
  const hashed = await bcrypt.hash(password, 10);
  // Try with role, fallback without
  let { error } = await supabase.from('users').update({ password: hashed }).eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}

export async function createUser({ email, username, password, role }) {
  const supabase = getSupabase();
  const payload = {
    email,
    username,
    password: password ? await bcrypt.hash(password, 10) : null,
    role: role === 'admin' ? 'admin' : 'user',
  };
  let { data, error } = await supabase
    .from('users')
    .insert(payload)
    .select('id, email, username, role')
    .single();
  if (error && /column\s+"?role"?\s+does not exist/i.test(error.message)) {
    const resp = await supabase
      .from('users')
      .insert({ email, username, password: payload.password })
      .select('id, email, username')
      .single();
    if (resp.error) throw new Error(resp.error.message);
    return normalize({ ...resp.data, role: 'user' });
  }
  if (error) throw new Error(error.message);
  return normalize(data);
}
