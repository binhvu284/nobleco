import nodemailer from 'nodemailer';

/**
 * Email Service Utility
 * 
 * Uses Nodemailer with SMTP to send emails.
 * Configure via environment variables:
 * - EMAIL_HOST: SMTP server host (e.g., smtp.gmail.com)
 * - EMAIL_PORT: SMTP port (e.g., 587 for TLS, 465 for SSL)
 * - EMAIL_SECURE: Use SSL (true/false, default: false for port 587, true for 465)
 * - EMAIL_USER: SMTP username/email
 * - EMAIL_PASS: SMTP password or app password
 * - EMAIL_FROM: From address (e.g., "Nobleco <noreply@nobleco.com>")
 */

/**
 * Create and return a nodemailer transporter
 */
function createTransporter() {
  const host = process.env.EMAIL_HOST?.trim();
  const port = parseInt(process.env.EMAIL_PORT || '587', 10);
  const secure = process.env.EMAIL_SECURE === 'true' || port === 465;
  const user = process.env.EMAIL_USER?.trim();
  // Remove all spaces from app password (Gmail app passwords often have spaces)
  const pass = process.env.EMAIL_PASS?.replace(/\s+/g, '').trim();

  // Check if email configuration is available
  if (!host || !user || !pass) {
    console.warn('[EMAIL] Email configuration missing. Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS environment variables.');
    console.warn(`[EMAIL] Current values: host=${host}, user=${user}, pass=${pass ? '***' + pass.slice(-4) : 'NOT SET'}`);
    return null;
  }

  // Debug logging (mask password for security)
  console.log(`[EMAIL] Configuring SMTP:`);
  console.log(`[EMAIL]   Host: ${host}`);
  console.log(`[EMAIL]   Port: ${port}`);
  console.log(`[EMAIL]   Secure: ${secure}`);
  console.log(`[EMAIL]   User: ${user}`);
  console.log(`[EMAIL]   Password length: ${pass.length} characters`);
  console.log(`[EMAIL]   Password preview: ${pass.substring(0, 4)}...${pass.substring(pass.length - 4)}`);
  
  // Validate password length (Gmail app passwords are exactly 16 characters)
  if (pass.length !== 16) {
    console.error(`[EMAIL] WARNING: App password should be exactly 16 characters, but got ${pass.length} characters`);
    console.error(`[EMAIL] Please verify your EMAIL_PASS in .env file`);
  }

  return nodemailer.createTransport({
    host: host,
    port: port,
    secure: secure, // true for 465, false for other ports
    auth: {
      user: user,
      pass: pass,
    },
    // Gmail requires TLS for port 587
    requireTLS: port === 587,
    tls: {
      // Do not fail on invalid certificates
      rejectUnauthorized: false
    },
    // For Gmail, you must use App Password (not regular password)
    // App passwords are 16 characters without spaces
  });
}

/**
 * Send email with OTP code
 * @param {string} email - Email address
 * @param {string} code - OTP code to send
 * @param {string} purpose - 'signup' or 'password_reset'
 */
export async function sendEmail(email, code, purpose) {
  const messages = {
    signup: {
      subject: 'Your Nobleco Verification Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #007bff; margin-top: 0;">Verify Your Email Address</h2>
            <p>Hello,</p>
            <p>Thank you for signing up with Nobleco. Please use the verification code below to complete your registration:</p>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 30px 0; border-radius: 8px; border: 2px dashed #007bff;">
              ${code}
            </div>
            <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; margin: 0;">This is an automated message from Nobleco. Please do not reply to this email.</p>
          </div>
        </body>
        </html>
      `,
      text: `Hello,\n\nThank you for signing up with Nobleco. Please use the verification code below to complete your registration:\n\n${code}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.\n\n---\nThis is an automated message from Nobleco. Please do not reply to this email.`
    },
    password_reset: {
      subject: 'Your Nobleco Password Reset Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #007bff; margin-top: 0;">Reset Your Password</h2>
            <p>Hello,</p>
            <p>You requested to reset your password for your Nobleco account. Please use the verification code below:</p>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 30px 0; border-radius: 8px; border: 2px dashed #007bff;">
              ${code}
            </div>
            <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">If you didn't request this code, please ignore this email and your password will remain unchanged.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; margin: 0;">This is an automated message from Nobleco. Please do not reply to this email.</p>
          </div>
        </body>
        </html>
      `,
      text: `Hello,\n\nYou requested to reset your password for your Nobleco account. Please use the verification code below:\n\n${code}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email and your password will remain unchanged.\n\n---\nThis is an automated message from Nobleco. Please do not reply to this email.`
    }
  };

  const emailData = messages[purpose] || messages.signup;
  const fromAddress = process.env.EMAIL_FROM || 'Nobleco <noreply@nobleco.com>';

  // Try to create transporter
  const transporter = createTransporter();

  if (!transporter) {
    // Fallback to console log if email is not configured
    console.log(`[EMAIL] Email not configured. Would send to ${email}:`);
    console.log(`[EMAIL] Subject: ${emailData.subject}`);
    console.log(`[EMAIL] Code: ${code}`);
    console.log(`[EMAIL] To enable email sending, set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS environment variables.`);
    return { success: true, message: 'Email sent successfully (mock - email not configured)' };
  }

  try {
    // Verify connection before sending
    console.log('[EMAIL] Verifying SMTP connection...');
    await transporter.verify();
    console.log('[EMAIL] ✓ SMTP connection verified successfully');

    // Send email
    console.log(`[EMAIL] Sending email to ${email}...`);
    const info = await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    });

    console.log(`[EMAIL] ✓ Email sent successfully to ${email}`);
    console.log(`[EMAIL] Message ID: ${info.messageId}`);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[EMAIL] ✗ Error sending email:', error);
    console.error('[EMAIL] Error code:', error.code);
    console.error('[EMAIL] Error response:', error.response);
    
    // Provide helpful error messages
    if (error.code === 'EAUTH') {
      const user = process.env.EMAIL_USER?.trim();
      const passLength = process.env.EMAIL_PASS?.replace(/\s+/g, '').trim().length || 0;
      
      console.error('[EMAIL] Authentication failed. Debug info:');
      console.error(`[EMAIL]   EMAIL_USER: ${user}`);
      console.error(`[EMAIL]   EMAIL_PASS length: ${passLength} characters`);
      console.error(`[EMAIL]   Expected: 16 characters for Gmail App Password`);
      
      throw new Error(`Email authentication failed. Please verify:\n\n` +
        `1. EMAIL_USER is your full Gmail address (e.g., user@gmail.com)\n` +
        `2. EMAIL_PASS is a valid App Password (exactly 16 characters)\n` +
        `3. 2-Step Verification is enabled on your Google account\n` +
        `4. App Password was generated for "Mail" application\n` +
        `5. You copied the App Password correctly (no extra characters)\n\n` +
        `Current password length: ${passLength} characters (should be 16)\n\n` +
        `To generate a new App Password:\n` +
        `- Go to: https://myaccount.google.com/apppasswords\n` +
        `- Select "Mail" → "Other (Custom name)" → Enter "Nobleco"\n` +
        `- Copy the 16-character password (remove spaces)\n\n` +
        `Original error: ${error.message}`);
    } else if (error.code === 'ECONNECTION') {
      throw new Error(`Email connection failed. Please check:\n1. EMAIL_HOST is correct (e.g., smtp.gmail.com)\n2. EMAIL_PORT is correct (587 for TLS, 465 for SSL)\n3. Firewall/network allows SMTP connections\n\nOriginal error: ${error.message}`);
    }
    
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Validate email format
 * @param {string} email - Email address to validate
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email address is required' };
  }

  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email address format' };
  }

  // Check length
  if (email.length > 254) {
    return { valid: false, error: 'Email address is too long' };
  }

  return { valid: true, cleaned: email.toLowerCase().trim() };
}

