import { NextResponse, type NextRequest } from 'next/server';
import { type EmailOtpType } from '@supabase/supabase-js';
import { SupabaseClientFactory } from '@/lib/supabase/client-factory';
import { ValidationSchemas } from '@/lib/validations';

/**
 * GET /auth/confirm
 * Handles email confirmation links for verification of email links sent by Supabase Auth
 * This route handles direct browser navigation and returns NextResponse redirects
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type') as EmailOtpType | null;
    const next = searchParams.get('next') ?? '/';

    // Basic validation of required parameters
    if (!token_hash || !type) {
      console.error('Auth confirm: Missing required parameters', {
        token_hash: !!token_hash,
        type,
      });
      return NextResponse.redirect(new URL('/auth/error', request.url));
    }

    // Validate parameters using schema
    try {
      ValidationSchemas.auth.emailConfirm.parse({
        token_hash,
        type,
        next: next || undefined,
      });
    } catch (validationError) {
      console.error('Auth confirm: Invalid parameters format', validationError);
      return NextResponse.redirect(new URL('/auth/error', request.url));
    }

    const supabase = await SupabaseClientFactory.getServerClient();

    // Verify the OTP token
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (error) {
      console.error('Failed to verify OTP token:', error);
      return NextResponse.redirect(new URL('/auth/error', request.url));
    }

    // Successful verification - redirect to the specified next URL or home page
    const redirectUrl = next ? new URL(next, request.url) : new URL('/', request.url);
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Auth confirm error:', error);
    return NextResponse.redirect(new URL('/auth/error', request.url));
  }
}
