# Environment Variables Setup

This document explains how to properly configure environment variables to fix authentication redirect issues.

## Required Environment Variables

### Production Environment

For the production deployment on DigitalOcean, you need to set these environment variables:

```bash
# App Configuration
NEXT_PUBLIC_APP_URL=https://deepvest-next-m6h5n.ondigitalocean.app

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_PROJECT_ID=your_project_id
```

### Development Environment

Create a `.env.local` file in the project root:

```bash
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_PROJECT_ID=your_project_id

# Optional API Keys
ANTHROPIC_API_KEY=your_anthropic_api_key
OPENAI_API_KEY=your_openai_api_key
```

## Critical: NEXT_PUBLIC_APP_URL

The `NEXT_PUBLIC_APP_URL` variable is critical for proper authentication redirects.

### Problem Resolution

The original issue was caused by:

1. **Missing NEXT_PUBLIC_APP_URL in production** - This caused redirects to fall back to the default `http://localhost:3000`
2. **Incorrect variable usage** - Some code was using `APP_URL` instead of `NEXT_PUBLIC_APP_URL`
3. **Email confirmation errors** - The auth callback wasn't properly handling error parameters from Supabase

### Fixes Applied

1. **Updated auth-actions.ts**: Changed `APP_URL` to `NEXT_PUBLIC_APP_URL` in resetPassword function
2. **Enhanced auth callback**: Added proper error parameter handling in `/auth/callback`
3. **Improved error display**: Updated AuthError component to read and display specific error messages
4. **Added Suspense boundary**: Fixed Next.js build error for useSearchParams

## Supabase Auth Configuration

In your Supabase dashboard, ensure these URLs are configured:

### Site URL

```
https://deepvest-next-m6h5n.ondigitalocean.app
```

### Redirect URLs

```
https://deepvest-next-m6h5n.ondigitalocean.app/auth/callback
https://deepvest-next-m6h5n.ondigitalocean.app/auth/confirm
```

## Troubleshooting

### Redirect Issues

If you see redirects to `localhost:8080` or other incorrect URLs:

1. Verify `NEXT_PUBLIC_APP_URL` is set correctly in production
2. Check Supabase dashboard redirect URL configuration
3. Ensure all auth actions use `NEXT_PUBLIC_APP_URL`

### Email Confirmation Issues

If email confirmation links show "otp_expired" or "access_denied":

1. The links may be genuinely expired (they have a limited lifespan)
2. Check Supabase logs for specific error details
3. Verify redirect URLs match between Supabase config and app config

### Testing

To test the configuration:

1. Deploy with correct environment variables
2. Try user registration
3. Check email confirmation link
4. Verify successful authentication flow

## Files Modified

- `src/lib/auth/auth-actions.ts` - Fixed APP_URL → NEXT_PUBLIC_APP_URL
- `src/app/auth/callback/route.ts` - Enhanced error handling
- `src/components/auth/auth-error.tsx` - Added URL parameter reading
- `src/app/auth/error/page.tsx` - Added Suspense boundary
