import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * Updates the user's session cookie and handles auth state
 * This should be used in middleware.ts
 */
export async function updateSession(request: NextRequest) {
  // Create a response object that we can modify
  const response = NextResponse.next();

  try {
    // Create a Supabase client for middleware
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          flowType: 'pkce',
          autoRefreshToken: true,
          detectSessionInUrl: true,
          // Custom cookie handling through request/response
          storage: {
            getItem: key => {
              return request.cookies.get(key)?.value ?? null;
            },
            setItem: (key, value) => {
              // Prevent setting invalid tokens or too large values
              if (key.includes('access_token') || key.includes('refresh_token')) {
                try {
                  // Check JWT validity
                  const parts = value.split('.');
                  if (parts.length !== 3) {
                    console.error('Invalid JWT token format');
                    return;
                  }
                } catch (e) {
                  console.error('Error processing JWT token:', e);
                  return;
                }
              }

              response.cookies.set(key, value, {
                path: '/',
                domain:
                  process.env.NODE_ENV === 'production'
                    ? process.env.DOMAIN || undefined
                    : undefined,
                maxAge: 60 * 60 * 24 * 7, // 7 days maximum
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                sameSite: 'lax',
              });
            },
            removeItem: key => {
              response.cookies.set(key, '', {
                path: '/',
                maxAge: 0,
                domain:
                  process.env.NODE_ENV === 'production'
                    ? process.env.DOMAIN || undefined
                    : undefined,
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                sameSite: 'lax',
              });
            },
          },
        },
      },
    );

    // Refresh the session with error handling
    try {
      await supabase.auth.getSession();
    } catch (error) {
      // If there was an error with the session, clear the auth cookies
      console.error('Session refresh error:', error);

      const authCookies = ['sb-access-token', 'sb-refresh-token'];
      authCookies.forEach(cookieName => {
        response.cookies.set(cookieName, '', {
          maxAge: 0,
          path: '/',
        });
      });
    }
  } catch (error) {
    console.error('Middleware error:', error);
    // Continue the request even if there is an error in middleware
  }

  return response;
}
