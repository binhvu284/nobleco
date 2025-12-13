# Vercel Email OTP Setup Guide

This guide explains how to configure email OTP authentication for your Nobleco application deployed on Vercel.

## Required Environment Variables

Add the following environment variables in your Vercel project settings:

### Step 1: Go to Vercel Dashboard

1. Navigate to your project on Vercel: https://vercel.com/dashboard
2. Click on your **Nobleco** project
3. Go to **Settings** → **Environment Variables**

### Step 2: Add Email Configuration Variables

Add these environment variables for **Production**, **Preview**, and **Development** environments:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
EMAIL_FROM=Nobleco <your-email@gmail.com>
```

### Step 3: Get Gmail App Password

1. **Enable 2-Step Verification** on your Google account:
   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification" if not already enabled

2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Or: Google Account → Security → 2-Step Verification → App passwords
   - Click **"Select app"** → Choose **"Mail"**
   - Click **"Select device"** → Choose **"Other (Custom name)"**
   - Enter name: **"Nobleco Vercel"**
   - Click **"Generate"**
   - Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)

3. **Add to Vercel**:
   - In Vercel Environment Variables, set `EMAIL_PASS` to the 16-character password
   - **Remove all spaces** from the password (e.g., `abcdefghijklmnop`)

### Step 4: Configure Other Variables

- **EMAIL_HOST**: `smtp.gmail.com` (for Gmail)
- **EMAIL_PORT**: `587` (for TLS) or `465` (for SSL)
- **EMAIL_SECURE**: `false` (for port 587) or `true` (for port 465)
- **EMAIL_USER**: Your full Gmail address (e.g., `user@gmail.com`)
- **EMAIL_FROM**: Display name and email (e.g., `Nobleco <user@gmail.com>`)

## Alternative Email Providers

### Using Outlook/Hotmail

```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Nobleco <your-email@outlook.com>
```

### Using SendGrid (Recommended for Production)

1. Sign up at: https://sendgrid.com
2. Create an API key
3. Configure:

```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
EMAIL_FROM=Nobleco <noreply@yourdomain.com>
```

### Using Mailgun

```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=postmaster@yourdomain.mailgun.org
EMAIL_PASS=your-mailgun-password
EMAIL_FROM=Nobleco <noreply@yourdomain.com>
```

## Important Notes

### Security

1. **Never commit `.env` file** to Git
2. **App Passwords are sensitive** - treat them like regular passwords
3. **Rotate App Passwords** periodically for security
4. **Use different App Passwords** for development and production

### Vercel-Specific Considerations

1. **Environment Variables are encrypted** at rest
2. **Redeploy after adding variables** - Changes take effect on next deployment
3. **Check logs** in Vercel Dashboard → Deployments → Function Logs if emails fail

### Testing

After deploying to Vercel:

1. Test email OTP signup flow
2. Check Vercel function logs for email sending status
3. Verify emails arrive in inbox (check spam folder too)

### Troubleshooting

If emails don't send on Vercel:

1. **Check Environment Variables**:
   - Go to Vercel → Settings → Environment Variables
   - Verify all EMAIL_* variables are set correctly
   - Make sure they're enabled for the correct environment (Production/Preview)

2. **Check Function Logs**:
   - Go to Vercel → Deployments → Click on latest deployment
   - Go to "Functions" tab
   - Look for email-related errors

3. **Verify App Password**:
   - Make sure App Password is exactly 16 characters
   - No spaces in EMAIL_PASS variable
   - App Password hasn't been revoked

4. **Check Gmail Security**:
   - Ensure 2-Step Verification is enabled
   - Verify App Password is for "Mail" application
   - Check if Google blocked the login attempt (check email)

5. **Redeploy**:
   - After changing environment variables, redeploy your application
   - Or trigger a new deployment manually

### Common Errors

**Error: "Invalid login: 535-5.7.8 Username and Password not accepted"**
- Solution: Verify EMAIL_USER and EMAIL_PASS are correct
- Make sure you're using App Password, not regular password
- Check that App Password hasn't been revoked

**Error: "Connection timeout"**
- Solution: Check EMAIL_HOST and EMAIL_PORT
- Verify firewall/network allows SMTP connections
- Try port 465 with EMAIL_SECURE=true

**Error: "Environment variable not found"**
- Solution: Add environment variables in Vercel dashboard
- Redeploy after adding variables
- Check that variables are enabled for correct environment

## Production Recommendations

For production environments, consider:

1. **Use a dedicated email service** (SendGrid, Mailgun, AWS SES)
   - Better deliverability
   - Analytics and tracking
   - Higher rate limits
   - Professional appearance

2. **Use a custom domain email** (e.g., `noreply@nobleco.com`)
   - More professional
   - Better deliverability
   - Brand consistency

3. **Set up SPF, DKIM, and DMARC records**
   - Improves email deliverability
   - Reduces spam classification
   - Increases trust

4. **Monitor email sending**
   - Track success/failure rates
   - Monitor bounce rates
   - Set up alerts for failures

## Support

If you encounter issues:

1. Check Vercel function logs
2. Review `TROUBLESHOOT_EMAIL.md` for detailed troubleshooting
3. Test email configuration locally using `node test-email-config.js`
4. Verify environment variables are set correctly in Vercel dashboard

