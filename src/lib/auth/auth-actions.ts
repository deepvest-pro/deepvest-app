'use server';

import type {
  SignInCredentials,
  SignUpCredentials,
  ResetPasswordRequest,
  UpdatePasswordRequest,
  ProfileUpdateData,
} from '../validations/auth';
import { SupabaseClientFactory } from '@/lib/supabase/client-factory';

export async function signIn(credentials: SignInCredentials) {
  try {
    const supabase = await SupabaseClientFactory.getServerClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Sign in error:', err);
    return { error: 'Failed to sign in' };
  }
}

export async function signUp(credentials: SignUpCredentials) {
  try {
    const supabase = await SupabaseClientFactory.getServerClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        data: {
          full_name: credentials.full_name,
          nickname: credentials.nickname,
        },
      },
    });

    if (authError) {
      return { error: authError.message };
    }

    // Log successful registration
    if (authData.user) {
      console.log('User registered successfully:', authData.user.id);
    }

    return { success: true };
  } catch (err) {
    console.error('Sign up error:', err);
    return { error: 'Failed to sign up' };
  }
}

export async function signOut() {
  try {
    const supabase = await SupabaseClientFactory.getServerClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Sign out error:', err);
    return { error: 'Failed to sign out' };
  }
}

export async function resetPassword(request: ResetPasswordRequest) {
  try {
    const supabase = await SupabaseClientFactory.getServerClient();

    const { error } = await supabase.auth.resetPasswordForEmail(request.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Password reset error:', err);
    return { error: 'Failed to send password reset email' };
  }
}

export async function updatePassword(request: UpdatePasswordRequest) {
  try {
    const supabase = await SupabaseClientFactory.getServerClient();

    const { error } = await supabase.auth.updateUser({
      password: request.password,
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Update password error:', err);
    return { error: 'Failed to update password' };
  }
}

export async function updateProfile(profileData: ProfileUpdateData) {
  try {
    const supabase = await SupabaseClientFactory.getServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: 'User not authenticated' };
    }

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update(profileData)
      .eq('id', user.id);

    if (updateError) {
      return { error: updateError.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Profile update error:', err);
    return { error: 'Failed to update profile' };
  }
}
