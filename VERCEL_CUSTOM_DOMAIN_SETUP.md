# Vercel Custom Domain Setup Guide

## Important Note: Vercel Doesn't Use Static IP Addresses

Vercel uses a **dynamic edge network** distributed across multiple servers globally. You don't point your domain to a single IP address. Instead, you configure DNS records that point to Vercel's domain infrastructure.

## Step-by-Step Guide

### Quick Start: Connecting Subdomain (e.g., app.noblecovn.com)

**For subdomains like `app.noblecovn.com`, follow these steps:**

#### Step 1: Add Domain in Vercel Dashboard
1. Go to your Vercel project: https://vercel.com/dashboard
2. Click on your project
3. Go to **Settings** → **Domains**
4. Click **Add Domain**
5. Enter your subdomain: `app.noblecovn.com`
6. Click **Add**

#### Step 2: Verify Domain Ownership (If Required)
If Vercel shows "Verification Needed" or "This domain is linked to another Vercel account":
1. In Vercel dashboard, look for the TXT record you need to add
2. It will look like: `_vercel` → `vc-domain-verify=app.noblecovn.com,e...`
3. In Cloudflare (or your DNS provider):
   - **Type:** TXT
   - **Name:** `_vercel` (this creates `_vercel.noblecovn.com`)
   - **Value:** Copy the exact value from Vercel (e.g., `vc-domain-verify=app.noblecovn.com,e...`)
   - **TTL:** Auto (or 3600)
   - **Proxy:** DNS only (grey cloud icon)
4. Save the record
5. Wait a few minutes, then click "Refresh" in Vercel dashboard

#### Step 3: Update DNS Record in Cloudflare
**Replace the old A record with a CNAME record:**

1. **Delete the old A record:**
   - Find the A record: `app` → `76.76.21.21`
   - Click "Edit" → Delete it

2. **Add the new CNAME record:**
   - **Type:** CNAME
   - **Name:** `app` (this creates `app.noblecovn.com`)
   - **Value/Target:** Copy from Vercel dashboard (e.g., `70ce2804f58e7352.vercel-dns-017.com.`)
     - ⚠️ **Important:** Include the trailing dot (`.`) at the end if Vercel shows it
   - **TTL:** Auto (or 3600)
   - **Proxy status:** DNS only (grey cloud icon - turn off Cloudflare proxy)
   - Save the record

#### Step 4: Verify Configuration
1. Wait 5-10 minutes for DNS propagation
2. In Vercel dashboard, click "Refresh" on your domain
3. The status should change from "Verification Needed" to "Valid Configuration" ✅
4. Test by visiting `https://app.noblecovn.com` in your browser

**Note:** The old A record with IP `76.76.21.21` will continue to work, but Vercel recommends using the new CNAME record (`70ce2804f58e7352.vercel-dns-017.com.`) for better reliability and automatic IP updates.

### Method 1: Using CNAME Records (Recommended)

This is the **preferred method** because it automatically handles IP changes.

#### Step 1: Add Domain in Vercel Dashboard

1. Go to your Vercel project: https://vercel.com/dashboard
2. Click on your project
3. Go to **Settings** → **Domains**
4. Click **Add Domain**
5. Enter your domain (e.g., `yourdomain.com` or `www.yourdomain.com`)
6. Click **Add**

#### Step 2: Configure DNS at Your Domain Registrar

**For www subdomain (www.yourdomain.com):**
- **Type:** CNAME
- **Name/Host:** `www`
- **Value/Target:** `cname.vercel-dns.com`
- **TTL:** 3600 (or default)

**For root domain (yourdomain.com):**
- Some DNS providers don't support CNAME for root domains
- If your provider supports CNAME for root: Use `@` as Name and `cname.vercel-dns.com` as Value
- If not supported, use Method 2 below

### Method 2: Using A Records (For Root Domain Only)

If your DNS provider doesn't support CNAME for root domains, use A records:

**For root domain (yourdomain.com):**
- **Type:** A
- **Name/Host:** `@` (or leave blank, depending on your provider)
- **Value/IP Address:** `76.76.21.21`
- **TTL:** 3600 (or default)

**Note:** Vercel may use different IP addresses. Check your Vercel dashboard's domain settings for the exact IP address to use.

### Method 3: Using Vercel Nameservers (Easiest)

If your domain registrar supports nameserver changes:

1. In Vercel dashboard → Settings → Domains → Your domain
2. Look for **Nameservers** section
3. Copy the nameservers provided (e.g., `ns1.vercel-dns.com`, `ns2.vercel-dns.com`)
4. Go to your domain registrar
5. Update your domain's nameservers to the Vercel nameservers
6. Vercel will manage all DNS records automatically

## How to Find Your Vercel Deployment Domain

1. Go to Vercel dashboard → Your project
2. Look at the **Domains** section
3. Your default Vercel domain will be: `your-project-name.vercel.app`
4. This is what you'll point your custom domain to

## DNS Configuration Examples by Provider

### Cloudflare
- **CNAME:** `www` → `cname.vercel-dns.com`
- **A Record (for root):** `@` → `76.76.21.21` (Proxy: OFF)

### GoDaddy
- **CNAME:** `www` → `cname.vercel-dns.com`
- **A Record (for root):** `@` → `76.76.21.21`

### Namecheap
- **CNAME:** `www` → `cname.vercel-dns.com`
- **A Record (for root):** `@` → `76.76.21.21`

### Google Domains
- **CNAME:** `www` → `cname.vercel-dns.com`
- **A Record (for root):** `@` → `76.76.21.21`

## Verification Steps

1. **Wait for DNS Propagation** (can take 24-48 hours, usually much faster)
   - Check propagation: https://www.whatsmydns.net
   - Enter your domain and check if it resolves correctly

2. **Verify in Vercel Dashboard**
   - Go to Settings → Domains
   - Your domain should show as "Valid" with a green checkmark
   - If it shows "Invalid Configuration", check your DNS settings

3. **Test Your Domain**
   - Visit `https://yourdomain.com` in a browser
   - It should load your Vercel deployment

## Troubleshooting

### Domain Not Resolving
- ✅ Check DNS records are correct (CNAME or A record)
- ✅ Wait for DNS propagation (can take up to 48 hours)
- ✅ Verify domain is added in Vercel dashboard
- ✅ Check for typos in DNS configuration

### SSL Certificate Issues
- Vercel automatically provisions SSL certificates via Let's Encrypt
- This happens automatically after DNS is configured correctly
- Wait a few minutes after DNS propagation for SSL to activate

### Still Using Default Vercel Domain
- Make sure you've added the custom domain in Vercel dashboard
- Verify DNS records are pointing to Vercel
- Clear your browser cache and try again

## Important Notes

1. **No Static IP Needed:** Vercel doesn't provide a static IP address. Use CNAME or A records as described above.

2. **HTTPS is Automatic:** Vercel automatically provides SSL certificates for your custom domain.

3. **Both www and root:** You can configure both `www.yourdomain.com` and `yourdomain.com` to point to the same Vercel deployment.

4. **DNS Propagation:** Changes can take anywhere from a few minutes to 48 hours to propagate globally.

## For IT Support: Information to Provide

If you're not managing the domain yourself and need to provide information to IT support, here's what to give them:

### What is the IP Address Used For?

The IP address is used for **A Records** when configuring DNS for the root domain (e.g., `yourdomain.com`). A Records directly point a domain to an IP address. However, **CNAME records are preferred** because they automatically handle IP changes.

### Information to Provide to IT Support

**Option 1: CNAME Records (Recommended - Preferred Method)**

Give IT support these DNS records to configure:

```
For www subdomain (www.yourdomain.com):
- Type: CNAME
- Name/Host: www
- Value/Target: cname.vercel-dns.com
- TTL: 3600 (or default)

For root domain (yourdomain.com):
- Type: CNAME (if supported by DNS provider)
- Name/Host: @ (or root/apex)
- Value/Target: cname.vercel-dns.com
- TTL: 3600 (or default)
```

**Option 2: A Record with IP Address (If CNAME Not Supported for Root)**

If the DNS provider doesn't support CNAME for root domains, provide this:

```
For root domain (yourdomain.com):
- Type: A
- Name/Host: @ (or root/apex, or leave blank)
- Value/IP Address: 76.76.21.21
- TTL: 3600 (or default)

For www subdomain (www.yourdomain.com):
- Type: CNAME
- Name/Host: www
- Value/Target: cname.vercel-dns.com
- TTL: 3600 (or default)
```

### How to Verify the Exact IP Address

1. **First, add your domain in Vercel:**
   - Go to Vercel Dashboard → Your Project → Settings → Domains
   - Click "Add Domain" and enter your domain
   - Click "Add"

2. **Check for IP address in Vercel:**
   - After adding the domain, click on it in the Domains list
   - Look for DNS configuration instructions
   - Vercel may show the exact IP address to use (if different from `76.76.21.21`)

3. **If IP is not shown:**
   - The IP `76.76.21.21` is the standard IP address used by Vercel for A records
   - This IP is commonly used and should work
   - You can verify it works after DNS propagation

### Email Template for IT Support

You can copy and send this to your IT support:

```
Subject: DNS Configuration Request for [Your Domain]

Hi IT Support Team,

I need to connect our domain [yourdomain.com] to our Vercel hosting. 
Please configure the following DNS records:

RECOMMENDED CONFIGURATION (CNAME - Preferred):
-----------------------------------------------
For www.yourdomain.com:
- Type: CNAME
- Name: www
- Value: cname.vercel-dns.com
- TTL: 3600

For yourdomain.com (root domain):
- Type: CNAME (if supported)
- Name: @
- Value: cname.vercel-dns.com
- TTL: 3600

ALTERNATIVE CONFIGURATION (If CNAME not supported for root):
-------------------------------------------------------------
For yourdomain.com (root domain):
- Type: A
- Name: @
- Value: 76.76.21.21
- TTL: 3600

For www.yourdomain.com:
- Type: CNAME
- Name: www
- Value: cname.vercel-dns.com
- TTL: 3600

After configuration, please let me know so I can verify the setup.

Thank you!
```

### Can the Current IP Address (76.76.21.21) Work?

**Yes, the IP address `76.76.21.21` should work** for connecting your domain to Vercel. This is the standard IP address that Vercel uses for A records. However:

1. **CNAME is better:** If possible, ask IT support to use CNAME records instead of A records, as they're more flexible and handle IP changes automatically.

2. **Verify after setup:** After IT support configures the DNS, you can verify it's working:
   - Check in Vercel Dashboard → Settings → Domains (should show "Valid")
   - Test by visiting your domain in a browser
   - Use DNS checker: https://www.whatsmydns.net

3. **Both methods work:** Whether using CNAME or A record with IP `76.76.21.21`, both will successfully connect your domain to Vercel hosting.

## Quick Reference

- **CNAME Target:** `cname.vercel-dns.com`
- **A Record IP:** `76.76.21.21` (standard IP, verify in Vercel dashboard if shown)
- **Vercel Dashboard:** https://vercel.com/dashboard
- **DNS Check Tool:** https://www.whatsmydns.net

