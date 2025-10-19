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

export async function createUser({ email, name, password, role, points, level, status, referred_by }) {
  const supabase = getSupabase();
  const payload = {
    email,
    name,
    password: password ? await bcrypt.hash(password, 10) : null,
    role: role === 'admin' ? 'admin' : 'user',
    points: points ?? 0,
    level: level ?? 'guest',
    status: status ?? 'active',
    referred_by: referred_by ?? null,
  };
  let { data, error } = await supabase
    .from('users')
    .insert(payload)
    .select('id, email, name, role, points, level, status, created_at, referred_by')
    .single();
  if (error && /column\s+"?role"?\s+does not exist/i.test(error.message)) {
    const resp = await supabase
      .from('users')
      .insert({ 
        email, 
        name, 
        password: payload.password, 
        points: payload.points, 
        level: payload.level, 
        status: payload.status,
        referred_by: payload.referred_by
      })
      .select('id, email, name, points, level, status, created_at, referred_by')
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

export async function getUserHierarchy(userId) {
  const supabase = getSupabase();
  
  // Get user's refer_code to find their referrer
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('refer_code, referred_by')
    .eq('id', userId)
    .single();
  
  if (userError) throw new Error(userError.message);
  
  let superior = null;
  let inferiors = [];
  
  // Find superior (the person who referred this user)
  if (user.referred_by) {
    const { data: superiorData, error: superiorError } = await supabase
      .from('users')
      .select('id, name, email, level, refer_code, created_at')
      .eq('refer_code', user.referred_by)
      .single();
    
    if (!superiorError && superiorData) {
      superior = normalize(superiorData);
    }
  }
  
  // Find direct inferiors (people referred by this user)
  const { data: inferiorsData, error: inferiorsError } = await supabase
    .from('users')
    .select('id, name, email, level, refer_code, created_at, referred_by')
    .eq('referred_by', user.refer_code);
  
  if (!inferiorsError && inferiorsData) {
    inferiors = inferiorsData.map(inferior => {
      const normalized = normalize(inferior);
      // Count how many people this inferior has referred
      return {
        ...normalized,
        inferiors_count: 0 // We'll calculate this separately
      };
    });
    
    // Get inferiors count for each inferior
    for (let i = 0; i < inferiors.length; i++) {
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('referred_by', inferiors[i].refer_code);
      
      inferiors[i].inferiors_count = count || 0;
    }
  }
  
  return { superior, inferiors };
}

export async function getIndirectInferiors(userId) {
  const supabase = getSupabase();
  
  // Get user's refer_code
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('refer_code')
    .eq('id', userId)
    .single();
  
  if (userError) throw new Error(userError.message);
  
  // Get direct inferiors first
  const { data: directInferiors, error: directError } = await supabase
    .from('users')
    .select('id, name, email, level, refer_code, created_at')
    .eq('referred_by', user.refer_code);
  
  if (directError) throw new Error(directError.message);
  
  let indirectInferiors = [];
  
  // For each direct inferior, get their inferiors (indirect inferiors)
  for (const directInferior of directInferiors || []) {
    const { data: indirectData, error: indirectError } = await supabase
      .from('users')
      .select('id, name, email, level, refer_code, created_at')
      .eq('referred_by', directInferior.refer_code);
    
    if (!indirectError && indirectData) {
      indirectInferiors = indirectInferiors.concat(indirectData.map(normalize));
    }
  }
  
  return indirectInferiors;
}

export async function calculateCommissions(userId) {
  const supabase = getSupabase();
  
  // Get user's refer_code
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('refer_code')
    .eq('id', userId)
    .single();
  
  if (userError) throw new Error(userError.message);
  
  // Calculate direct commission (from direct inferiors)
  const { data: directInferiors, error: directError } = await supabase
    .from('users')
    .select('commission')
    .eq('referred_by', user.refer_code);
  
  if (directError) throw new Error(directError.message);
  
  const directCommission = (directInferiors || []).reduce((sum, inferior) => sum + (inferior.commission || 0), 0);
  
  // Calculate indirect commission (from indirect inferiors)
  let indirectCommission = 0;
  for (const directInferior of directInferiors || []) {
    const { data: indirectData, error: indirectError } = await supabase
      .from('users')
      .select('commission')
      .eq('referred_by', directInferior.refer_code);
    
    if (!indirectError && indirectData) {
      indirectCommission += (indirectData || []).reduce((sum, inferior) => sum + (inferior.commission || 0), 0);
    }
  }
  
  return {
    direct_commission: directCommission,
    indirect_commission: indirectCommission,
    total_commission: directCommission + indirectCommission
  };
}