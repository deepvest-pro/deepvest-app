import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

/**
 * Updates the user's session cookie and handles auth state
 * This should be used in middleware.ts
 */
export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  });

  // TODO: Change createServerClient fith modern way
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.delete(name);
          response.cookies.delete({ name, ...options });
        },
      },
    },
  );

  try {
    // Note: Using getSession() in middleware is acceptable as it runs at the edge
    // and doesn't have the same security concerns as server components
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.warn('[updateSession] Error getting session:', sessionError.message);
      if (
        sessionError.message?.includes('Invalid Refresh Token') ||
        sessionError.message?.includes('refresh_token_already_used') ||
        sessionError.message?.includes('AuthSessionMissingError')
      ) {
        console.warn(
          '[updateSession] Invalid session detected. Clearing auth cookies and redirecting to sign-in.',
        );
        const redirectResponse = NextResponse.redirect(new URL('/auth/sign-in', request.url));
        clearAuthCookies(redirectResponse);
        return redirectResponse;
      }
    }

    // If we have a valid session, refresh it
    if (sessionData?.session) {
      await supabase.auth.refreshSession();
    }
  } catch (error) {
    console.error('[updateSession] Unexpected error:', error);
    // Don't redirect on general errors, just continue
  }

  return response;
}

function clearAuthCookies(response: NextResponse) {
  // Extract project ref from Supabase URL
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('.')[0].split('//')[1];

  const authCookieKeys = [
    // Modern Supabase auth cookie format
    ...(projectRef ? [`sb-${projectRef}-auth-token`] : []),
    // Legacy cookie names for backwards compatibility
    'sb-access-token',
    'sb-refresh-token',
    // Additional possible cookie names
    'supabase-auth-token',
    'supabase.auth.token',
  ];

  // Add project ID-based cookie if available
  if (process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID) {
    authCookieKeys.push(`sb-${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}-auth-token`);
  }

  authCookieKeys.forEach(cookieName => {
    if (cookieName.includes('undefined') || !cookieName) {
      console.warn(
        `[clearAuthCookies] Attempted to clear undefined cookie name: ${cookieName}. Skipping.`,
      );
      return;
    }

    // Clear cookie with comprehensive attributes
    response.cookies.delete({
      name: cookieName,
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? undefined : undefined,
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false, // Supabase auth cookies are typically not httpOnly
      sameSite: 'lax',
    });
  });
}
