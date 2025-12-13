import { getSupabase } from '../_db.js';

/**
 * Generate a random 4-digit OTP code
 */
export function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Create a new OTP record
 * @param {Object} params
 * @param {string} [params.phone] - Phone number (required if email not provided)
 * @param {string} [params.email] - Email address (required if phone not provided)
 * @param {string} params.code - OTP code
 * @param {string} params.purpose - 'signup' or 'password_reset'
 * @param {number} [params.userId] - User ID (for password reset)
 * @param {number} [params.expiresInMinutes] - Expiration time in minutes (default: 10)
 * @param {Object} [params.signupData] - Signup data to store (for signup purpose)
 */
export async function createOTP({ phone, email, code, purpose, userId = null, expiresInMinutes = 10, signupData = null }) {
  if (!phone && !email) {
    throw new Error('Either phone or email must be provided');
  }
  if (phone && email) {
    throw new Error('Cannot provide both phone and email. Use one or the other.');
  }

  const supabase = getSupabase();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

  const insertData = {
    phone: phone || null,
    email: email || null,
    code,
    purpose,
    user_id: userId,
    expires_at: expiresAt.toISOString(),
    verified: false,
    attempts: 0
  };

  // Add signup_data if provided (for signup flow)
  if (signupData) {
    insertData.signup_data = signupData;
  }

  const { data, error } = await supabase
    .from('otps')
    .insert(insertData)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Find a valid OTP by phone/email and purpose
 * @param {string} phone - Phone number (if using phone)
 * @param {string} email - Email address (if using email)
 * @param {string} purpose - 'signup' or 'password_reset'
 * @param {boolean} verified - Whether to include verified OTPs
 */
export async function findOTP(phone, purpose, verified = false, email = null) {
  const supabase = getSupabase();
  const now = new Date().toISOString();

  let query = supabase
    .from('otps')
    .select('*')
    .eq('purpose', purpose)
    .eq('verified', verified)
    .gt('expires_at', now);

  // Use phone if provided, otherwise use email
  if (phone) {
    query = query.eq('phone', phone);
  } else if (email) {
    query = query.eq('email', email);
  } else {
    throw new Error('Either phone or email must be provided');
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Verify an OTP code
 * @param {string} phone - Phone number (if using phone)
 * @param {string} code - OTP code to verify
 * @param {string} purpose - 'signup' or 'password_reset'
 * @param {string} email - Email address (if using email)
 */
export async function verifyOTP(phone, code, purpose, email = null) {
  const supabase = getSupabase();
  const now = new Date().toISOString();

  // Build query based on phone or email
  let query = supabase
    .from('otps')
    .select('*')
    .eq('purpose', purpose)
    .eq('verified', false)
    .gt('expires_at', now);

  if (phone) {
    query = query.eq('phone', phone);
  } else if (email) {
    query = query.eq('email', email);
  } else {
    throw new Error('Either phone or email must be provided');
  }

  // Find the most recent unverified OTP
  const { data: otp, error: findError } = await query
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (findError) throw new Error(findError.message);

  if (!otp) {
    return { valid: false, error: 'No valid OTP found. Please request a new code.' };
  }

  // Increment attempts
  const { error: updateError } = await supabase
    .from('otps')
    .update({ attempts: otp.attempts + 1 })
    .eq('id', otp.id);

  if (updateError) throw new Error(updateError.message);

  // Check if too many attempts
  if (otp.attempts >= 5) {
    return { valid: false, error: 'Too many failed attempts. Please request a new code.' };
  }

  // Verify code
  if (otp.code !== code) {
    return { valid: false, error: 'Invalid OTP code. Please try again.' };
  }

  // Mark as verified
  const { error: verifyError } = await supabase
    .from('otps')
    .update({ verified: true })
    .eq('id', otp.id);

  if (verifyError) throw new Error(verifyError.message);

  return { valid: true, otp };
}

/**
 * Mark all OTPs for a phone/email/purpose as verified (cleanup)
 * @param {string} phone - Phone number (if using phone)
 * @param {string} purpose - Purpose
 * @param {string} email - Email address (if using email)
 */
export async function markAllOTPsAsVerified(phone, purpose, email = null) {
  const supabase = getSupabase();
  
  let query = supabase
    .from('otps')
    .update({ verified: true })
    .eq('purpose', purpose)
    .eq('verified', false);

  if (phone) {
    query = query.eq('phone', phone);
  } else if (email) {
    query = query.eq('email', email);
  } else {
    throw new Error('Either phone or email must be provided');
  }

  const { error } = await query;

  if (error) throw new Error(error.message);
  return true;
}

/**
 * Clean up expired OTPs (can be called periodically)
 */
export async function cleanupExpiredOTPs() {
  const supabase = getSupabase();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('otps')
    .delete()
    .lt('expires_at', now);

  if (error) throw new Error(error.message);
  return true;
}

