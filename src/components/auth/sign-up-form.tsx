'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { Box, Container, Flex, Text, Heading, Button } from '@radix-ui/themes';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema, type SignUpCredentials } from '@/lib/validations/auth';
import { useSignUp } from '@/lib/auth/auth-hooks';

export function SignUpForm() {
  const { signUp, isLoading, error } = useSignUp();
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpCredentials>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      full_name: '',
      nickname: '',
    },
  });

  const onSubmit = async (data: SignUpCredentials) => {
    const result = await signUp(data);

    if (result.success) {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <Container size="1" p="4">
        <Flex direction="column" gap="5" align="center">
          <Heading size="6" mb="1">
            Email Verification Sent
          </Heading>
          <Text color="gray" size="2" align="center">
            Please check your email for a verification link. You will need to verify your email
            before signing in.
          </Text>
          <Link href="/auth/sign-in">
            <Text color="blue" style={{ textDecoration: 'none' }}>
              Return to sign in
            </Text>
          </Link>
        </Flex>
      </Container>
    );
  }

  return (
    <Container size="1" p="4">
      <Flex direction="column" gap="5">
        <Box style={{ textAlign: 'center', marginBottom: '16px' }}>
          <Heading size="6" mb="1">
            Create Account
          </Heading>
          <Text color="gray" size="2">
            Sign up to get started with DeepVest
          </Text>
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

            <Box>
              <Text
                as="label"
                size="2"
                weight="medium"
                htmlFor="full_name"
                style={{ display: 'block', marginBottom: '4px' }}
              >
                Full Name
              </Text>
              <input
                id="full_name"
                type="text"
                placeholder="Enter your full name"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid var(--gray-6)',
                  fontSize: '14px',
                }}
                {...register('full_name')}
              />
              {errors.full_name && (
                <Text size="1" color="red" style={{ marginTop: '4px' }}>
                  {errors.full_name.message}
                </Text>
              )}
            </Box>

            <Box>
              <Text
                as="label"
                size="2"
                weight="medium"
                htmlFor="nickname"
                style={{ display: 'block', marginBottom: '4px' }}
              >
                Nickname
              </Text>
              <input
                id="nickname"
                type="text"
                placeholder="Choose a nickname"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid var(--gray-6)',
                  fontSize: '14px',
                }}
                {...register('nickname')}
              />
              {errors.nickname && (
                <Text size="1" color="red" style={{ marginTop: '4px' }}>
                  {errors.nickname.message}
                </Text>
              )}
            </Box>

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
              <Text
                as="label"
                size="2"
                weight="medium"
                htmlFor="password"
                style={{ display: 'block', marginBottom: '4px' }}
              >
                Password
              </Text>
              <input
                id="password"
                type="password"
                placeholder="Create a password"
                disabled={isLoading}
                autoComplete="new-password"
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
              {isLoading ? 'Creating account...' : 'Sign Up'}
            </Button>

            <Flex justify="center" align="center" style={{ marginTop: '16px' }}>
              <Text size="2" color="gray">
                Already have an account?{' '}
                <Link href="/auth/sign-in">
                  <Text size="2" color="blue" style={{ textDecoration: 'none' }}>
                    Sign in
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
