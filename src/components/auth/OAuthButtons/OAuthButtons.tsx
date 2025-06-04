'use client';

import { useState } from 'react';
import { Flex, Box, Text, Button } from '@radix-ui/themes';
import { AUTH_PROVIDERS, type AuthProvider } from '@/lib/supabase/config';

interface OAuthButtonsProps {
  className?: string;
}

export function OAuthButtons({ className = '' }: OAuthButtonsProps) {
  const [isLoading, setIsLoading] = useState<AuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOAuthSignIn = async (provider: AuthProvider) => {
    setIsLoading(provider);
    setError(null);

    try {
      // Redirect to the server route that handles OAuth login
      window.location.href = `/api/auth?provider=${provider}`;
    } catch (err) {
      console.error('OAuth error:', err);
      setError('Failed to sign in with provider. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <Flex direction="column" gap="3" className={className}>
      {error && (
        <Box
          p="3"
          style={{ backgroundColor: 'var(--red-3)', color: 'var(--red-11)', borderRadius: '6px' }}
        >
          <Text size="2">{error}</Text>
        </Box>
      )}

      <Button
        size="3"
        variant="outline"
        onClick={() => handleOAuthSignIn(AUTH_PROVIDERS.GOOGLE)}
        disabled={isLoading !== null}
        style={{
          justifyContent: 'center',
          gap: '8px',
          padding: '12px 16px',
          backgroundColor: 'white',
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <Text style={{ color: 'var(--gray-12)' }}>
          {isLoading === AUTH_PROVIDERS.GOOGLE ? 'Signing in...' : 'Continue with Google'}
        </Text>
      </Button>

      <Button
        size="3"
        variant="outline"
        onClick={() => handleOAuthSignIn(AUTH_PROVIDERS.GITHUB)}
        disabled={isLoading !== null}
        style={{
          justifyContent: 'center',
          gap: '8px',
          padding: '12px 16px',
          backgroundColor: 'white',
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
          <path
            fill="#24292e"
            d="M12 1.27a11 11 0 00-3.48 21.46c.55.09.73-.24.73-.53v-1.85c-2.98.66-3.61-1.44-3.61-1.44-.49-1.25-1.2-1.58-1.2-1.58-.98-.67.07-.66.07-.66 1.08.08 1.65 1.11 1.65 1.11.96 1.65 2.52 1.17 3.13.9.1-.7.37-1.17.68-1.44-2.38-.27-4.88-1.19-4.88-5.3 0-1.17.42-2.13 1.11-2.88-.11-.27-.48-1.37.11-2.85 0 0 .9-.29 2.96 1.1.86-.24 1.78-.36 2.7-.36.92 0 1.84.12 2.7.36 2.06-1.39 2.96-1.1 2.96-1.1.59 1.48.22 2.58.11 2.85.69.75 1.1 1.71 1.1 2.88 0 4.12-2.5 5.03-4.89 5.29.38.33.73.97.73 1.96v2.92c0 .29.18.63.74.52A11 11 0 0012 1.27"
          />
        </svg>
        <Text style={{ color: 'var(--gray-12)' }}>
          {isLoading === AUTH_PROVIDERS.GITHUB ? 'Signing in...' : 'Continue with GitHub'}
        </Text>
      </Button>

      <Button
        size="3"
        variant="outline"
        onClick={() => handleOAuthSignIn(AUTH_PROVIDERS.LINKEDIN)}
        disabled={isLoading !== null}
        style={{
          justifyContent: 'center',
          gap: '8px',
          padding: '12px 16px',
          backgroundColor: 'white',
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
          <path
            fill="#0077B5"
            d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
          />
        </svg>
        <Text style={{ color: 'var(--gray-12)' }}>
          {isLoading === AUTH_PROVIDERS.LINKEDIN ? 'Signing in...' : 'Continue with LinkedIn'}
        </Text>
      </Button>

      <Button
        size="3"
        variant="outline"
        onClick={() => handleOAuthSignIn(AUTH_PROVIDERS.TWITTER)}
        disabled={isLoading !== null}
        style={{
          justifyContent: 'center',
          gap: '8px',
          padding: '12px 16px',
          backgroundColor: 'white',
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
          <path
            fill="#1DA1F2"
            d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"
          />
        </svg>
        <Text style={{ color: 'var(--gray-12)' }}>
          {isLoading === AUTH_PROVIDERS.TWITTER ? 'Signing in...' : 'Continue with Twitter'}
        </Text>
      </Button>
    </Flex>
  );
}
