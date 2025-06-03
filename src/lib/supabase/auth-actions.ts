'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from './client';
import {
  SignInCredentials,
  SignUpCredentials,
  ResetPasswordRequest,
  UpdatePasswordRequest,
  ProfileUpdateData,
} from '../validations/auth';

/**
 * Sign in a user with email and password
 */
export async function signIn(credentials: SignInCredentials) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

/**
 * Sign up a new user with email and password
 */
export async function signUp(credentials: SignUpCredentials) {
  const supabase = await createSupabaseServerClient();

  // First register the user with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  // Then create user profile in our database
  if (authData.user) {
    const { error: profileError } = await supabase.from('user_profiles').insert({
      id: authData.user.id,
      full_name: credentials.full_name,
      nickname: credentials.nickname,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      // Consider deleting the auth user if profile creation fails
      return { error: 'Failed to create user profile' };
    }
  }

  return { success: true };
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

/**
 * Request a password reset for a user
 */
export async function resetPassword(request: ResetPasswordRequest) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.resetPasswordForEmail(request.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

/**
 * Update a user's password after reset
 */
export async function updatePassword(request: UpdatePasswordRequest) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.updateUser({
    password: request.password,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

/**
 * Update a user's profile data
 */
export async function updateProfile(data: ProfileUpdateData) {
  const supabase = await createSupabaseServerClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: 'User not authenticated' };
  }

  // Update profile in database
  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  revalidatePath(`/users/${user.id}`);
  revalidatePath('/profile');

  return { success: true };
}
