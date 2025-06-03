'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { Box, Container, Flex, Text, Heading, Button } from '@radix-ui/themes';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordRequest } from '@/lib/validations/auth';
import { resetPassword } from '@/lib/supabase/auth-actions';

export function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordRequest>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ResetPasswordRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await resetPassword(data);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Container size="1" p="4">
        <Flex direction="column" gap="5" align="center">
          <Heading size="6" mb="1">
            Password Reset Email Sent
          </Heading>
          <Text color="gray" size="2" align="center">
            If an account exists with this email, you will receive instructions to reset your
            password.
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
            Reset Password
          </Heading>
          <Text color="gray" size="2">
            Enter your email address and we&apos;ll send you instructions to reset your password.
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

            <Button size="3" type="submit" disabled={isLoading} style={{ marginTop: '8px' }}>
              {isLoading ? 'Sending...' : 'Send Reset Instructions'}
            </Button>

            <Flex justify="center" align="center" style={{ marginTop: '16px' }}>
              <Text size="2" color="gray">
                Remember your password?{' '}
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
