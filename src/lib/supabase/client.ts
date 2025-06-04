'use server';

import type { Database } from '@/types/supabase';
import type { UserData } from '@/types/auth';
import { SupabaseClientFactory } from './client-factory';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

/*
/**
 * Creates a Supabase client with custom cookie storage logic.
 * This might be more suitable for contexts like Route Handlers or specific scenarios
 * where direct cookie manipulation (get/set/remove) is needed and auth-helpers defaults are insufficient.
 * CAUTION: Prone to issues like "cookies() should be awaited" if cookieStore is not handled carefully.
 */

/**
 * Get current user using the factory client
 */
export async function getCurrentUser() {
  try {
    const supabase = await SupabaseClientFactory.getServerClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      // console.warn('[getCurrentUser] No user found or error:', error?.message);
      return null;
    }

    return data.user;
  } catch (error) {
    // Only log errors in development or if it's not a dynamic server usage error
    if (
      process.env.NODE_ENV === 'development' ||
      !(error instanceof Error && error.message?.includes('Dynamic server usage'))
    ) {
      console.error('[getCurrentUser] Error getting current user:', error);
    }
    return null;
  }
}

/**
 * Get current session (DEPRECATED - use getCurrentUser instead for security)
 * This function is deprecated and should not be used in new code.
 * Use getCurrentUser() instead which validates the user with the auth server.
 */
export async function getCurrentSession() {
  console.warn(
    '[getCurrentSession] DEPRECATED: This function is deprecated for security reasons. Use getCurrentUser() instead.',
  );

  // For security reasons, we no longer return session data from server-side code
  // Client-side code should use Supabase client hooks instead
  return null;
}

/**
 * Get user data with profile using the factory client
 */
export async function getUserWithProfile(): Promise<UserData | null> {
  try {
    const supabase = await SupabaseClientFactory.getServerClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      // console.warn('[getUserWithProfile] No user found or error during getUser:', userError?.message);
      return null;
    }

    const { data, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single<UserProfile>();

    if (profileError && profileError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is acceptable if profile doesn't exist yet
      if (process.env.NODE_ENV === 'development') {
        console.error('[getUserWithProfile] Error fetching profile:', profileError);
      }
      // Decide if you want to return null or user without profile here
    }

    const profile: UserProfile | null = data
      ? {
          id: data.id,
          created_at: data.created_at,
          updated_at: data.updated_at,
          full_name: data.full_name,
          nickname: data.nickname,
          avatar_url: data.avatar_url,
          cover_url: data.cover_url,
          bio: data.bio,
          professional_background: data.professional_background,
          startup_ecosystem_role: data.startup_ecosystem_role,
          country: data.country,
          city: data.city,
          website_url: data.website_url,
          x_username: data.x_username,
          linkedin_username: data.linkedin_username,
          github_username: data.github_username,
        }
      : null;

    return {
      user: userData.user,
      profile,
    };
  } catch (error) {
    // Only log errors in development or if it's not a dynamic server usage error
    if (
      process.env.NODE_ENV === 'development' ||
      !(error instanceof Error && error.message?.includes('Dynamic server usage'))
    ) {
      console.error('[getUserWithProfile] Error getting user with profile:', error);
    }
    return null;
  }
}
