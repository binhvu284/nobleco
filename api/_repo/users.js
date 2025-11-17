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
    referred_by: u.referred_by ?? null,
    password: u.password, // keep internal for auth only; strip before returning to clients
  };
}

export async function listUsers() {
  const supabase = getSupabase();
  let { data, error } = await supabase
    .from('users')
    .select('id, email, name, role, points, level, status, created_at, refer_code, commission, phone, address, location, country, state, referred_by')
    .eq('role', 'user'); // Only fetch users with 'user' role
  if (error && /column\s+"?role"?\s+does not exist/i.test(error.message)) {
    // If role column doesn't exist, fetch all users and filter manually
    const resp = await supabase
      .from('users')
      .select('id, email, name, points, level, status, created_at, refer_code, commission, phone, address, location, country, state, referred_by');
    if (resp.error) throw new Error(resp.error.message);
    return (resp.data || []).map((u) => normalize({ ...u, role: 'user' }));
  }
  if (error) throw new Error(error.message);
  return (data || []).map(normalize);
}

export async function listAdminUsers() {
  const supabase = getSupabase();
  let { data, error } = await supabase
    .from('users')
    .select('id, email, name, role, points, level, status, created_at, refer_code, commission, phone, address, location, country, state, referred_by')
    .eq('role', 'admin'); // Only fetch users with 'admin' role
  if (error && /column\s+"?role"?\s+does not exist/i.test(error.message)) {
    // If role column doesn't exist, return empty array (no admin users)
    return [];
  }
  if (error) throw new Error(error.message);
  return (data || []).map(normalize);
}

export async function listCoworkers() {
  const supabase = getSupabase();
  let { data, error } = await supabase
    .from('users')
    .select('id, email, name, role, points, level, status, created_at, refer_code, commission, phone, address, location, country, state, referred_by')
    .eq('role', 'coworker'); // Only fetch users with 'coworker' role
  if (error && /column\s+"?role"?\s+does not exist/i.test(error.message)) {
    // If role column doesn't exist, return empty array (no coworker users)
    return [];
  }
  if (error) throw new Error(error.message);
  return (data || []).map(user => ({
    ...normalize(user),
    permissions: ['products', 'category', 'withdraw_request'] // Default permissions for coworkers
  }));
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

export async function findUserByPhone(phone) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, password, role, points, level, status, refer_code, commission, phone, address')
    .eq('phone', phone)
    .maybeSingle();
  
  if (error) throw new Error(error.message);
  return normalize(data);
}

// Find user by email or phone
export async function findUserByEmailOrPhone(identifier) {
  // Try email first
  let user = await findUserByEmail(identifier);
  if (user) return user;
  
  // Try phone if email didn't work
  user = await findUserByPhone(identifier);
  return user;
}

export async function updateUserPasswordHashed(id, password) {
  const supabase = getSupabase();
  const hashed = await bcrypt.hash(password, 10);
  // Try with role, fallback without
  let { error } = await supabase.from('users').update({ password: hashed }).eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}

export async function createUser({ email, name, phone, password, role, points, level, status, referred_by, phone_verified }) {
  const supabase = getSupabase();
  const payload = {
    email,
    name,
    phone,
    password: password ? await bcrypt.hash(password, 10) : null,
    role: role === 'admin' ? 'admin' : 'user',
    points: points ?? 0,
    level: level ?? 'guest',
    status: status ?? 'active',
    referred_by: referred_by ?? null,
    phone_verified: phone_verified ?? false,
  };
  let { data, error } = await supabase
    .from('users')
    .insert(payload)
    .select('id, email, name, role, points, level, status, created_at, referred_by, phone, phone_verified')
    .single();
  if (error && /column\s+"?role"?\s+does not exist/i.test(error.message)) {
    const resp = await supabase
      .from('users')
      .insert({ 
        email, 
        name,
        phone,
        password: payload.password, 
        points: payload.points, 
        level: payload.level, 
        status: payload.status,
        referred_by: payload.referred_by,
        phone_verified: payload.phone_verified
      })
      .select('id, email, name, points, level, status, created_at, referred_by, phone, phone_verified')
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
    .in('role', ['user', 'coworker']) // Allow updating users and coworkers
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
    .eq('id', id)
    .eq('role', 'user'); // Only allow deleting users with 'user' role
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
      
      // Fetch avatar URL for superior
      try {
        const { getUserAvatar } = await import('./userAvatars.js');
        const avatar = await getUserAvatar(superior.id);
        if (avatar?.url) {
          superior.avatar = avatar.url;
        }
      } catch (error) {
        console.warn('Could not fetch superior avatar:', error);
      }
    }
  }
  
  // Find direct inferiors (people referred by this user) with optimized query
  const { data: inferiorsData, error: inferiorsError } = await supabase
    .from('users')
    .select('id, name, email, level, refer_code, created_at, referred_by, commission')
    .eq('referred_by', user.refer_code);
  
  if (!inferiorsError && inferiorsData) {
    // Get all refer_codes of direct inferiors for batch counting
    const referCodes = inferiorsData.map(inf => inf.refer_code).filter(Boolean);
    
    // Batch query to get inferiors count for all direct inferiors at once
    let inferiorsCountMap = {};
    if (referCodes.length > 0) {
      const { data: countData, error: countError } = await supabase
        .from('users')
        .select('referred_by')
        .in('referred_by', referCodes);
      
      if (!countError && countData) {
        // Count inferiors for each refer_code
        countData.forEach(item => {
          inferiorsCountMap[item.referred_by] = (inferiorsCountMap[item.referred_by] || 0) + 1;
        });
      }
    }
    
    inferiors = inferiorsData.map(inferior => {
      const normalized = normalize(inferior);
      return {
        ...normalized,
        inferiors_count: inferiorsCountMap[inferior.refer_code] || 0
      };
    });
    
    // Fetch avatar URLs for all inferiors
    try {
      const { getUserAvatar } = await import('./userAvatars.js');
      const avatarPromises = inferiors.map(async (inferior) => {
        try {
          const avatar = await getUserAvatar(inferior.id);
          if (avatar?.url) {
            return { ...inferior, avatar: avatar.url };
          }
        } catch (error) {
          console.warn(`Could not fetch avatar for user ${inferior.id}:`, error);
        }
        return inferior;
      });
      inferiors = await Promise.all(avatarPromises);
    } catch (error) {
      console.warn('Could not fetch avatars for inferiors:', error);
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
      const normalizedIndirect = indirectData.map(normalize);
      
      // Fetch avatar URLs for indirect inferiors
      try {
        const { getUserAvatar } = await import('./userAvatars.js');
        const avatarPromises = normalizedIndirect.map(async (indirect) => {
          try {
            const avatar = await getUserAvatar(indirect.id);
            if (avatar?.url) {
              return { ...indirect, avatar: avatar.url };
            }
          } catch (error) {
            console.warn(`Could not fetch avatar for user ${indirect.id}:`, error);
          }
          return indirect;
        });
        const indirectWithAvatars = await Promise.all(avatarPromises);
        indirectInferiors = indirectInferiors.concat(indirectWithAvatars);
      } catch (error) {
        console.warn('Could not fetch avatars for indirect inferiors:', error);
        indirectInferiors = indirectInferiors.concat(normalizedIndirect);
      }
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

export async function removeInferior(inferiorId) {
  const supabase = getSupabase();
  
  // Update the inferior's referred_by field to null to remove the relationship
  const { data, error } = await supabase
    .from('users')
    .update({ referred_by: null })
    .eq('id', inferiorId)
    .select('id, name, email')
    .single();
  
  if (error) throw new Error(error.message);
  
  return data;
}