'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Box, Container, Flex, Text, Heading, Button } from '@radix-ui/themes';
import { ExclamationTriangleIcon, ArrowLeftIcon } from '@radix-ui/react-icons';

interface AuthErrorProps {
  title?: string;
  message?: string;
  showSignInLink?: boolean;
  showHomeLink?: boolean;
}

export function AuthError({
  title,
  message,
  showSignInLink = true,
  showHomeLink = true,
}: AuthErrorProps) {
  const searchParams = useSearchParams();

  // Get error details from URL parameters
  const urlError = searchParams.get('error');
  const urlErrorDescription = searchParams.get('error_description');
  const urlErrorCode = searchParams.get('error_code');

  // Determine error title and message based on URL parameters
  const getErrorTitle = () => {
    if (title) return title;

    switch (urlError) {
      case 'access_denied':
        return 'Access Denied';
      case 'otp_expired':
        return 'Link Expired';
      case 'invalid_code':
        return 'Invalid Code';
      case 'exchange_failed':
        return 'Authentication Failed';
      case 'missing_code':
        return 'Missing Authorization';
      default:
        return 'Authentication Error';
    }
  };

  const getErrorMessage = () => {
    if (message) return message;

    if (urlErrorDescription) {
      // Decode URL-encoded description
      return decodeURIComponent(urlErrorDescription.replace(/\+/g, ' '));
    }

    switch (urlError) {
      case 'access_denied':
        if (urlErrorCode === 'otp_expired') {
          return 'Your email confirmation link has expired. Please request a new confirmation email or try signing up again.';
        }
        return 'Access to your account was denied. Please check your credentials and try again.';
      case 'otp_expired':
        return 'Your email confirmation link has expired. Please request a new confirmation email or try signing up again.';
      case 'invalid_code':
        return 'The authorization code is invalid or malformed. Please try signing in again.';
      case 'exchange_failed':
        return 'Failed to complete authentication. The authorization code may be invalid or expired.';
      case 'missing_code':
        return 'Authorization code is missing. Please try signing in again.';
      default:
        return 'Sorry, there was a problem with your authentication request. This could be due to an expired link or invalid token.';
    }
  };

  const errorTitle = getErrorTitle();
  const errorMessage = getErrorMessage();

  return (
    <Container size="2" p="6">
      <Flex direction="column" align="center" gap="6">
        <Box
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'var(--amber-3)',
            color: 'var(--amber-9)',
          }}
        >
          <ExclamationTriangleIcon width="40" height="40" />
        </Box>

        <Heading size="7" align="center">
          {errorTitle}
        </Heading>

        <Text size="3" color="gray" align="center" style={{ maxWidth: '600px' }}>
          {errorMessage}
        </Text>

        {urlError === 'access_denied' && urlErrorCode === 'otp_expired' && (
          <Text size="2" color="amber" align="center" style={{ maxWidth: '600px' }}>
            Please check your email for a new confirmation link or try registering again.
          </Text>
        )}

        <Flex gap="4">
          {showSignInLink && (
            <Link href="/auth/sign-in">
              <Button size="3">Sign In</Button>
            </Link>
          )}

          {showHomeLink && (
            <Link href="/">
              <Button variant="soft" size="3">
                <ArrowLeftIcon width="16" height="16" />
                Go Home
              </Button>
            </Link>
          )}
        </Flex>
      </Flex>
    </Container>
  );
}
