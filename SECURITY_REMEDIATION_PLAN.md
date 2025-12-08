# Security Remediation Plan - Exposed Secrets

## 🚨 Critical Security Issue Detected

**Date:** December 8, 2025  
**Alert Source:** GitGuardian  
**Issue:** Supabase Service Role JWT exposed in GitHub repository  
**Repository:** binhvu284/nobleco  
**Pushed Date:** December 7th 2025, 19:07:35 UTC

## Immediate Actions Required

### 1. Rotate Exposed Supabase Service Role Key ⚠️ CRITICAL

**Why:** The Service Role key has full admin access to your Supabase database and bypasses Row Level Security (RLS). If exposed, attackers can access/modify all data.

**Steps:**

1. **Login to Supabase Dashboard:**
   - Go to https://app.supabase.com
   - Select your project

2. **Generate New Service Role Key:**
   - Navigate to **Settings** → **API**
   - Scroll to **Project API keys**
   - Find **`service_role`** key (secret)
   - Click **"Reset"** or **"Generate new key"**
   - **Copy the new key immediately** (you won't see it again)

3. **Update Environment Variables:**

   **In Vercel:**
   - Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
   - Find `SUPABASE_SERVICE_ROLE_KEY`
   - Click **Edit** → Replace with new key → **Save**
   - **Redeploy immediately** (go to Deployments → Latest → Redeploy)

   **In Local Development:**
   - Update your `.env` file with the new key
   - **Never commit** `.env` to git

4. **Verify Old Key is Invalid:**
   - Test that old key no longer works
   - Monitor Supabase logs for unauthorized access attempts

### 2. Rotate Sepay API Key ⚠️ HIGH PRIORITY

**Why:** Your Sepay API key is exposed in documentation files (`ENV_SETUP_COMPLETE.md`, `QUICK_START_PAYMENT_SETUP.md`).

**Steps:**

1. **Login to Sepay Dashboard:**
   - Go to https://my.sepay.vn
   - Login with your credentials

2. **Generate New API Key:**
   - Navigate to **API Access** or **Settings** → **API Keys**
   - Revoke/delete the old exposed key (check git history for the actual key)
   - Generate a new API key
   - **Copy the new key immediately**

3. **Update Environment Variables:**

   **In Vercel:**
   - Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
   - Find `SEPAY_API_KEY`
   - Click **Edit** → Replace with new key → **Save**

   **In Sepay Webhook Configuration:**
   - Go to Sepay Dashboard → **WebHooks**
   - Edit your webhook configuration
   - Update **API Key** field with new key
   - **Save**

   **In Local Development:**
   - Update your `.env` file with the new key

4. **Redeploy Application:**
   - Go to Vercel → **Deployments** → Latest → **Redeploy**

### 3. Remove Exposed Secrets from Git History ⚠️ CRITICAL

**Why:** Even if you remove files, secrets remain in git history and can be accessed.

**Steps:**

1. **Check Git History for Exposed Secrets:**
   ```bash
   # Check for Supabase Service Role keys in history
   git log --all --full-history -p | grep -i "SUPABASE_SERVICE_ROLE_KEY"
   
   # Check for JWT tokens (starts with eyJ)
   git log --all --full-history -p | grep -E "eyJ[A-Za-z0-9_-]{20,}"
   
   # Check for Sepay API keys
   git log --all --full-history -p | grep -i "SEPAY_API_KEY"
   ```

2. **Remove Secrets from Git History (BFG Repo-Cleaner - Recommended):**

   **Option A: Using BFG Repo-Cleaner (Easier):**
   ```bash
   # Install BFG (if not installed)
   # Download from: https://rtyley.github.io/bfg-repo-cleaner/
   
   # Create a file with secrets to remove
   # Create secrets.txt with all exposed secrets (one per line)
   # Include: old Supabase Service Role JWT, old Sepay API key, etc.
   echo "old_secret_1" > secrets.txt
   echo "old_secret_2" >> secrets.txt
   # Add your old Supabase Service Role key to secrets.txt
   
   # Remove secrets from history
   java -jar bfg.jar --replace-text secrets.txt
   
   # Clean up
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   
   # Force push (WARNING: This rewrites history)
   git push --force --all
   ```

   **Option B: Using git-filter-repo (More Control):**
   ```bash
   # Install git-filter-repo
   pip install git-filter-repo
   
   # Remove specific strings from history
   git filter-repo --invert-paths --path secrets.txt
   # Or use --replace-text for specific strings
   ```

   **⚠️ WARNING:** Force pushing rewrites git history. Coordinate with your team first!

3. **Alternative: If History Cleanup is Not Possible:**
   - Consider creating a new repository
   - Migrate code without secrets
   - Update all integrations to point to new repo

### 4. Clean Up Documentation Files

**Files to Update:**
- `ENV_SETUP_COMPLETE.md` - Remove real Sepay API key
- `QUICK_START_PAYMENT_SETUP.md` - Remove real Sepay API key
- Any other documentation files with real secrets

**Action:**
- Replace real API keys with placeholders like `your_sepay_api_key_here`
- Add warnings about never committing real secrets

### 5. Enhance .gitignore

**Current `.gitignore` includes:**
```
.env*
```

**Add Additional Patterns:**
```
# Environment files
.env
.env.local
.env.*.local
.env.production
.env.development

# Secrets and keys
*.key
*.pem
*.p12
secrets.txt
credentials.json

# IDE files that might contain secrets
.vscode/settings.json
.idea/
*.swp
```

### 6. Set Up Secret Scanning (Prevention)

**GitHub Secret Scanning:**
- GitHub automatically scans for secrets (already enabled)
- GitGuardian provides additional scanning

**Pre-commit Hooks:**
```bash
# Install git-secrets (AWS tool, works for any secrets)
git secrets --install
git secrets --register-aws

# Add custom patterns
git secrets --add 'SUPABASE_SERVICE_ROLE_KEY\s*=\s*[A-Za-z0-9_-]{20,}'
git secrets --add 'SEPAY_API_KEY\s*=\s*[A-Za-z0-9_-]{20,}'
```

### 7. Audit Current Environment Variables

**Check Vercel Environment Variables:**
- Go to Vercel Dashboard → Settings → Environment Variables
- Review all variables
- Ensure no secrets are exposed in:
  - Build logs
  - Deployment logs
  - Preview deployments

**Check Local .env Files:**
- Ensure `.env` is in `.gitignore`
- Never commit `.env` files
- Use `.env.example` for templates

### 8. Monitor for Unauthorized Access

**Supabase:**
- Go to Supabase Dashboard → **Logs** → **API Logs**
- Monitor for unusual activity
- Check for requests using old Service Role key
- Set up alerts for suspicious activity

**Sepay:**
- Check Sepay Dashboard → **Transaction History**
- Monitor for unauthorized transactions
- Review webhook logs for suspicious activity

**Application:**
- Monitor Vercel logs for errors
- Check application logs for authentication failures
- Set up monitoring/alerts for security events

## Prevention Checklist

### ✅ Immediate (Do Now)
- [ ] Rotate Supabase Service Role Key
- [ ] Rotate Sepay API Key
- [ ] Update Vercel environment variables
- [ ] Update Sepay webhook configuration
- [ ] Remove secrets from documentation files
- [ ] Redeploy application

### ✅ Short-term (This Week)
- [ ] Clean git history of exposed secrets
- [ ] Enhance .gitignore
- [ ] Create .env.example template
- [ ] Set up pre-commit hooks for secret detection
- [ ] Audit all environment variables
- [ ] Review and update documentation

### ✅ Long-term (Ongoing)
- [ ] Regular secret rotation (every 90 days)
- [ ] Security audits (quarterly)
- [ ] Team training on secret management
- [ ] Automated secret scanning in CI/CD
- [ ] Monitor for exposed secrets
- [ ] Document secret management procedures

## Security Best Practices Going Forward

### 1. Never Commit Secrets
- ✅ Use environment variables
- ✅ Use `.env` files (gitignored)
- ✅ Use secret management services (Vercel, AWS Secrets Manager, etc.)
- ❌ Never hardcode secrets in code
- ❌ Never commit `.env` files
- ❌ Never put secrets in documentation

### 2. Use Secret Management
- **Vercel:** Use Environment Variables (encrypted at rest)
- **Supabase:** Use environment variables, never expose Service Role key
- **Sepay:** Store API keys in environment variables only

### 3. Rotate Secrets Regularly
- **Service Role Keys:** Every 90 days
- **API Keys:** Every 90 days or when exposed
- **Passwords:** Every 90 days

### 4. Use Different Keys for Different Environments
- **Production:** Production keys
- **Staging/Preview:** Staging keys
- **Development:** Development/test keys

### 5. Monitor and Alert
- Set up alerts for:
  - Failed authentication attempts
  - Unusual API usage
  - Secret exposure in git commits
  - Unauthorized access attempts

## Emergency Contacts

If you suspect unauthorized access:
1. **Immediately rotate all exposed keys**
2. **Review access logs**
3. **Contact Supabase support** if database compromised
4. **Contact Sepay support** if payment system compromised
5. **Review and revoke** any suspicious API access

## Resources

- **Supabase Security:** https://supabase.com/docs/guides/platform/security
- **GitGuardian:** https://www.gitguardian.com/
- **GitHub Secret Scanning:** https://docs.github.com/en/code-security/secret-scanning
- **OWASP Secret Management:** https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html

---

**Last Updated:** December 8, 2025  
**Status:** 🔴 CRITICAL - Immediate action required

