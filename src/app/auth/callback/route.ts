import { NextRequest, NextResponse } from 'next/server';
import { SupabaseClientFactory } from '@/lib/supabase/client-factory';
import { ValidationSchemas } from '@/lib/validations';

/**
 * GET /auth/callback
 * Handles Supabase Auth callback for OAuth redirects and email confirmations
 * This route handles direct browser navigation and returns NextResponse redirects
 */
export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const error = requestUrl.searchParams.get('error');
    const errorDescription = requestUrl.searchParams.get('error_description');
    const errorCode = requestUrl.searchParams.get('error_code');

    // Check for errors in URL parameters first
    if (error) {
      console.error('Auth callback error from URL:', {
        error,
        errorDescription,
        errorCode,
      });

      // Build error URL with parameters for proper display
      const errorUrl = new URL('/auth/error', request.url);
      if (error) errorUrl.searchParams.set('error', error);
      if (errorDescription) errorUrl.searchParams.set('error_description', errorDescription);
      if (errorCode) errorUrl.searchParams.set('error_code', errorCode);

      return NextResponse.redirect(errorUrl);
    }

    if (!code) {
      console.error('Auth callback: Authorization code not provided');
      const errorUrl = new URL('/auth/error', request.url);
      errorUrl.searchParams.set('error', 'missing_code');
      errorUrl.searchParams.set('error_description', 'Authorization code not provided');
      return NextResponse.redirect(errorUrl);
    }

    // Validate the authorization code
    try {
      ValidationSchemas.auth.authCallback.parse({ code });
    } catch (validationError) {
      console.error('Auth callback: Invalid authorization code format', validationError);
      const errorUrl = new URL('/auth/error', request.url);
      errorUrl.searchParams.set('error', 'invalid_code');
      errorUrl.searchParams.set('error_description', 'Invalid authorization code format');
      return NextResponse.redirect(errorUrl);
    }

    const supabase = await SupabaseClientFactory.getServerClient();

    // Exchange the auth code for a session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Failed to exchange code for session:', exchangeError);
      const errorUrl = new URL('/auth/error', request.url);
      errorUrl.searchParams.set('error', 'exchange_failed');
      errorUrl.searchParams.set(
        'error_description',
        exchangeError.message || 'Failed to exchange authorization code',
      );
      return NextResponse.redirect(errorUrl);
    }

    // Successful authentication - redirect to home page
    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('Auth callback error:', error);
    const errorUrl = new URL('/auth/error', request.url);
    errorUrl.searchParams.set('error', 'callback_error');
    errorUrl.searchParams.set(
      'error_description',
      'An unexpected error occurred during authentication',
    );
    return NextResponse.redirect(errorUrl);
  }
}
