'use server';

import { cookies } from 'next/headers';
// import { createClient } from '@supabase/supabase-js'; // No longer used directly
// import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'; // Old helper
import { createServerClient } from '@supabase/ssr'; // New helper from @supabase/ssr
import type { Database } from '@/types/supabase';
import type { UserData } from '@/types/auth';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

/**
 * Creates a Supabase client for server components (pages, layouts, server actions).
 * This client is primarily for reading session and data.
 * Uses createServerClient from @supabase/ssr for proper Next.js integration.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                cookieStore.set(name, value, options);
              } catch {
                // Individual cookie setting failed - this is expected in Server Components
                // and can be safely ignored as middleware handles session refresh
              }
            });
          } catch {
            // The `setAll` method was called from a Server Component.
            // This is expected behavior and can be safely ignored
            // as middleware handles session refresh
          }
        },
      },
    },
  );
}

/*
/**
 * Creates a Supabase client with custom cookie storage logic.
 * This might be more suitable for contexts like Route Handlers or specific scenarios
 * where direct cookie manipulation (get/set/remove) is needed and auth-helpers defaults are insufficient.
 * CAUTION: Prone to issues like "cookies() should be awaited" if cookieStore is not handled carefully.
 */
/*
// Commented out as it was causing issues and is replaced by createSupabaseServerClient from @supabase/ssr
export async function createServerSupabaseClientWithCustomStorage() {
  // ...
}
*/

/**
 * Get current user
 */
export async function getCurrentUser() {
  try {
    const supabase = await createSupabaseServerClient(); // Uses the new @supabase/ssr client
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      // console.warn('[getCurrentUser] No user found or error:', error?.message);
      return null;
    }

    return data.user;
  } catch (error) {
    console.error('[getCurrentUser] Error getting current user:', error);
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
 * Get user data with profile
 */
export async function getUserWithProfile(): Promise<UserData | null> {
  try {
    const supabase = await createSupabaseServerClient(); // Uses the new @supabase/ssr client

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
      console.error('[getUserWithProfile] Error fetching profile:', profileError);
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
    console.error('[getUserWithProfile] Error getting user with profile:', error);
    return null;
  }
}
