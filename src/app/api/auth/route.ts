import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { AUTH_PROVIDERS, type AuthProvider } from '@/lib/supabase/config';

export async function GET(request: NextRequest) {
  // Get provider from query parameters
  const url = new URL(request.url);
  const provider = url.searchParams.get('provider');

  if (!provider) {
    return NextResponse.json({ error: 'Provider parameter is required' }, { status: 400 });
  }

  const validProviders = Object.values(AUTH_PROVIDERS);

  // Validate provider
  if (!validProviders.includes(provider as AuthProvider)) {
    return NextResponse.json({ error: 'Invalid authentication provider' }, { status: 400 });
  }

  const callbackUrl = `${url.origin}/auth/callback`;

  const supabase = await createServerSupabaseClient();

  // Initiate OAuth sign-in
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as AuthProvider,
    options: {
      redirectTo: callbackUrl,
    },
  });

  if (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(new URL('/auth/error', request.url));
  }

  // Redirect to the provider's authorization URL
  if (data.url) {
    return NextResponse.redirect(data.url);
  }

  // If no URL was returned, redirect to error
  return NextResponse.redirect(new URL('/auth/error', request.url));
}
