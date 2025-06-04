import { NextRequest } from 'next/server';
import { createAPIHandler } from '@/lib/api/base-handler';
import { APIError } from '@/lib/api/middleware/auth';
import { SupabaseClientFactory } from '@/lib/supabase/client-factory';
import { ValidationSchemas } from '@/lib/validations';
import type { AuthProvider } from '@/lib/supabase/config';

interface OAuthResponse {
  url: string;
}

/**
 * GET /api/auth
 * Initiates OAuth authentication flow
 */
export const GET = createAPIHandler(async (request: NextRequest): Promise<OAuthResponse> => {
  const url = new URL(request.url);
  const provider = url.searchParams.get('provider');

  // Validate provider parameter
  const { provider: validatedProvider } = ValidationSchemas.auth.oauthProvider.parse({
    provider,
  });

  const callbackUrl = `${url.origin}/auth/callback`;
  const supabase = await SupabaseClientFactory.getServerClient();

  // Initiate OAuth sign-in
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: validatedProvider as AuthProvider,
    options: {
      redirectTo: callbackUrl,
    },
  });

  if (error) {
    console.error('OAuth error:', error);
    throw new APIError('Failed to initiate OAuth authentication', 500, 'OAUTH_INIT_ERROR');
  }

  // Check if authorization URL was returned
  if (!data.url) {
    throw new APIError('No authorization URL received from provider', 500, 'OAUTH_NO_URL');
  }

  return {
    url: data.url,
  };
});
