import { createUser, findUserByEmail } from '../_repo/users.js';
import { getSupabase } from '../_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = req.body || await readBody(req);
    const { email, name, password, referCode } = body;

    // Validate required fields
    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, name, and password are required' });
    }

    // Check if email already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // If refer code is provided, validate it exists
    let referredById = null;
    if (referCode && referCode.trim()) {
      const supabase = getSupabase();
      const { data: referrer, error: referError } = await supabase
        .from('users')
        .select('id')
        .eq('refer_code', referCode.trim().toUpperCase())
        .maybeSingle();
      
      if (referError) {
        return res.status(500).json({ error: 'Failed to validate refer code' });
      }
      
      if (!referrer) {
        return res.status(400).json({ error: 'Invalid refer code' });
      }
      
      referredById = referrer.id;
    }

    // Create the new user
    const newUser = await createUser({
      email,
      name,
      password,
      role: 'user',
      points: 0,
      level: 'guest',
      status: 'active',
    });

    // If there's a valid referrer, we can store the relationship in users_info or a separate table
    // For now, we'll just acknowledge it was successful
    // TODO: Implement referral relationship logic later

    // Return user data (without password)
    const { password: _pw, ...safeUser } = newUser;
    return res.status(201).json({
      success: true,
      user: safeUser,
      message: referredById 
        ? 'Account created successfully with referral code' 
        : 'Account created successfully',
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: 'Failed to create account' });
  }
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); }
      catch { resolve(null); }
    });
  });
}

