import { createOTP, findOTP, verifyOTP, generateOTP, markAllOTPsAsVerified } from './_repo/otps.js';
import { sendSMS, validatePhone } from './_utils/sms.js';
import { sendEmail, validateEmail } from './_utils/email.js';
import { findUserByPhone, findUserByEmail, createUser } from './_repo/users.js';
import { getSupabase } from './_db.js';

export default async function handler(req, res) {
  try {
    const body = req.body || await readBody(req);
    const { action, phone, email, code, purpose } = body;

    if (!action) {
      return res.status(400).json({ error: 'Action is required (send, verify, resend)' });
    }

    // Validate phone or email (at least one must be provided)
    if (phone) {
      const phoneValidation = validatePhone(phone);
      if (!phoneValidation.valid) {
        return res.status(400).json({ error: phoneValidation.error });
      }
    } else if (email) {
      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        return res.status(400).json({ error: emailValidation.error });
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
 * Send OTP to phone number or email
 */
async function handleSendOTP(req, res, body) {
  const { phone, email, purpose, signupData } = body;

  if ((!phone && !email) || !purpose) {
    return res.status(400).json({ error: 'Phone number or email, and purpose are required' });
  }

  if (!['signup', 'password_reset', 'email_change', 'phone_change'].includes(purpose)) {
    return res.status(400).json({ error: 'Invalid purpose. Use: signup, password_reset, email_change, or phone_change' });
  }

  let cleanedPhone = null;
  let cleanedEmail = null;
  let identifier = null; // For finding existing OTPs

  // Validate and clean phone or email
  if (phone) {
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.valid) {
      return res.status(400).json({ error: phoneValidation.error });
    }
    cleanedPhone = phoneValidation.cleaned;
    identifier = cleanedPhone;
  } else if (email) {
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ error: emailValidation.error });
    }
    cleanedEmail = emailValidation.cleaned;
    identifier = cleanedEmail;
  }

  // For password reset, verify phone/email exists
  let userId = null;
  if (purpose === 'password_reset') {
    const user = cleanedPhone 
      ? await findUserByPhone(cleanedPhone)
      : await findUserByEmail(cleanedEmail);
    
    if (!user) {
      // Return error if phone/email doesn't exist
      const notFoundMessage = cleanedPhone
        ? 'Phone number not found in our system. Please check your phone number and try again.'
        : 'Email address not found in our system. Please check your email and try again.';
      return res.status(404).json({ error: notFoundMessage });
    }

    userId = user.id;
  }

  // For signup resend, preserve signup_data if provided or get from existing OTP
  let finalSignupData = signupData;
  if (purpose === 'signup' && !finalSignupData) {
    // Try to get signup_data from existing OTP (for resend)
    const existingOTP = await findOTP(cleanedPhone || null, purpose, false, cleanedEmail || null);
    if (existingOTP && existingOTP.signup_data) {
      finalSignupData = existingOTP.signup_data;
    }
  }

  // Check for recent OTP (rate limiting)
  const recentOTP = await findOTP(cleanedPhone || null, purpose, false, cleanedEmail || null);
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
    phone: cleanedPhone,
    email: cleanedEmail,
    code,
    purpose,
    userId,
    expiresInMinutes: 10,
    signupData: finalSignupData || null
  });

  // Send SMS or Email
  try {
    if (cleanedPhone) {
      await sendSMS(cleanedPhone, code, purpose);
    } else if (cleanedEmail) {
      await sendEmail(cleanedEmail, code, purpose);
    }
  } catch (sendError) {
    console.error(`${cleanedPhone ? 'SMS' : 'Email'} sending error:`, sendError);
    // Still return success to prevent enumeration
    // Log error for admin review
  }

  const successMessage = cleanedPhone
    ? 'OTP code has been sent to your phone number.'
    : 'OTP code has been sent to your email address.';

  return res.status(200).json({
    success: true,
    message: successMessage
  });
}

/**
 * Verify OTP code
 */
async function handleVerifyOTP(req, res, body) {
  const { phone, email, code, purpose } = body;

  if ((!phone && !email) || !code || !purpose) {
    return res.status(400).json({ error: 'Phone number or email, code, and purpose are required' });
  }

  if (!['signup', 'password_reset', 'email_change', 'phone_change'].includes(purpose)) {
    return res.status(400).json({ error: 'Invalid purpose. Use: signup, password_reset, email_change, or phone_change' });
  }

  let cleanedPhone = null;
  let cleanedEmail = null;

  // Validate and clean phone or email
  if (phone) {
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.valid) {
      return res.status(400).json({ error: phoneValidation.error });
    }
    cleanedPhone = phoneValidation.cleaned;
  } else if (email) {
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ error: emailValidation.error });
    }
    cleanedEmail = emailValidation.cleaned;
  }

  // Verify OTP
  const result = await verifyOTP(cleanedPhone, code, purpose, cleanedEmail);

  if (!result.valid) {
    return res.status(400).json({ error: result.error });
  }

  // Mark all other OTPs for this phone/email/purpose as verified (cleanup)
  await markAllOTPsAsVerified(cleanedPhone, purpose, cleanedEmail);

  // For signup, create user account after OTP verification
  if (purpose === 'signup') {
    const supabase = getSupabase();
    
    // Get signup data from OTP record
    const signupData = result.otp.signup_data;
    
    if (!signupData) {
      // Legacy flow: if signup_data doesn't exist, check if user_id exists (old accounts)
      if (result.otp.user_id) {
        // Update existing user's phone_verified status
        await supabase
          .from('users')
          .update({ phone_verified: true })
          .eq('id', result.otp.user_id);
        
        return res.status(200).json({
          success: true,
          verified: true,
          userId: result.otp.user_id,
          message: 'OTP verified successfully'
        });
      } else {
        return res.status(400).json({ error: 'Signup data not found. Please try signing up again.' });
      }
    }

    // Create new user account
    try {
      const newUser = await createUser({
        email: signupData.email,
        name: signupData.name,
        phone: signupData.phone,
        password: signupData.password,
        role: 'user',
        points: 0,
        level: 'guest',
        status: 'active',
        referred_by: signupData.referCode || null,
        phone_verified: true // Already verified via OTP
      });

      // Update OTP record with user_id
      await supabase
        .from('otps')
        .update({ user_id: newUser.id })
        .eq('id', result.otp.id);

      // Return user data (without password)
      const { password: _pw, ...safeUser } = newUser;

      return res.status(200).json({
        success: true,
        verified: true,
        userId: newUser.id,
        user: safeUser,
        message: 'Account created and verified successfully'
      });
    } catch (createError) {
      console.error('Error creating user account:', createError);
      
      // Handle specific database constraint errors
      if (createError.message && createError.message.includes('duplicate key')) {
        if (createError.message.includes('email')) {
          return res.status(409).json({ error: 'Email already registered. Please log in instead.' });
        }
        if (createError.message.includes('phone')) {
          return res.status(409).json({ error: 'Phone number already registered. Please log in instead.' });
        }
        return res.status(409).json({ error: 'Account already exists. Please log in instead.' });
      }
      
      return res.status(500).json({ error: 'Failed to create account. Please try again.' });
    }
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
  const { phone, email, purpose } = body;

  if ((!phone && !email) || !purpose) {
    return res.status(400).json({ error: 'Phone number or email, and purpose are required' });
  }

  let cleanedPhone = null;
  let cleanedEmail = null;

  // Validate and clean phone or email
  if (phone) {
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.valid) {
      return res.status(400).json({ error: phoneValidation.error });
    }
    cleanedPhone = phoneValidation.cleaned;
  } else if (email) {
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ error: emailValidation.error });
    }
    cleanedEmail = emailValidation.cleaned;
  }

  // For signup, preserve signup_data from existing OTP before resending
  if (purpose === 'signup') {
    const existingOTP = await findOTP(cleanedPhone || null, purpose, false, cleanedEmail || null);
    if (existingOTP && existingOTP.signup_data) {
      body.signupData = existingOTP.signup_data;
    }
  }

  // Check for recent OTP (more lenient for resend)
  const recentOTP = await findOTP(cleanedPhone || null, purpose, false, cleanedEmail || null);
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

  // Update body with cleaned phone/email for send handler
  if (cleanedPhone) {
    body.phone = cleanedPhone;
  } else if (cleanedEmail) {
    body.email = cleanedEmail;
  }
  
  // Call send handler (which will use signupData from body if provided)
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

