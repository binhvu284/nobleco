/**
 * SMS Service Utility
 * 
 * This is a mock implementation for development.
 * In production, replace this with a real SMS service like:
 * - Twilio
 * - AWS SNS
 * - Vonage (Nexmo)
 * - MessageBird
 * etc.
 */

/**
 * Send SMS with OTP code
 * @param {string} phone - Phone number (E.164 format recommended)
 * @param {string} code - OTP code to send
 * @param {string} purpose - 'signup' or 'password_reset'
 */
export async function sendSMS(phone, code, purpose) {
  // Mock implementation - in production, replace with actual SMS service
  const messages = {
    signup: `Your Nobleco verification code is: ${code}. This code will expire in 10 minutes.`,
    password_reset: `Your Nobleco password reset code is: ${code}. This code will expire in 10 minutes.`
  };

  const message = messages[purpose] || `Your Nobleco verification code is: ${code}. This code will expire in 10 minutes.`;

  // Log to console for development (remove in production)
  console.log(`[SMS MOCK] Sending SMS to ${phone}:`);
  console.log(`[SMS MOCK] Message: ${message}`);

  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // In production, implement actual SMS sending here:
  /*
  const twilio = require('twilio');
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  
  try {
    await client.messages.create({
      body: message,
      to: phone,
      from: process.env.TWILIO_PHONE_NUMBER
    });
    return { success: true };
  } catch (error) {
    console.error('SMS sending error:', error);
    throw new Error('Failed to send SMS');
  }
  */

  return { success: true, message: 'SMS sent successfully (mock)' };
}

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 */
export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Phone number is required' };
  }

  // Remove all non-digit characters for validation
  const cleaned = phone.replace(/\D/g, '');

  // Basic validation - at least 10 digits
  if (cleaned.length < 10) {
    return { valid: false, error: 'Phone number must be at least 10 digits' };
  }

  if (cleaned.length > 15) {
    return { valid: false, error: 'Phone number is too long' };
  }

  return { valid: true, cleaned };
}

