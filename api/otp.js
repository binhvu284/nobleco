import { createOTP, findOTP, verifyOTP, generateOTP, markAllOTPsAsVerified } from './_repo/otps.js';
import { sendSMS, validatePhone } from './_utils/sms.js';
import { findUserByEmail } from './_repo/users.js';
import { getSupabase } from './_db.js';

export default async function handler(req, res) {
  try {
    const body = req.body || await readBody(req);
    const { action, phone, code, purpose, email } = body;

    if (!action) {
      return res.status(400).json({ error: 'Action is required (send, verify, resend)' });
    }

    // Validate phone number
    if (phone) {
      const phoneValidation = validatePhone(phone);
      if (!phoneValidation.valid) {
        return res.status(400).json({ error: phoneValidation.error });
      }
    }

    switch (action) {
      case 'send':
        return await handleSendOTP(req, res, body);
      case 'verify':
        return await handleVerifyOTP(req, res, body);
      case 'resend':
        return await handleResendOTP(req, res, body);
      default:
        return res.status(400).json({ error: 'Invalid action. Use: send, verify, or resend' });
    }
  } catch (error) {
    console.error('OTP API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

/**
 * Send OTP to phone number
 */
async function handleSendOTP(req, res, body) {
  const { phone, purpose, email } = body;

  if (!phone || !purpose) {
    return res.status(400).json({ error: 'Phone number and purpose are required' });
  }

  if (!['signup', 'password_reset'].includes(purpose)) {
    return res.status(400).json({ error: 'Invalid purpose. Use: signup or password_reset' });
  }

  // For password reset, verify email exists
  let userId = null;
  if (purpose === 'password_reset') {
    if (!email) {
      return res.status(400).json({ error: 'Email is required for password reset' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists for security
      return res.status(200).json({ 
        success: true, 
        message: 'If the phone number is registered, an OTP code has been sent.' 
      });
    }

    // Verify phone matches user's phone
    if (user.phone !== phone) {
      // Don't reveal if phone exists for security
      return res.status(200).json({ 
        success: true, 
        message: 'If the phone number is registered, an OTP code has been sent.' 
      });
    }

    userId = user.id;
  }

  // Check for recent OTP (rate limiting)
  const recentOTP = await findOTP(phone, purpose, false);
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

  // Generate OTP
  const code = generateOTP();

  // Create OTP record
  await createOTP({
    phone,
    code,
    purpose,
    userId,
    expiresInMinutes: 10
  });

  // Send SMS
  try {
    await sendSMS(phone, code, purpose);
  } catch (smsError) {
    console.error('SMS sending error:', smsError);
    // Still return success to prevent phone number enumeration
    // Log error for admin review
  }

  return res.status(200).json({
    success: true,
    message: 'OTP code has been sent to your phone number.'
  });
}

/**
 * Verify OTP code
 */
async function handleVerifyOTP(req, res, body) {
  const { phone, code, purpose } = body;

  if (!phone || !code || !purpose) {
    return res.status(400).json({ error: 'Phone number, code, and purpose are required' });
  }

  if (!['signup', 'password_reset'].includes(purpose)) {
    return res.status(400).json({ error: 'Invalid purpose. Use: signup or password_reset' });
  }

  // Verify OTP
  const result = await verifyOTP(phone, code, purpose);

  if (!result.valid) {
    return res.status(400).json({ error: result.error });
  }

  // Mark all other OTPs for this phone/purpose as verified (cleanup)
  await markAllOTPsAsVerified(phone, purpose);

  // For signup, update user phone_verified status
  if (purpose === 'signup' && result.otp.user_id) {
    const supabase = getSupabase();
    await supabase
      .from('users')
      .update({ phone_verified: true })
      .eq('id', result.otp.user_id);
  }

  return res.status(200).json({
    success: true,
    verified: true,
    message: 'OTP verified successfully'
  });
}

/**
 * Resend OTP code
 */
async function handleResendOTP(req, res, body) {
  // Same as send, but with different rate limiting
  const { phone, purpose, email } = body;

  if (!phone || !purpose) {
    return res.status(400).json({ error: 'Phone number and purpose are required' });
  }

  // Check for recent OTP (more lenient for resend)
  const recentOTP = await findOTP(phone, purpose, false);
  if (recentOTP) {
    const now = new Date();
    const createdAt = new Date(recentOTP.created_at);
    const secondsSinceCreation = (now - createdAt) / 1000;

    if (secondsSinceCreation < 30) {
      return res.status(429).json({ 
        error: 'Please wait before requesting a new code. You can request again in ' + 
               Math.ceil(30 - secondsSinceCreation) + ' seconds.' 
      });
    }
  }

  // Call send handler
  return await handleSendOTP(req, res, body);
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

