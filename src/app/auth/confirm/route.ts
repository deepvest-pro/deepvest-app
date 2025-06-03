import { NextResponse, type NextRequest } from 'next/server';
import { type EmailOtpType } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * Route handler for email confirmation links
 * This handles verification of email links sent by Supabase Auth
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/';

  if (token_hash && type) {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      // Redirect to the specified next URL or home page
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Redirect to error page if verification fails
  return NextResponse.redirect(new URL('/auth/error', request.url));
}
