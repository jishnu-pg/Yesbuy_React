# Production Backend Configuration Guide

This guide explains how to switch from localhost backend to production backend.

## Quick Setup

### Option 1: Update `.env` file (Recommended)

1. **Create or edit `.env` file** in the root directory (`yesBuy-main/`)

2. **Add your production API URL:**
   ```env
   VITE_API_BASE_URL=https://your-production-domain.com/api
   ```

3. **Restart your development server:**
   ```bash
   npm run dev
   ```

### Option 2: Use Environment-Specific Files

Vite automatically loads environment files based on the mode:

- **Development**: `.env.development` (used with `npm run dev`)
- **Production**: `.env.production` (used with `npm run build`)

#### For Development:
Create `.env.development`:
```env
VITE_API_BASE_URL=http://127.0.0.1:8050/api
```

#### For Production Build:
Create `.env.production`:
```env
VITE_API_BASE_URL=https://your-production-domain.com/api
```

Then build:
```bash
npm run build
```

## Configuration Files

### `.env` (General - used if mode-specific file doesn't exist)
```env
# API Configuration
VITE_API_BASE_URL=http://127.0.0.1:8050/api

# API Timeout (optional)
VITE_API_TIMEOUT=30000

# Application Configuration (optional)
VITE_APP_NAME=YesBuy
VITE_APP_VERSION=1.0.0

# External Services (optional)
VITE_NETLIFY_API_URL=https://yesbuyapi.netlify.app/.netlify/functions
```

### `.env.development` (Development mode)
```env
VITE_API_BASE_URL=http://127.0.0.1:8050/api
VITE_API_TIMEOUT=30000
```

### `.env.production` (Production build)
```env
VITE_API_BASE_URL=https://yesbuy.foodoyes.com/api
VITE_API_TIMEOUT=30000
```

## How It Works

The API base URL is configured in `src/config/env.js`:

```javascript
export const config = {
  api: {
    baseUrl: getEnv('VITE_API_BASE_URL', 'http://127.0.0.1:8050/api'),
  },
};
```

This reads from the `VITE_API_BASE_URL` environment variable. If not set, it defaults to `http://127.0.0.1:8050/api`.

## Switching Between Environments

### Switch to Production for Development:
1. Update `.env`:
   ```env
   VITE_API_BASE_URL=https://your-production-domain.com/api
   ```
2. Restart dev server:
   ```bash
   npm run dev
   ```

### Switch Back to Localhost:
1. Update `.env`:
   ```env
   VITE_API_BASE_URL=http://127.0.0.1:8050/api
   ```
2. Restart dev server:
   ```bash
   npm run dev
   ```

## Important Notes

1. **Environment variables must start with `VITE_`** - Vite only exposes variables with this prefix to the client-side code.

2. **Restart required** - After changing `.env` files, you must restart the development server for changes to take effect.

3. **Build-time variables** - Environment variables are embedded at build time. For production builds, make sure `.env.production` has the correct URL.

4. **CORS Configuration** - Ensure your production backend has CORS configured to allow requests from your frontend domain.

5. **HTTPS** - Production APIs should use HTTPS. Make sure your production URL starts with `https://`.

## Example Production URLs

Based on your backend configuration, your production URL might be:
- `https://yesbuy.foodoyes.com/api`
- `https://api.yesbuy.in/api`
- `https://yesbharathonline.com/api`

**Check your backend `settings.py` for the exact `BASE_URL` and use that as reference.**

## Verification

After updating the configuration:

1. Check the browser console for API calls
2. Verify the API requests are going to the correct URL
3. Test a simple API call (like login) to confirm it's working

## Troubleshooting

### API calls still going to localhost?
- Make sure you restarted the dev server after changing `.env`
- Check that the variable name is exactly `VITE_API_BASE_URL`
- Verify the `.env` file is in the root directory (`yesBuy-main/`)

### CORS errors?
- Ensure your production backend allows requests from your frontend domain
- Check backend `CORS_ALLOWED_ORIGINS` or `CORS_ORIGIN_WHITELIST` settings

### 404 errors?
- Verify the API URL format: `https://domain.com/api` (with `/api` suffix)
- Check that your backend is running and accessible at that URL

