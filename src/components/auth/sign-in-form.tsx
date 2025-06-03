'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Container, Flex, Text, Heading, Button } from '@radix-ui/themes';
import { signInSchema, type SignInCredentials } from '@/lib/validations/auth';
import { useSignIn } from '@/lib/auth/auth-hooks';
import { OAuthButtons } from './oauth-buttons';

export function SignInForm() {
  const { signIn, isLoading, error } = useSignIn();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInCredentials>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: SignInCredentials) => {
    const result = await signIn(data);

    if (result.success) {
      setShowSuccessMessage(true);
    }
  };

  return (
    <Container size="1" p="4">
      <Flex direction="column" gap="5">
        <Box style={{ textAlign: 'center', marginBottom: '16px' }}>
          <Heading size="6" mb="1">
            Sign In
          </Heading>
          <Text color="gray" size="2">
            Welcome back! Sign in to your account
          </Text>
        </Box>

        {/* OAuth Buttons */}
        <OAuthButtons />

        <Box position="relative" my="4">
          <Box style={{ height: '1px', backgroundColor: 'var(--gray-5)', width: '100%' }} />
          <Box
            position="absolute"
            top="0"
            style={{ left: '50%', transform: 'translate(-50%, -50%)' }}
          >
            <Text size="1" color="gray" style={{ backgroundColor: 'white', padding: '0 8px' }}>
              Or continue with email
            </Text>
          </Box>
        </Box>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Flex direction="column" gap="4">
            {error && (
              <Box
                p="3"
                style={{
                  backgroundColor: 'var(--red-3)',
                  color: 'var(--red-11)',
                  borderRadius: '6px',
                }}
              >
                <Text size="2">{error}</Text>
              </Box>
            )}

            {showSuccessMessage && (
              <Box
                p="3"
                style={{
                  backgroundColor: 'var(--green-3)',
                  color: 'var(--green-11)',
                  borderRadius: '6px',
                }}
              >
                <Text size="2">Successfully signed in!</Text>
              </Box>
            )}

            <Box>
              <Text
                as="label"
                size="2"
                weight="medium"
                htmlFor="email"
                style={{ display: 'block', marginBottom: '4px' }}
              >
                Email
              </Text>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid var(--gray-6)',
                  fontSize: '14px',
                }}
                {...register('email')}
              />
              {errors.email && (
                <Text size="1" color="red" style={{ marginTop: '4px' }}>
                  {errors.email.message}
                </Text>
              )}
            </Box>

            <Box>
              <Flex justify="between" align="center" style={{ marginBottom: '4px' }}>
                <Text as="label" size="2" weight="medium" htmlFor="password">
                  Password
                </Text>
                <Link href="/auth/reset-password">
                  <Text size="1" color="blue" style={{ textDecoration: 'none' }}>
                    Forgot password?
                  </Text>
                </Link>
              </Flex>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                disabled={isLoading}
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid var(--gray-6)',
                  fontSize: '14px',
                }}
                {...register('password')}
              />
              {errors.password && (
                <Text size="1" color="red" style={{ marginTop: '4px' }}>
                  {errors.password.message}
                </Text>
              )}
            </Box>

            <Button size="3" type="submit" disabled={isLoading} style={{ marginTop: '8px' }}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>

            <Flex justify="center" align="center" style={{ marginTop: '16px' }}>
              <Text size="2" color="gray">
                Don&apos;t have an account?{' '}
                <Link href="/auth/sign-up">
                  <Text size="2" color="blue" style={{ textDecoration: 'none' }}>
                    Sign up
                  </Text>
                </Link>
              </Text>
            </Flex>
          </Flex>
        </form>
      </Flex>
    </Container>
  );
}
