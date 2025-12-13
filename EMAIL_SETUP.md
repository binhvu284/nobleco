# Email Configuration Guide

This guide explains how to configure email sending for OTP codes in Nobleco.

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# Email SMTP Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Nobleco <noreply@nobleco.com>
```

## Email Provider Setup

### Gmail Setup

1. **Enable 2-Step Verification** on your Google account
2. **Generate an App Password**:
   - Go to Google Account → Security → 2-Step Verification
   - Scroll down to the **"Mật khẩu ứng dụng"** (App passwords) section at the bottom
   - Click on **"Mật khẩu ứng dụng"** (or the arrow `>` next to it)
   - This will open the App Passwords page
   - Click **"Chọn ứng dụng"** (Select app) → Choose **"Thư"** (Mail)
   - Click **"Chọn thiết bị"** (Select device) → Choose **"Khác (Tên tùy chỉnh)"** (Other - Custom name)
   - Enter a name like "Nobleco" and click **"Tạo"** (Create)
   - Copy the generated 16-character password (it will look like: `xxxx xxxx xxxx xxxx`)
3. **Configure environment variables**:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-character-app-password
   EMAIL_FROM=Nobleco <your-email@gmail.com>
   ```

### Outlook/Hotmail Setup

1. **Enable App Passwords**:
   - Go to Microsoft Account → Security → Advanced security options → App passwords
   - Generate a new app password
2. **Configure environment variables**:
   ```env
   EMAIL_HOST=smtp-mail.outlook.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@outlook.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=Nobleco <your-email@outlook.com>
   ```

### Custom SMTP Server

For other email providers or custom SMTP servers:

```env
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587  # or 465 for SSL
EMAIL_SECURE=false  # true for port 465, false for port 587
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-password
EMAIL_FROM=Nobleco <your-email@domain.com>
```

## Common SMTP Settings

| Provider | Host | Port | Secure |
|----------|------|------|--------|
| Gmail | smtp.gmail.com | 587 | false |
| Gmail (SSL) | smtp.gmail.com | 465 | true |
| Outlook | smtp-mail.outlook.com | 587 | false |
| Yahoo | smtp.mail.yahoo.com | 587 | false |
| SendGrid | smtp.sendgrid.net | 587 | false |
| Mailgun | smtp.mailgun.org | 587 | false |

## Testing

After configuration, test email sending by:

1. Starting the development server
2. Attempting to sign up with email OTP
3. Check the console logs for email sending status
4. Check the recipient's inbox (and spam folder)

## Troubleshooting

### "Email not configured" warning
- Ensure all EMAIL_* environment variables are set
- Restart the server after adding environment variables

### "Authentication failed" error
- Verify EMAIL_USER and EMAIL_PASS are correct
- For Gmail, ensure you're using an App Password, not your regular password
- Check that 2-Step Verification is enabled (for Gmail)

### "Connection timeout" error
- Verify EMAIL_HOST and EMAIL_PORT are correct
- Check firewall settings
- Try using SSL (port 465 with EMAIL_SECURE=true)

### Emails going to spam
- Use a proper domain email address (not free email providers)
- Set up SPF, DKIM, and DMARC records for your domain
- Use a professional email service like SendGrid or Mailgun

## Production Recommendations

For production environments, consider using:

1. **SendGrid** - Reliable email delivery service
2. **Mailgun** - Transactional email API
3. **AWS SES** - Scalable email service
4. **Resend** - Modern email API

These services provide better deliverability, analytics, and reliability than SMTP.

