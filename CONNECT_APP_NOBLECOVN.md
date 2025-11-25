# How to Connect app.noblecovn.com to Vercel

## Current Situation
- ✅ Domain is already added in Vercel dashboard
- ✅ Vercel shows: "Verification Needed" 
- ✅ Current DNS: A record `app` → `76.76.21.21` (in Cloudflare)
- ⚠️ Need to: Add TXT record for verification + Change A record to CNAME

## Step-by-Step Instructions

### Step 1: Add TXT Record for Verification (Required First)

In **Cloudflare Dashboard**:

1. Go to DNS Records page for `noblecovn.com`
2. Click **"+ Add record"**
3. Configure:
   - **Type:** `TXT`
   - **Name:** `_vercel` (this creates `_vercel.noblecovn.com`)
   - **Content:** Copy the exact value from Vercel dashboard
     - It should look like: `vc-domain-verify=app.noblecovn.com,e...`
     - Copy the FULL value from Vercel (use the copy icon in Vercel dashboard)
   - **TTL:** `Auto`
   - **Proxy status:** `DNS only` (grey cloud icon - make sure proxy is OFF)
4. Click **Save**

5. **Wait 2-3 minutes**, then go back to Vercel dashboard
6. Click **"Refresh"** button next to your domain
7. The verification should complete

### Step 2: Replace A Record with CNAME Record

In **Cloudflare Dashboard**:

1. **Delete the old A record:**
   - Find the existing A record: `app` → `76.76.21.21`
   - Click **"Edit"** on that record
   - Click **"Delete"** and confirm

2. **Add the new CNAME record:**
   - Click **"+ Add record"**
   - Configure:
     - **Type:** `CNAME`
     - **Name:** `app` (this creates `app.noblecovn.com`)
     - **Target:** Copy from Vercel dashboard
       - In Vercel, look for the CNAME record value
       - It should be: `70ce2804f58e7352.vercel-dns-017.com.`
       - ⚠️ **Important:** Include the trailing dot (`.`) at the end
     - **TTL:** `Auto`
     - **Proxy status:** `DNS only` (grey cloud icon - make sure proxy is OFF)
   - Click **Save**

### Step 3: Verify Everything Works

1. **Wait 5-10 minutes** for DNS propagation
2. In **Vercel dashboard:**
   - Click **"Refresh"** on your domain
   - Status should change to: **"Valid Configuration"** ✅
3. **Test in browser:**
   - Visit: `https://app.noblecovn.com`
   - Your Vercel app should load

## Important Notes

### Cloudflare Proxy Settings
- **Must be OFF (DNS only)** for both TXT and CNAME records
- If proxy is ON (orange cloud), Vercel won't be able to verify or route traffic correctly
- Make sure both records show **grey cloud icon** (DNS only)

### DNS Propagation Time
- Usually takes **5-10 minutes** but can take up to 24 hours
- Check propagation: https://www.whatsmydns.net/#CNAME/app.noblecovn.com
- After adding records, wait a few minutes before testing

## Troubleshooting

### If verification doesn't complete:
- ✅ Check TXT record name is exactly `_vercel` (not `_vercel.noblecovn.com`)
- ✅ Check TXT record value matches exactly (copy from Vercel)
- ✅ Make sure proxy is OFF (grey cloud)
- ✅ Wait 5-10 minutes, then click "Refresh" in Vercel

### If domain doesn't load:
- ✅ Check CNAME record target matches exactly (including trailing dot)
- ✅ Make sure proxy is OFF (grey cloud)
- ✅ Wait 10-15 minutes for DNS propagation
- ✅ Check DNS propagation: https://www.whatsmydns.net

### If you see SSL errors:
- Vercel automatically provisions SSL certificates
- Wait 5-10 minutes after DNS is configured
- SSL will activate automatically

## Summary Checklist

- [ ] Added TXT record: `_vercel` → `vc-domain-verify=...` (proxy OFF)
- [ ] Clicked "Refresh" in Vercel, verification completed
- [ ] Deleted old A record: `app` → `76.76.21.21`
- [ ] Added new CNAME record: `app` → `70ce2804f58e7352.vercel-dns-017.com.` (proxy OFF)
- [ ] Waited 5-10 minutes for DNS propagation
- [ ] Clicked "Refresh" in Vercel, status shows "Valid Configuration"
- [ ] Tested `https://app.noblecovn.com` in browser

## Quick Reference

**TXT Record:**
- Name: `_vercel`
- Value: `vc-domain-verify=app.noblecovn.com,e...` (from Vercel)
- Proxy: OFF

**CNAME Record:**
- Name: `app`
- Target: `70ce2804f58e7352.vercel-dns-017.com.` (from Vercel)
- Proxy: OFF

