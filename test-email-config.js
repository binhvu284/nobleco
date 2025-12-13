/**
 * Test Email Configuration Script
 * 
 * Run this to verify your email configuration:
 * node test-email-config.js
 */

import 'dotenv/config';
import nodemailer from 'nodemailer';

const host = process.env.EMAIL_HOST?.trim();
const port = parseInt(process.env.EMAIL_PORT || '587', 10);
const secure = process.env.EMAIL_SECURE === 'true' || port === 465;
const user = process.env.EMAIL_USER?.trim();
const pass = process.env.EMAIL_PASS?.replace(/\s+/g, '').trim();

console.log('='.repeat(60));
console.log('Email Configuration Test');
console.log('='.repeat(60));
console.log();

// Check configuration
console.log('Configuration:');
console.log(`  EMAIL_HOST: ${host || 'NOT SET'}`);
console.log(`  EMAIL_PORT: ${port}`);
console.log(`  EMAIL_SECURE: ${secure}`);
console.log(`  EMAIL_USER: ${user || 'NOT SET'}`);
console.log(`  EMAIL_PASS: ${pass ? `${pass.substring(0, 4)}...${pass.substring(pass.length - 4)} (${pass.length} chars)` : 'NOT SET'}`);
console.log();

if (!host || !user || !pass) {
  console.error('❌ Missing required environment variables!');
  console.error('Please set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in your .env file');
  process.exit(1);
}

if (pass.length !== 16) {
  console.warn(`⚠️  WARNING: App password should be exactly 16 characters, but got ${pass.length} characters`);
  console.warn('For Gmail, you must use an App Password (not your regular password)');
  console.warn('Generate one at: https://myaccount.google.com/apppasswords');
  console.log();
}

// Create transporter
console.log('Creating SMTP transporter...');
const transporter = nodemailer.createTransport({
  host: host,
  port: port,
  secure: secure,
  auth: {
    user: user,
    pass: pass,
  },
  requireTLS: port === 587,
  tls: {
    rejectUnauthorized: false
  }
});

// Test connection
console.log('Testing SMTP connection...');
try {
  await transporter.verify();
  console.log('✅ SMTP connection verified successfully!');
  console.log();
  console.log('Your email configuration is correct.');
  console.log('You can now use email OTP in your application.');
} catch (error) {
  console.error('❌ SMTP connection failed!');
  console.error();
  console.error('Error details:');
  console.error(`  Code: ${error.code}`);
  console.error(`  Message: ${error.message}`);
  console.error();
  
  if (error.code === 'EAUTH') {
    console.error('Authentication failed. Common issues:');
    console.error('  1. Using regular password instead of App Password');
    console.error('  2. App Password is incorrect or expired');
    console.error('  3. 2-Step Verification is not enabled');
    console.error('  4. Email address is incorrect');
    console.error();
    console.error('To fix:');
    console.error('  1. Go to: https://myaccount.google.com/apppasswords');
    console.error('  2. Generate a new App Password for "Mail"');
    console.error('  3. Copy the 16-character password (remove spaces)');
    console.error('  4. Update EMAIL_PASS in your .env file');
    console.error('  5. Restart your server');
  } else if (error.code === 'ECONNECTION') {
    console.error('Connection failed. Common issues:');
    console.error('  1. EMAIL_HOST is incorrect');
    console.error('  2. EMAIL_PORT is incorrect');
    console.error('  3. Firewall blocking SMTP port');
    console.error('  4. Network connectivity issues');
  }
  
  process.exit(1);
}

