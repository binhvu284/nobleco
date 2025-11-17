import bcrypt from 'bcryptjs';
import { findUserByPhone, updateUserPasswordHashed } from '../_repo/users.js';
import { verifyOTP } from '../_repo/otps.js';
import { getSupabase } from '../_db.js';
import { validatePhone } from '../_utils/sms.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).end('Method Not Allowed');
    }

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Check if body is already parsed (Express) or needs to be read
    const body = req.body || await readBody(req);
    let { phone, newPassword, otpCode } = body;

    if (!phone || !newPassword || !otpCode) {
      return res.status(400).json({ error: 'Phone number, OTP code, and new password are required' });
    }

    // Validate and clean phone number
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.valid) {
      return res.status(400).json({ error: phoneValidation.error });
    }
    phone = phoneValidation.cleaned;

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if OTP was verified recently (within last 10 minutes)
    // The OTP should have been verified in the previous step
    const supabase = getSupabase();
    const now = new Date().toISOString();
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    // Check for verified OTP with matching code that hasn't expired
    const { data: verifiedOTP, error: findError } = await supabase
      .from('otps')
      .select('*')
      .eq('phone', phone)
      .eq('purpose', 'password_reset')
      .eq('code', otpCode)
      .eq('verified', true)
      .gte('created_at', tenMinutesAgo)
      .gt('expires_at', now) // OTP must not be expired
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (findError) {
      console.error('Error finding verified OTP:', findError);
      return res.status(500).json({ error: 'Failed to verify OTP. Please try again.' });
    }
    
    if (!verifiedOTP) {
      // If not found as verified, try to verify it now (in case user skipped verification step)
      const otpResult = await verifyOTP(phone, otpCode, 'password_reset');
      if (!otpResult.valid) {
        return res.status(400).json({ error: otpResult.error || 'Invalid or expired OTP code. Please verify OTP again.' });
      }
    }

    // Find user by phone
    const user = await findUserByPhone(phone);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update password
    await updateUserPasswordHashed(user.id, newPassword);

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (e) {
    console.error('Reset password error:', e);
    console.error('Error stack:', e.stack);
    return res.status(500).json({ error: e.message || 'Internal server error' });
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

