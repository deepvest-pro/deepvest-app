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
    const { error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.warn('[updateSession] Error getting session:', sessionError.message);
      if (
        sessionError.message?.includes('Invalid Refresh Token') ||
        sessionError.message?.includes('refresh_token_already_used')
      ) {
        console.warn(
          '[updateSession] Invalid refresh token detected. Clearing auth cookies and redirecting to sign-in.',
        );
        const redirectResponse = NextResponse.redirect(new URL('/auth/sign-in', request.url));
        clearAuthCookies(redirectResponse); // clearAuthCookies now needs to operate on NextResponse directly
        return redirectResponse;
      }
    }
  } catch (error) {
    console.error('[updateSession] Unexpected error:', error);
  }

  return response;
}

function clearAuthCookies(response: NextResponse) {
  const authCookieKeys = [
    // Construct the project-specific auth token cookie name
    `sb-${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}-auth-token`,
    // Add any other generic or older cookie names if necessary
    'sb-access-token',
    'sb-refresh-token',
  ];

  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('.')[0].split('//')[1];
  if (projectRef && projectRef !== process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID) {
    authCookieKeys.push(`sb-${projectRef}-auth-token`);
  }

  authCookieKeys.forEach(cookieName => {
    if (cookieName.includes('undefined')) {
      // Avoid setting cookies with "sb-undefined-auth-token"
      console.warn(
        `[clearAuthCookies] Attempted to clear undefined cookie name: ${cookieName}. Skipping.`,
      );
      return;
    }
    response.cookies.delete({
      name: cookieName,
      path: '/',
      // Ensure all relevant cookie attributes are set for deletion if they were set during creation
      // domain: process.env.NODE_ENV === 'production' ? process.env.DOMAIN || undefined : undefined,
      // secure: process.env.NODE_ENV === 'production',
      // httpOnly: true,
      // sameSite: 'lax',
    });
  });
}
