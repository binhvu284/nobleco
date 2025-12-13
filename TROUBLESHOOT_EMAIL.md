# Troubleshooting Email Authentication Errors

## Common Error: "Invalid login: 535-5.7.8 Username and Password not accepted"

This error means Gmail rejected your credentials. Here's how to fix it:

### Step 1: Verify Your App Password

1. **Check if you're using an App Password (not your regular password)**
   - App passwords are 16 characters long
   - They look like: `abcd efgh ijkl mnop` (with or without spaces)
   - Regular Gmail passwords will NOT work

2. **Generate a new App Password if needed:**
   - Go to: https://myaccount.google.com/apppasswords
   - Or: Google Account → Security → 2-Step Verification → App passwords
   - Select "Mail" → "Other (Custom name)" → Enter "Nobleco"
   - Copy the 16-character password

### Step 2: Update Your .env File

Make sure your `.env` file has:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=abcdefghijklmnop  # Remove all spaces from app password
EMAIL_FROM=Nobleco <your-email@gmail.com>
```

**Important:**
- `EMAIL_USER` should be your full Gmail address (e.g., `user@gmail.com`)
- `EMAIL_PASS` should be the 16-character app password WITHOUT spaces
- The code automatically removes spaces, but it's better to remove them in .env

### Step 3: Verify 2-Step Verification is Enabled

1. Go to: https://myaccount.google.com/security
2. Under "Signing in to Google", verify "2-Step Verification" is ON
3. If it's OFF, enable it first, then create an App Password

### Step 4: Check Your Environment Variables

Make sure the variables are loaded correctly:

1. **Restart your development server** after changing .env
2. Check the console logs - you should see:
   ```
   [EMAIL] Configuring SMTP: your-email@gmail.com@smtp.gmail.com:587 (secure: false)
   ```

### Step 5: Test Connection

The code now verifies the connection before sending. If you see:
- `[EMAIL] SMTP connection verified successfully` → Configuration is correct
- `Email authentication failed` → Check your credentials

### Common Mistakes

❌ **Wrong:** Using your regular Gmail password
✅ **Correct:** Using a 16-character App Password

❌ **Wrong:** `EMAIL_PASS=abcd efgh ijkl mnop` (with spaces)
✅ **Correct:** `EMAIL_PASS=abcdefghijklmnop` (without spaces)

❌ **Wrong:** `EMAIL_USER=user` (incomplete email)
✅ **Correct:** `EMAIL_USER=user@gmail.com` (full email address)

❌ **Wrong:** Not restarting server after changing .env
✅ **Correct:** Always restart the server after changing environment variables

### Alternative: Use Port 465 with SSL

If port 587 doesn't work, try port 465 with SSL:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Nobleco <your-email@gmail.com>
```

### Still Having Issues?

1. **Double-check the App Password:**
   - Make sure it's exactly 16 characters
   - No extra spaces or characters
   - Copy it directly from Google (don't type it manually)

2. **Try generating a new App Password:**
   - Delete the old one
   - Generate a fresh one
   - Update .env and restart server

3. **Check Gmail Security Settings:**
   - Make sure "Less secure app access" is NOT enabled (it's deprecated)
   - Use App Passwords instead

4. **Verify Network/Firewall:**
   - Some networks block SMTP ports
   - Try from a different network
   - Check if port 587 or 465 is blocked

### Debug Mode

The code now logs more information. Check your console for:
- `[EMAIL] Configuring SMTP: ...` - Shows your configuration
- `[EMAIL] SMTP connection verified successfully` - Connection works
- `[EMAIL] Email sent successfully` - Email was sent

If you see errors, they will include helpful hints about what to check.

