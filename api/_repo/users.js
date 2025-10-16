import { getSupabase } from '../_db.js';
import bcrypt from 'bcryptjs';

// Normalize user shape
function normalize(u) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role ?? 'user',
    points: u.points ?? 0,
    level: u.level ?? 'guest',
    status: u.status ?? 'active',
    created_at: u.created_at,
    refer_code: u.refer_code,
    commission: u.commission ?? 0,
    phone: u.phone ?? null,
    address: u.address ?? null,
    password: u.password, // keep internal for auth only; strip before returning to clients
  };
}

export async function listUsers() {
  const supabase = getSupabase();
  let { data, error } = await supabase
    .from('users')
    .select('id, email, name, role, points, level, status, created_at');
  if (error && /column\s+"?role"?\s+does not exist/i.test(error.message)) {
    const resp = await supabase
      .from('users')
      .select('id, email, name, points, level, status, created_at');
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
    .select('id, email, name, password, role')
    .eq('name', username)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return normalize(data);
}

export async function findUserByEmail(email) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, password, role, points, level, status, refer_code, commission, phone, address')
    .eq('email', email)
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

export async function createUser({ email, name, password, role, points, level, status }) {
  const supabase = getSupabase();
  const payload = {
    email,
    name,
    password: password ? await bcrypt.hash(password, 10) : null,
    role: role === 'admin' ? 'admin' : 'user',
    points: points ?? 0,
    level: level ?? 'guest',
    status: status ?? 'active',
  };
  let { data, error } = await supabase
    .from('users')
    .insert(payload)
    .select('id, email, name, role, points, level, status, created_at')
    .single();
  if (error && /column\s+"?role"?\s+does not exist/i.test(error.message)) {
    const resp = await supabase
      .from('users')
      .insert({ email, name, password: payload.password, points: payload.points, level: payload.level, status: payload.status })
      .select('id, email, name, points, level, status, created_at')
      .single();
    if (resp.error) throw new Error(resp.error.message);
    return normalize({ ...resp.data, role: 'user' });
  }
  if (error) throw new Error(error.message);
  return normalize(data);
}

export async function updateUserStatus(id, status) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('users')
    .update({ status })
    .eq('id', id)
    .select('id, email, name, role, points, level, status, created_at')
    .single();
  if (error) throw new Error(error.message);
  return normalize(data);
}

export async function deleteUser(id) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}