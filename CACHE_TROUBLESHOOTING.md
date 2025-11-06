# Cache Troubleshooting Guide

## Problem: Changes Not Appearing After Code Updates

If you've updated code but don't see the changes in your browser, it's likely a caching issue.

## Quick Fixes

### 1. Clear Cache and Restart Dev Server (Recommended)

```bash
npm run clear-cache
npm run dev
```

Or use the combined command:
```bash
npm run dev:clean
```

### 2. Hard Refresh Browser

- **Windows/Linux**: `Ctrl + Shift + R` or `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`
- **Chrome DevTools**: Right-click refresh button → "Empty Cache and Hard Reload"

### 3. Clear Browser Cache Manually

1. Open browser DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
4. Or go to browser settings → Clear browsing data → Cached images and files

## What We've Implemented

### Development Mode
- ✅ **No-cache headers**: All responses include `Cache-Control: no-store` headers
- ✅ **Vite plugin**: Custom plugin prevents caching in dev mode
- ✅ **HMR**: Hot Module Replacement ensures changes are reflected immediately
- ✅ **Meta tags**: HTML includes cache-prevention meta tags

### Production Mode
- ✅ **Hash-based filenames**: All assets include content hashes (e.g., `index-abc123.js`)
- ✅ **Automatic cache busting**: New builds generate new filenames
- ✅ **Source maps**: Enabled for debugging without caching issues

## Cache Clearing Script

We've added a utility script to clear all caches:

```bash
npm run clear-cache
```

This clears:
- Vite cache (`node_modules/.vite`)
- Build output (`dist`)
- Other cache directories

## When to Clear Cache

Clear cache when:
- ✅ Code changes aren't appearing
- ✅ After pulling new code from Git
- ✅ After updating dependencies
- ✅ When seeing stale/old UI elements
- ✅ After switching branches

## Prevention

The following measures are now in place to prevent caching issues:

1. **Development**: All responses include no-cache headers
2. **Production**: Files are hashed, so new builds automatically bust cache
3. **Browser**: Meta tags prevent aggressive caching
4. **Vite**: Custom plugin ensures no caching in dev mode

## Still Having Issues?

If cache clearing doesn't work:

1. **Check if dev server is running**: Restart it completely
2. **Check browser console**: Look for errors or warnings
3. **Try incognito/private mode**: Rules out browser extensions
4. **Check network tab**: Verify files are being loaded (not 304 Not Modified)
5. **Verify file changes**: Make sure your changes were actually saved

## Technical Details

### Vite Configuration
- Custom `noCachePlugin()` middleware sets no-cache headers
- HMR is enabled with overlay for immediate feedback
- Build output uses hash-based filenames

### HTML Meta Tags
```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
<meta http-equiv="Pragma" content="no-cache" />
<meta http-equiv="Expires" content="0" />
```

### Build Output
Production builds automatically include content hashes:
- `assets/index-[hash].js`
- `assets/index-[hash].css`

This ensures new deployments automatically bust browser cache.

