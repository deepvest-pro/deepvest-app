'use client';

import Link from 'next/link';
import { Box, Container, Flex, Text, Heading, Button } from '@radix-ui/themes';
import { ExclamationTriangleIcon, ArrowLeftIcon } from '@radix-ui/react-icons';

interface AuthErrorProps {
  title?: string;
  message?: string;
  showSignInLink?: boolean;
  showHomeLink?: boolean;
}

export function AuthError({
  title = 'Authentication Error',
  message = 'Sorry, there was a problem with your authentication request. This could be due to an expired link or invalid token.',
  showSignInLink = true,
  showHomeLink = true,
}: AuthErrorProps) {
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
          {title}
        </Heading>

        <Text size="3" color="gray" align="center" style={{ maxWidth: '600px' }}>
          {message}
        </Text>

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
