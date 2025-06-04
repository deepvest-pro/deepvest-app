'use client';

import React from 'react';
import { Card, Heading, Text, Flex, Code, Box } from '@radix-ui/themes';
import { CivicLoginButton } from '@/components/auth/CivicLoginButton';
import { CivicLogoutButton } from '@/components/auth/CivicLogoutButton';
import { useCivicAuth } from '@/lib/hooks/useCivicAuth';

export default function CivicAuthDemo() {
  const { user, isAuthenticated, error } = useCivicAuth();

  // Format user data for display
  const userDataString = isAuthenticated && user ? JSON.stringify(user, null, 2) : '{}';

  return (
    <Flex direction="column" gap="6" align="center" justify="center" style={{ padding: '2rem' }}>
      <Heading size="6">Civic Auth Integration Demo</Heading>

      <Card size="3" style={{ width: '100%', maxWidth: '800px' }}>
        <Flex direction="column" gap="4">
          <Heading as="h2" size="4">
            Authentication Status
          </Heading>
          <Text as="p" size="3" weight={isAuthenticated ? 'bold' : 'regular'}>
            {isAuthenticated ? '✅ Authenticated with Civic' : '❌ Not authenticated'}
          </Text>

          {error && (
            <Text as="p" color="red" size="2">
              Error: {error}
            </Text>
          )}

          <Flex gap="4" wrap="wrap">
            <CivicLoginButton redirectTo="/auth/demo" label="Login with Civic" />

            <CivicLogoutButton redirectTo="/auth/demo" label="Logout" />
          </Flex>
        </Flex>
      </Card>

      {isAuthenticated && (
        <Card size="3" style={{ width: '100%', maxWidth: '800px' }}>
          <Flex direction="column" gap="4">
            <Heading as="h2" size="4">
              User Data
            </Heading>
            <Box>
              <Code size="2" style={{ display: 'block', whiteSpace: 'pre-wrap' }}>
                {userDataString}
              </Code>
            </Box>
          </Flex>
        </Card>
      )}

      <Card size="3" style={{ width: '100%', maxWidth: '800px' }}>
        <Flex direction="column" gap="4">
          <Heading as="h2" size="4">
            Implementation Details
          </Heading>
          <Text as="p" size="2">
            This demo showcases the integration of Civic Auth with Supabase in our Next.js
            application. The authentication flow works as follows:
          </Text>

          <Text size="2">
            <li>
              User clicks &quot;Login with Civic&quot; and authenticates through the Civic Auth
              system
            </li>
            <li>
              After successful Civic authentication, our custom API endpoint links the Civic account
              with Supabase
            </li>
            <li>The user is now authenticated in both systems</li>
            <li>The logout flow signs the user out from both Civic and Supabase</li>
          </Text>
        </Flex>
      </Card>
    </Flex>
  );
}
