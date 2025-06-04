'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { Box, Container, Flex, Text, Heading, Button } from '@radix-ui/themes';
import { zodResolver } from '@hookform/resolvers/zod';
import { PersonIcon } from '@radix-ui/react-icons';
import { signUpSchema, type SignUpCredentials } from '@/lib/validations/auth';
import { useSignUp } from '@/lib/auth/auth-hooks';
import { useToast } from '@/providers/ToastProvider';
import { useRouter } from 'next/navigation';
import { StyledInput } from '@/components/forms';

export function SignUpForm() {
  const { signUp, isLoading, error } = useSignUp();
  const { toast } = useToast();
  const router = useRouter();
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
      toast(
        'Please check your email for a verification link. You will need to verify your email before signing in.',
        'success',
        'Email Verification Sent',
      );
      // Redirect after a short delay to let the user see the toast
      setTimeout(() => {
        router.push('/auth/sign-in');
      }, 4000);
    } else if (error) {
      toast(error, 'error', 'Registration Failed');
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
            <StyledInput
              id="full_name"
              label="Full Name"
              placeholder="Enter your full name"
              disabled={isLoading}
              register={register('full_name')}
              error={errors.full_name}
              icon={PersonIcon}
              required
            />

            <StyledInput
              id="nickname"
              label="Nickname"
              placeholder="Choose a nickname"
              disabled={isLoading}
              register={register('nickname')}
              error={errors.nickname}
              icon={PersonIcon}
              required
            />

            <StyledInput
              id="email"
              type="email"
              label="Email"
              placeholder="Enter your email"
              disabled={isLoading}
              register={register('email')}
              error={errors.email}
              required
            />

            <StyledInput
              id="password"
              type="password"
              label="Password"
              placeholder="Create a password"
              disabled={isLoading}
              register={register('password')}
              error={errors.password}
              required
            />

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
