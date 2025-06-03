'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';
import { useInvalidateAuthQueries } from '../react-query/auth-queries-client';
import {
  signInSchema,
  signUpSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  profileUpdateSchema,
} from '../validations/auth';
import type {
  SignInCredentials,
  SignUpCredentials,
  ResetPasswordRequest,
  UpdatePasswordRequest,
  ProfileUpdateData,
} from '../validations/auth';
import * as AuthActions from './auth-actions';

export function useSignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const invalidateAuth = useInvalidateAuthQueries();

  const signIn = async (credentials: SignInCredentials) => {
    try {
      signInSchema.parse(credentials);

      setIsLoading(true);
      setError(null);

      const result = await AuthActions.signIn(credentials);

      if (result.error) throw new Error(result.error);

      invalidateAuth();

      router.refresh();

      router.push('/profile');

      return { success: true };
    } catch (err) {
      console.error('Sign in error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return { signIn, isLoading, error };
}

export function useSignUp() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const invalidateAuth = useInvalidateAuthQueries();

  const signUp = async (credentials: SignUpCredentials) => {
    try {
      signUpSchema.parse(credentials);

      setIsLoading(true);
      setError(null);

      const result = await AuthActions.signUp(credentials);

      if (result.error) throw new Error(result.error);

      invalidateAuth();

      router.refresh();

      router.push('/auth/confirm');

      return { success: true };
    } catch (err) {
      console.error('Sign up error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign up';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return { signUp, isLoading, error };
}

export function useSignOut() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const invalidateAuth = useInvalidateAuthQueries();

  const signOut = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await AuthActions.signOut();

      if (result.error) throw new Error(result.error);

      invalidateAuth();

      router.refresh();

      router.push('/');

      return { success: true };
    } catch (err) {
      console.error('Sign out error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign out';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return { signOut, isLoading, error };
}

export function useResetPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetPassword = async (request: ResetPasswordRequest) => {
    try {
      resetPasswordSchema.parse(request);

      setIsLoading(true);
      setError(null);

      const result = await AuthActions.resetPassword(request);

      if (result.error) throw new Error(result.error);

      return { success: true };
    } catch (err) {
      console.error('Password reset error:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to send password reset email';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return { resetPassword, isLoading, error };
}

export function useUpdatePassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const invalidateAuth = useInvalidateAuthQueries();

  const updatePassword = async (request: UpdatePasswordRequest) => {
    try {
      updatePasswordSchema.parse(request);

      setIsLoading(true);
      setError(null);

      const result = await AuthActions.updatePassword(request);

      if (result.error) throw new Error(result.error);

      invalidateAuth();

      router.refresh();

      router.push('/auth/sign-in');

      return { success: true };
    } catch (err) {
      console.error('Update password error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update password';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return { updatePassword, isLoading, error };
}

export function useUpdateProfile() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { refreshUserData } = useAuth();
  const invalidateAuth = useInvalidateAuthQueries();

  const updateProfile = async (profileData: ProfileUpdateData) => {
    try {
      profileUpdateSchema.parse(profileData);

      setIsLoading(true);
      setError(null);

      const result = await AuthActions.updateProfile(profileData);

      if (result.error) throw new Error(result.error);

      await refreshUserData();

      invalidateAuth();

      router.refresh();

      router.push('/profile');

      return { success: true };
    } catch (err) {
      console.error('Profile update error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return { updateProfile, isLoading, error };
}
