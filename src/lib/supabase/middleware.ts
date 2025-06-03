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
    // Check if there's an existing session before attempting refresh
    const existingToken = request.cookies.get('sb-access-token')?.value;
    const existingRefreshToken = request.cookies.get('sb-refresh-token')?.value;

    // If we don't have tokens, don't attempt to refresh
    if (!existingToken && !existingRefreshToken) {
      return response;
    }

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
              // Prevent setting invalid tokens
              if (key.includes('access_token') || key.includes('refresh_token')) {
                try {
                  // Check JWT validity
                  const parts = value.split('.');
                  if (parts.length !== 3) {
                    console.error('Invalid JWT token format');
                    return;
                  }

                  // Validate the token expiration
                  try {
                    const payload = JSON.parse(atob(parts[1]));

                    // Check if expiration is a valid timestamp
                    // exp must be a number and should be in the future
                    const now = Math.floor(Date.now() / 1000);
                    if (
                      typeof payload.exp !== 'number' ||
                      payload.exp <= now ||
                      // Check for timestamps too far in the future (more than 2 weeks)
                      payload.exp > now + 1209600
                    ) {
                      console.error('Invalid or expired JWT token expiration');
                      return;
                    }
                  } catch (e) {
                    console.error('Error parsing JWT payload:', e);
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

    // Only try to refresh if we have a refresh token
    if (existingRefreshToken) {
      try {
        const { data, error } = await supabase.auth.getSession();

        // If the error is related to an already used refresh token, clear the cookies and redirect to sign-in
        if (
          error &&
          (error.message?.includes('Invalid Refresh Token: Already Used') ||
            error.message?.includes('refresh_token_already_used'))
        ) {
          console.warn(
            'Refresh token already used, clearing auth cookies and redirecting to sign-in.',
          );
          clearAuthCookies(response); // Modify headers of the current response object
          // Perform redirect, passing modified headers (with cleared cookies)
          return NextResponse.redirect(new URL('/auth/sign-in', request.url), {
            headers: response.headers,
          });
        }

        // If getSession fails or returns no session, then clear the cookies
        if (error || !data?.session) {
          clearAuthCookies(response);
          // If there was an error but not "Already Used", return response with cleared cookies
          // to not interrupt the flow for other possible session errors that auth-provider can handle
          if (error) return response;
        }
      } catch (error) {
        // Check for known errors related to refresh token
        if (
          error instanceof Error &&
          (error.message?.includes('Invalid Refresh Token') ||
            error.message?.includes('refresh_token'))
        ) {
          console.warn(
            'Refresh token error in catch block, clearing auth cookies and redirecting to sign-in:',
            error.message,
          );
          clearAuthCookies(response);
          return NextResponse.redirect(new URL('/auth/sign-in', request.url), {
            headers: response.headers,
          });
        } else {
          console.error('Session refresh error in catch block:', error);
        }
        clearAuthCookies(response);
      }
    } else if (existingToken && !existingRefreshToken) {
      // If we have an access token but no refresh token, clear everything
      clearAuthCookies(response);
    }
  } catch (error) {
    console.error('Middleware error:', error);
    // Continue the request even if there is an error in middleware
  }

  return response;
}

/**
 * Helper function to clear all authentication cookies
 */
function clearAuthCookies(response: NextResponse) {
  const authCookies = ['sb-access-token', 'sb-refresh-token', 'supabase-auth-token'];
  authCookies.forEach(cookieName => {
    response.cookies.set(cookieName, '', {
      maxAge: 0,
      path: '/',
    });
  });
}
