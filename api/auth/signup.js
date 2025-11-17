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

    // Check for recent OTP (rate limiting)
    const { findOTP } = await import('../_repo/otps.js');
    const recentOTP = await findOTP(cleanedPhone, 'signup', false);
    if (recentOTP) {
      const now = new Date();
      const createdAt = new Date(recentOTP.created_at);
      const secondsSinceCreation = (now - createdAt) / 1000;

      if (secondsSinceCreation < 60) {
        return res.status(429).json({ 
          error: 'Please wait before requesting a new code. You can request again in ' + 
                 Math.ceil(60 - secondsSinceCreation) + ' seconds.' 
        });
      }
    }

    // Store signup data in OTP record (account will be created after OTP verification)
    const signupData = {
      email,
      name,
      phone: cleanedPhone,
      password, // Will be hashed when account is created
      referCode: validReferCode
    };

    // Generate and send OTP (without creating user account)
    const otpCode = generateOTP();
    await createOTP({
      phone: cleanedPhone,
      code: otpCode,
      purpose: 'signup',
      userId: null, // No user ID yet - account not created
      expiresInMinutes: 10,
      signupData: signupData // Store signup data in OTP record
    });

    // Send SMS
    try {
      await sendSMS(cleanedPhone, otpCode, 'signup');
    } catch (smsError) {
      console.error('SMS sending error:', smsError);
      // Continue even if SMS fails - user can request resend
    }

    return res.status(200).json({
      success: true,
      requiresVerification: true,
      phone: cleanedPhone,
      message: 'Please verify your phone number with the OTP code sent to your phone.'
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

