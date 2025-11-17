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
 * @param {string} params.phone - Phone number
 * @param {string} params.code - OTP code
 * @param {string} params.purpose - 'signup' or 'password_reset'
 * @param {number} [params.userId] - User ID (for password reset)
 * @param {number} [params.expiresInMinutes] - Expiration time in minutes (default: 10)
 * @param {Object} [params.signupData] - Signup data to store (for signup purpose)
 */
export async function createOTP({ phone, code, purpose, userId = null, expiresInMinutes = 10, signupData = null }) {
  const supabase = getSupabase();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

  const insertData = {
    phone,
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
 * Find a valid OTP by phone and purpose
 * @param {string} phone - Phone number
 * @param {string} purpose - 'signup' or 'password_reset'
 * @param {boolean} verified - Whether to include verified OTPs
 */
export async function findOTP(phone, purpose, verified = false) {
  const supabase = getSupabase();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('otps')
    .select('*')
    .eq('phone', phone)
    .eq('purpose', purpose)
    .eq('verified', verified)
    .gt('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Verify an OTP code
 * @param {string} phone - Phone number
 * @param {string} code - OTP code to verify
 * @param {string} purpose - 'signup' or 'password_reset'
 */
export async function verifyOTP(phone, code, purpose) {
  const supabase = getSupabase();
  const now = new Date().toISOString();

  // Find the most recent unverified OTP
  const { data: otp, error: findError } = await supabase
    .from('otps')
    .select('*')
    .eq('phone', phone)
    .eq('purpose', purpose)
    .eq('verified', false)
    .gt('expires_at', now)
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
 * Mark all OTPs for a phone/purpose as verified (cleanup)
 */
export async function markAllOTPsAsVerified(phone, purpose) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('otps')
    .update({ verified: true })
    .eq('phone', phone)
    .eq('purpose', purpose)
    .eq('verified', false);

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

