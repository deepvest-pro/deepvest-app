'use server';

import { cache } from 'react';
import { createServerSupabaseClient } from '../supabase/server';

/**
 * Cached function to get the current session
 * This uses React's cache() to prevent duplicate requests
 */
export const getSessionData = cache(async () => {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Error getting session:', error.message);
    return null;
  }

  return data.session;
});

/**
 * Cached function to get the current user and their profile
 * This uses React's cache() to prevent duplicate requests
 */
export const getUserData = cache(async () => {
  const supabase = await createServerSupabaseClient();

  // Get user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    console.error('Error fetching profile:', profileError.message);
  }

  return {
    user,
    profile: profile || null,
  };
});

/**
 * Fetches all users with their profiles
 * Can be used with React Query on the server
 */
export async function fetchUsers() {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.from('user_profiles').select('*');

  if (error) {
    console.error('Error fetching users:', error.message);
    throw new Error('Failed to fetch users');
  }

  return data;
}

/**
 * Fetches a specific user by ID
 * Can be used with React Query on the server
 */
export async function fetchUserById(userId: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error(`Error fetching user ${userId}:`, error.message);
    throw new Error('Failed to fetch user');
  }

  return data;
}
