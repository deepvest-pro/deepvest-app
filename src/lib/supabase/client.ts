'use server';

import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import type { UserData, UserProfile } from '@/types/auth';

/**
 * Creates a Supabase client for server components and server actions
 * Uses private environment variables (without the NEXT_PUBLIC_ prefix)
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey =
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    throw new Error('Missing Supabase environment variables');
  }

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      flowType: 'pkce',
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: {
        getItem: (key: string) => {
          const cookie = cookieStore.get(key);
          return cookie?.value ?? null;
        },
        setItem: (key: string, value: string) => {
          try {
            cookieStore.set(key, value);
          } catch {
            // Ignore errors when setting cookies from a server component
          }
        },
        removeItem: (key: string) => {
          try {
            cookieStore.set(key, '', { maxAge: 0 });
          } catch {
            // Ignore errors when deleting cookies from a server component
          }
        },
      },
    },
  });
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return null;
    }

    return data.user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Get current session
 */
export async function getCurrentSession() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.getSession();

    if (error || !data?.session) {
      return null;
    }

    return data.session;
  } catch (error) {
    console.error('Error getting current session:', error);
    return null;
  }
}

/**
 * Get user data with profile
 */
export async function getUserWithProfile(): Promise<UserData | null> {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      return null;
    }

    const { data, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
    }

    const profile: UserProfile | null = data
      ? {
          id: data.id,
          full_name: data.full_name,
          nickname: data.nickname,
          avatar_url: data.avatar_url,
          bio: data.bio,
          professional_background: data.professional_background,
          city: data.city,
          country: data.country,
          website_url: data.website_url,
          x_username: data.x_username,
          linkedin_username: data.linkedin_username,
          github_username: data.github_username,
          startup_ecosystem_role: data.startup_ecosystem_role,
        }
      : null;

    return {
      user: userData.user,
      profile,
    };
  } catch (error) {
    console.error('Error getting user with profile:', error);
    return null;
  }
}
