'use server';

import { SupabaseClientFactory } from "@/lib/supabase/client-factory";

/**
 * Fetches all users with their profiles
 * Can be used with React Query on the server
 */
export async function fetchUsers() {
  try {
    const supabase = await SupabaseClientFactory.getServerClient();

    const { data, error } = await supabase.from('user_profiles').select('*');

    if (error) {
      console.error('Error fetching users:', error.message);
      throw new Error('Failed to fetch users');
    }

    return data;
  } catch (error) {
    console.error('Error in fetchUsers:', error);
    throw new Error('Failed to fetch users');
  }
}

/**
 * Fetches a specific user by ID
 * Can be used with React Query on the server
 */
export async function fetchUserById(userId: string) {
  try {
    const supabase = await SupabaseClientFactory.getServerClient();

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
  } catch (error) {
    console.error(`Error in fetchUserById for ${userId}:`, error);
    throw new Error('Failed to fetch user');
  }
}
