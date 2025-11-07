import { createUser, findUserByEmail } from '../_repo/users.js';
import { getSupabase } from '../_db.js';
import { createOTP, generateOTP } from '../_repo/otps.js';
import { sendSMS, validatePhone } from '../_utils/sms.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = req.body || await readBody(req);
    const { email, name, phone, password, referCode } = body;

    // Validate required fields
    if (!email || !name || !phone || !password) {
      return res.status(400).json({ error: 'Email, name, phone number, and password are required' });
    }

    // Validate phone number
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.valid) {
      return res.status(400).json({ error: phoneValidation.error });
    }

    const cleanedPhone = phoneValidation.cleaned;

    // Check if email already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Check if phone already exists
    const supabase = getSupabase();
    const { data: existingPhoneUser } = await supabase
      .from('users')
      .select('id')
      .eq('phone', cleanedPhone)
      .maybeSingle();
    
    if (existingPhoneUser) {
      return res.status(409).json({ error: 'Phone number already registered' });
    }

    // Note: We don't check for duplicate names because multiple users can have the same name

    // If refer code is provided, validate it exists
    let validReferCode = null;
    let referrerName = null;
    if (referCode && referCode.trim()) {
      const normalizedCode = referCode.trim().toUpperCase();
      const { data: referrer, error: referError } = await supabase
        .from('users')
        .select('refer_code, name')
        .eq('refer_code', normalizedCode)
        .maybeSingle();
      
      if (referError) {
        return res.status(500).json({ error: 'Failed to validate refer code' });
      }
      
      if (!referrer) {
        return res.status(400).json({ error: 'Invalid refer code' });
      }
      
      validReferCode = referrer.refer_code;
      referrerName = referrer.name;
    }

    // Create the new user with phone_verified = false
    const newUser = await createUser({
      email,
      name,
      phone: cleanedPhone,
      password,
      role: 'user',
      points: 0,
      level: 'guest',
      status: 'active',
      referred_by: validReferCode,
      phone_verified: false, // User needs to verify phone
    });

    // Generate and send OTP
    const otpCode = generateOTP();
    await createOTP({
      phone: cleanedPhone,
      code: otpCode,
      purpose: 'signup',
      userId: newUser.id,
      expiresInMinutes: 10
    });

    // Send SMS
    try {
      await sendSMS(cleanedPhone, otpCode, 'signup');
    } catch (smsError) {
      console.error('SMS sending error:', smsError);
      // Continue even if SMS fails - user can request resend
    }

    // Return user data (without password) with verification flag
    const { password: _pw, ...safeUser } = newUser;

    return res.status(201).json({
      success: true,
      user: safeUser,
      requiresVerification: true,
      phone: cleanedPhone,
      message: 'Account created. Please verify your phone number with the OTP code sent to your phone.'
    });
  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle specific database constraint errors
    if (error.message && error.message.includes('users_name_key')) {
      return res.status(500).json({ 
        error: 'Database configuration error: Name uniqueness constraint should not exist. Please run the migration to remove it.' 
      });
    }
    
    if (error.message && error.message.includes('duplicate key')) {
      // Generic duplicate key error
      if (error.message.includes('email')) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      if (error.message.includes('phone')) {
        return res.status(409).json({ error: 'Phone number already registered' });
      }
      return res.status(409).json({ error: 'A user with this information already exists' });
    }
    
    return res.status(500).json({ error: error.message || 'Failed to create account' });
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

